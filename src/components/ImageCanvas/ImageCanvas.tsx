import React, { useRef, useEffect, forwardRef, useState } from "react";
import { fabric } from "fabric";
import "./ImageCanvas.css";
import { useTranslation } from "react-i18next";

interface ImageCanvasProps {
  uploadedImage: string;
  onSegmentsUpdated?: (segmentedImageUrl: string) => void;
  onDeleteImage: () => void;
  showGrid?: boolean;
  gridSpacing?: number;
  toggleFrameEditability: () => void;
  numberPositions?: Array<{ x: number; y: number; number: number }>;
  onNumbersGenerated?: (
    positions: Array<{ x: number; y: number; number: number }>
  ) => void;
}

const ImageCanvas = forwardRef<HTMLCanvasElement | null, ImageCanvasProps>(
  (
    {
      uploadedImage,
      onSegmentsUpdated,
      onDeleteImage,
      showGrid = false,
      gridSpacing = 50,
      toggleFrameEditability,
      numberPositions = [],
      onNumbersGenerated,
    },
    ref
  ) => {
    const fabricCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const fabricCanvas = useRef<fabric.Canvas | null>(null);
    const mainImageRef = useRef<fabric.Image | null>(null);
    const [isGridVisible, setIsGridVisible] = useState(showGrid);
    const [isFrameEditable, setIsFrameEditable] = useState(false);
    const [colorRegions, setColorRegions] = useState<
      Array<{ color: string; points: Array<{ x: number; y: number }> }>
    >([]);
    const { t } = useTranslation();

    // Initialize canvas
    useEffect(() => {
      if (!fabricCanvasRef.current) return;

      fabricCanvas.current = new fabric.Canvas(fabricCanvasRef.current, {
        width: 900,
        height: 750,
        backgroundColor: "#ffffff",
        preserveObjectStacking: true,
      });

      return () => {
        fabricCanvas.current?.dispose();
      };
    }, []);

    // Draw grid function
    const drawGrid = () => {
      if (!fabricCanvas.current) return;

      const width = fabricCanvas.current.width!;
      const height = fabricCanvas.current.height!;

      // Clear any previous grid
      clearGrid();

      // Horizontal lines
      for (let y = 0; y < height; y += gridSpacing) {
        const line = new fabric.Line([0, y, width, y], {
          stroke: "rgba(235, 235, 235, 0.5)",
          strokeWidth: 1,
          selectable: false,
        });
        fabricCanvas.current.add(line);
      }

      // Vertical lines
      for (let x = 0; x < width; x += gridSpacing) {
        const line = new fabric.Line([x, 0, x, height], {
          stroke: "rgba(235, 235, 235, 0.5)",
          strokeWidth: 1,
          selectable: false,
        });
        fabricCanvas.current.add(line);
      }

      fabricCanvas.current.renderAll();
    };

    // Clear grid function
    const clearGrid = () => {
      if (!fabricCanvas.current) return;
      fabricCanvas.current
        .getObjects("line")
        .forEach((line) => fabricCanvas.current?.remove(line));
      fabricCanvas.current.renderAll();
    };

    // Toggle grid visibility
    const toggleGrid = () => {
      setIsGridVisible((prev) => !prev);
      if (!isGridVisible) {
        drawGrid();
      } else {
        clearGrid();
      }
    };

    // Handle frame editability
    const handleFrameEditability = () => {
      const newState = !isFrameEditable;
      setIsFrameEditable(newState);

      if (mainImageRef.current) {
        mainImageRef.current.set({
          selectable: newState,
          hasControls: newState,
          hasBorders: newState,
          lockMovementX: !newState,
          lockMovementY: !newState,
          lockScalingX: !newState,
          lockScalingY: !newState,
          lockRotation: !newState,
        });
        fabricCanvas.current?.renderAll();
      }

      toggleFrameEditability();
    };

    // Edge detection with proper outline visibility
    const enhancedCannyEdgeDetection = (
      data: Uint8ClampedArray,
      width: number,
      height: number
    ) => {
      const edgeData = new Uint8ClampedArray(data.length);
      const sobelX = [
        [-1, 0, 1],
        [-2, 0, 2],
        [-1, 0, 1],
      ];
      const sobelY = [
        [1, 2, 1],
        [0, 0, 0],
        [-1, -2, -1],
      ];

      // Calculate gradients
      const gradients = new Array(width * height).fill(0);
      let maxGradient = 0;

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          let gx = 0,
            gy = 0;

          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const i = ((y + ky) * width + (x + kx)) * 4;
              const grayValue = data[i];

              gx += grayValue * sobelX[ky + 1][kx + 1];
              gy += grayValue * sobelY[ky + 1][kx + 1];
            }
          }

          const magnitude = Math.sqrt(gx * gx + gy * gy);
          gradients[y * width + x] = magnitude;
          if (magnitude > maxGradient) maxGradient = magnitude;
        }
      }

      // Adaptive thresholding
      const threshold = maxGradient * 0.15;
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const i = (y * width + x) * 4;
          edgeData[i] =
            edgeData[i + 1] =
            edgeData[i + 2] =
              gradients[y * width + x] > threshold ? 0 : 255;
          edgeData[i + 3] = 255;
        }
      }

      return edgeData;
    };

    // Edge cleanup
    const cleanUpEdges = (
      data: Uint8ClampedArray,
      width: number,
      height: number
    ) => {
      const cleanedData = new Uint8ClampedArray(data);

      // Remove isolated edge pixels
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const i = (y * width + x) * 4;
          if (data[i] === 0) {
            let edgeNeighbors = 0;
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                if (ky === 0 && kx === 0) continue;
                const ni = ((y + ky) * width + (x + kx)) * 4;
                if (data[ni] === 0) edgeNeighbors++;
              }
            }
            if (edgeNeighbors < 2) {
              cleanedData[i] = cleanedData[i + 1] = cleanedData[i + 2] = 255;
            }
          }
        }
      }

      return cleanedData;
    };

    // Outline image with proper visible edges
    const outlineImage = () => {
      if (!fabricCanvas.current || !mainImageRef.current) return;

      const originalImage = mainImageRef.current;
      const numbers = fabricCanvas.current
        .getObjects()
        .filter((obj) => obj.type === "text");
      const backgrounds = fabricCanvas.current
        .getObjects()
        .filter((obj) => obj.type === "rect");
      const gridLines = fabricCanvas.current
        .getObjects()
        .filter((obj) => obj.type === "line");

      // Create temporary canvas
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return;

      const originalSize = originalImage.getOriginalSize();
      tempCanvas.width = originalSize.width;
      tempCanvas.height = originalSize.height;

      // Draw the original image
      tempCtx.drawImage(originalImage.getElement(), 0, 0);

      // Get image data
      const imageData = tempCtx.getImageData(
        0,
        0,
        tempCanvas.width,
        tempCanvas.height
      );
      const data = imageData.data;

      // Convert to grayscale
      for (let i = 0; i < data.length; i += 4) {
        const gray =
          0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = data[i + 1] = data[i + 2] = gray;
      }

      // Apply edge detection
      const edgeData = enhancedCannyEdgeDetection(
        data,
        tempCanvas.width,
        tempCanvas.height
      );
      const processedEdgeData = cleanUpEdges(
        edgeData,
        tempCanvas.width,
        tempCanvas.height
      );

      // Create transparent background with black outlines
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = originalSize.width;
      finalCanvas.height = originalSize.height;
      const finalCtx = finalCanvas.getContext("2d");
      if (!finalCtx) return;

      // Fill with transparent background
      finalCtx.fillStyle = "rgba(0, 0, 0, 0)";
      finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

      // Draw only the edges (black) on transparent background
      const finalImageData = finalCtx.createImageData(
        finalCanvas.width,
        finalCanvas.height
      );
      for (let i = 0; i < processedEdgeData.length; i += 4) {
        // Keep black pixels (edges) and make everything else transparent
        if (processedEdgeData[i] === 0) {
          finalImageData.data[i] = 0; // R
          finalImageData.data[i + 1] = 0; // G
          finalImageData.data[i + 2] = 0; // B
          finalImageData.data[i + 3] = 255; // A (opaque)
        } else {
          finalImageData.data[i + 3] = 0; // A (transparent)
        }
      }
      finalCtx.putImageData(finalImageData, 0, 0);

      // Create Fabric.js image
      const outlinedImage = new fabric.Image(finalCanvas, {
        left: originalImage.left,
        top: originalImage.top,
        scaleX: originalImage.scaleX,
        scaleY: originalImage.scaleY,
        selectable: false,
        hasControls: false,
        hasBorders: false,
        opacity: 1.0,
      });

      // Clear and rebuild the canvas
      fabricCanvas.current.clear();
      fabricCanvas.current.add(originalImage);
      fabricCanvas.current.add(outlinedImage);

      // Restore other elements
      backgrounds.forEach((bg) => fabricCanvas.current?.add(bg));
      numbers.forEach((num) => fabricCanvas.current?.add(num));

      if (isGridVisible) {
        gridLines.forEach((line) => fabricCanvas.current?.add(line));
      }

      numbers.forEach((num) => num.bringToFront());
      fabricCanvas.current.renderAll();

      if (onSegmentsUpdated) {
        onSegmentsUpdated(finalCanvas.toDataURL("image/png"));
      }

      analyzeColorRegions(originalImage);
    };

    // Helper to get outlined image data
    const getOutlinedImageData = (img: fabric.Image): ImageData => {
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return new ImageData(1, 1);

      const originalSize = img.getOriginalSize();
      tempCanvas.width = originalSize.width;
      tempCanvas.height = originalSize.height;

      // Draw original image
      const imgElement = img.getElement();
      tempCtx.drawImage(
        imgElement,
        0,
        0,
        originalSize.width,
        originalSize.height
      );

      // Get image data and apply edge detection
      const imageData = tempCtx.getImageData(
        0,
        0,
        originalSize.width,
        originalSize.height
      );
      const edgeData = enhancedCannyEdgeDetection(
        imageData.data,
        originalSize.width,
        originalSize.height
      );

      return new ImageData(edgeData, originalSize.width, originalSize.height);
    };

    // Region finding with flood fill
    const findEnclosedRegions = (
      data: Uint8ClampedArray,
      width: number,
      height: number
    ) => {
      const visited = new Array(width * height).fill(false);
      const regions: Array<{
        color: string;
        points: Array<{ x: number; y: number }>;
      }> = [];

      // First pass to find edges (black pixels)
      const edgePixels = new Set<number>();
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          if (data[i] === 0) {
            edgePixels.add(y * width + x);
          }
        }
      }

      // Second pass to find enclosed regions with flood fill
      for (let y = 1; y < height - 1; y += 1) {
        for (let x = 1; x < width - 1; x += 1) {
          const index = y * width + x;
          if (!visited[index] && !edgePixels.has(index)) {
            // Get the color at this position (average of 3x3 area for stability)
            let rSum = 0,
              gSum = 0,
              bSum = 0,
              count = 0;
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                const ni = ((y + ky) * width + (x + kx)) * 4;
                if (data[ni] !== 0) {
                  // Not edge
                  rSum += data[ni];
                  gSum += data[ni + 1];
                  bSum += data[ni + 2];
                  count++;
                }
              }
            }

            if (count === 0) continue;

            const r = Math.round(rSum / count);
            const g = Math.round(gSum / count);
            const b = Math.round(bSum / count);

            // Skip white/very light areas
            if (r > 240 && g > 240 && b > 240) continue;

            const color = `rgb(${r},${g},${b})`;

            // Flood fill with queue and track boundaries
            const regionPoints: Array<{ x: number; y: number }> = [];
            const queue = [{ x, y }];
            visited[index] = true;

            while (queue.length > 0) {
              const point = queue.shift()!;
              const px = point.x;
              const py = point.y;

              // Check bounds
              if (px <= 0 || px >= width - 1 || py <= 0 || py >= height - 1)
                continue;

              const pIndex = py * width + px;

              // Add to region if not edge and not visited
              if (!edgePixels.has(pIndex) && !visited[pIndex]) {
                visited[pIndex] = true;
                regionPoints.push({ x: px, y: py });

                // Add neighbors (4-directional for better region cohesion)
                queue.push({ x: px + 1, y: py });
                queue.push({ x: px - 1, y: py });
                queue.push({ x: px, y: py + 1 });
                queue.push({ x: px, y: py - 1 });
              }
            }

            // Only keep regions larger than a threshold
            if (regionPoints.length > 100) {
              // Verify this is a proper enclosed region
              let isEnclosed = true;
              for (const point of regionPoints) {
                if (
                  point.x === 0 ||
                  point.x === width - 1 ||
                  point.y === 0 ||
                  point.y === height - 1
                ) {
                  isEnclosed = false;
                  break;
                }
              }

              if (isEnclosed) {
                regions.push({
                  color,
                  points: regionPoints,
                });
              }
            }
          }
        }
      }

      return regions;
    };

    // Analyze the image to find distinct color regions
    const analyzeColorRegions = (img: fabric.Image) => {
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx || !fabricCanvas.current) return;

      const originalSize = img.getOriginalSize();
      tempCanvas.width = originalSize.width;
      tempCanvas.height = originalSize.height;

      // Draw the original image to get color information
      const imgElement = img.getElement();
      tempCtx.drawImage(
        imgElement,
        0,
        0,
        originalSize.width,
        originalSize.height
      );
      const originalImageData = tempCtx.getImageData(
        0,
        0,
        originalSize.width,
        originalSize.height
      );

      // Get the outlined image data for edge detection
      const outlined = getOutlinedImageData(img);
      tempCtx.putImageData(outlined, 0, 0);
      const edgeData = tempCtx.getImageData(
        0,
        0,
        originalSize.width,
        originalSize.height
      ).data;

      // Combine original colors with edge data
      const combinedData = new Uint8ClampedArray(originalImageData.data);
      for (let i = 0; i < edgeData.length; i += 4) {
        if (edgeData[i] === 0) {
          // Edge pixel
          combinedData[i] = combinedData[i + 1] = combinedData[i + 2] = 0;
        }
      }

      // Find enclosed regions in the outline
      const regions = findEnclosedRegions(
        combinedData,
        originalSize.width,
        originalSize.height
      );

      setColorRegions(regions);
      generateNumbersForRegions(regions);
    };

    // Generate numbers for each color region
    const generateNumbersForRegions = (
      regions: Array<{ color: string; points: Array<{ x: number; y: number }> }>
    ) => {
      if (!mainImageRef.current || !fabricCanvas.current) return;

      const img = mainImageRef.current;
      const originalSize = img.getOriginalSize();
      const positions: Array<{ x: number; y: number; number: number }> = [];

      // Sort regions by size (largest first)
      const sortedRegions = [...regions].sort(
        (a, b) => b.points.length - a.points.length
      );

      sortedRegions.forEach((region, index) => {
        // Calculate centroid of the region
        let sumX = 0;
        let sumY = 0;

        region.points.forEach((point) => {
          sumX += point.x;
          sumY += point.y;
        });

        const centerX = sumX / region.points.length;
        const centerY = sumY / region.points.length;

        // Find the point in the region closest to the center
        let bestPoint = region.points[0];
        let minDist = Infinity;

        for (const point of region.points) {
          const dist = Math.sqrt(
            Math.pow(point.x - centerX, 2) + Math.pow(point.y - centerY, 2)
          );
          if (dist < minDist) {
            minDist = dist;
            bestPoint = point;
          }
        }

        positions.push({
          x: bestPoint.x,
          y: bestPoint.y,
          number: index + 1,
        });
      });

      if (onNumbersGenerated) {
        onNumbersGenerated(positions);
      }

      // Update the canvas with new numbers
      addNumbersToCanvas();
    };

    // Add numbers to canvas with background for visibility
    const addNumbersToCanvas = () => {
      if (!fabricCanvas.current || !mainImageRef.current) return;

      // Clear existing numbers and their backgrounds
      const existingNumbers = fabricCanvas.current
        .getObjects()
        .filter((obj) => obj.type === "text");
      const existingBackgrounds = fabricCanvas.current
        .getObjects()
        .filter((obj) => obj.type === "rect" && obj.name === "number-bg");
      existingNumbers.forEach((num) => fabricCanvas.current?.remove(num));
      existingBackgrounds.forEach((bg) => fabricCanvas.current?.remove(bg));

      const img = mainImageRef.current;
      const imgLeft = img.left || 0;
      const imgTop = img.top || 0;
      const imgWidth = (img.width || 0) * (img.scaleX || 1);
      const imgHeight = (img.height || 0) * (img.scaleY || 1);
      const originalWidth = img.getOriginalSize().width;
      const originalHeight = img.getOriginalSize().height;

      numberPositions.forEach((pos) => {
        // Convert position from original image coordinates to canvas coordinates
        const xPercent = pos.x / originalWidth;
        const yPercent = pos.y / originalHeight;

        const x = imgLeft + xPercent * imgWidth;
        const y = imgTop + yPercent * imgHeight;

        // Check if position is within image bounds
        const isInsideImage =
          x >= imgLeft &&
          x <= imgLeft + imgWidth &&
          y >= imgTop &&
          y <= imgTop + imgHeight;

        if (isInsideImage) {
          // const bg = new fabric.Circle({
          //   left: x,
          //   top: y,
          //   radius: 10,
          //   fill: 'white',
          //   opacity: 0.7,
          //   originX: 'center',
          //   originY: 'center',
          //   selectable: false,
          //   evented: false,
          //   name: 'number-bg'
          // });

          const text = new fabric.Text(pos.number.toString(), {
            left: x,
            top: y,
            fontSize: 12,
            fill: "black",
            fontFamily: "Arial",
            fontWeight: "bold",
            originX: "center",
            originY: "center",
            selectable: false,
            evented: false,
          });

          // fabricCanvas.current?.add(bg);
          fabricCanvas.current?.add(text);
          text.bringToFront();
        }
      });
    };

    // Handle image loading and updates
    useEffect(() => {
      if (!fabricCanvas.current || !uploadedImage) return;

      // Clear existing objects except numbers and their backgrounds
      const existingNumbers = fabricCanvas.current
        .getObjects()
        .filter((obj) => obj.type === "text");
      const existingBackgrounds = fabricCanvas.current
        .getObjects()
        .filter((obj) => obj.type === "rect");
      fabricCanvas.current.clear();
      existingNumbers.forEach((num) => fabricCanvas.current?.add(num));
      existingBackgrounds.forEach((bg) => fabricCanvas.current?.add(bg));

      fabric.Image.fromURL(uploadedImage, (img) => {
        mainImageRef.current = img;
        const originalSize = img.getOriginalSize();
        const aspectRatio = originalSize.width / originalSize.height;
        let newWidth, newHeight;

        if (originalSize.width > originalSize.height) {
          newWidth = 700;
          newHeight = 700 / aspectRatio;
        } else {
          newHeight = 700;
          newWidth = 700 * aspectRatio;
        }

        img.set({
          scaleX: newWidth / originalSize.width,
          scaleY: newHeight / originalSize.height,
          left: (900 - newWidth) / 2,
          top: (750 - newHeight) / 2,
          selectable: isFrameEditable,
          hasControls: isFrameEditable,
          hasBorders: isFrameEditable,
          lockMovementX: !isFrameEditable,
          lockMovementY: !isFrameEditable,
          lockScalingX: !isFrameEditable,
          lockScalingY: !isFrameEditable,
          lockRotation: !isFrameEditable,
        });

        fabricCanvas.current?.add(img);
        addNumbersToCanvas();

        if (isGridVisible) {
          drawGrid();
        }

        fabricCanvas.current?.renderAll();
        analyzeColorRegions(img);
      });
    }, [uploadedImage, isFrameEditable]);

    return (
      <div className="image-canvas-container">
        {uploadedImage && (
          <div className="image-close-button" onClick={onDeleteImage}>
            &times;
          </div>
        )}
        <canvas ref={fabricCanvasRef} />
        <div className="canvas-controls">
          <button className="segment-button" onClick={outlineImage}>
            {t("canvas.outline")}
          </button>
          <button className="toggle-grid-button" onClick={toggleGrid}>
            {isGridVisible ? t("canvas.hide") : t("canvas.show")}
          </button>

          <button
            className="toggle-frame-button"
            onClick={handleFrameEditability}
          >
            {isFrameEditable ? t("canvas.lock") : t("canvas.edit")}
          </button>
        </div>
      </div>
    );
  }
);

export default ImageCanvas;
