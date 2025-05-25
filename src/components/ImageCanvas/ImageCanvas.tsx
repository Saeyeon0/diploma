import React, { useRef, useEffect, forwardRef, useState } from "react";
import { fabric } from "fabric";
import "./ImageCanvas.css";

interface ImageCanvasProps {
  uploadedImage: string;
  onSegmentsUpdated?: (segmentedImageUrl: string) => void;
  onDeleteImage: () => void;
  showGrid?: boolean;
  gridSpacing?: number;
  toggleFrameEditability: () => void;
  numberPositions?: Array<{x: number, y: number, number: number}>;
  onNumbersGenerated?: (positions: Array<{x: number, y: number, number: number}>) => void;
}

const ImageCanvas = forwardRef<HTMLCanvasElement | null, ImageCanvasProps>(
  ({ uploadedImage, onSegmentsUpdated, onDeleteImage, showGrid = false, gridSpacing = 50, toggleFrameEditability, numberPositions = [], onNumbersGenerated }, ref) => {
    const fabricCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const fabricCanvas = useRef<fabric.Canvas | null>(null);
    const mainImageRef = useRef<fabric.Image | null>(null);
    const [isGridVisible, setIsGridVisible] = useState(showGrid);
    const [isFrameEditable, setIsFrameEditable] = useState(false);
    const [colorRegions, setColorRegions] = useState<Array<{color: string, points: Array<{x: number, y: number}>}>>([]);

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
          stroke: 'rgba(235, 235, 235, 0.5)',
          strokeWidth: 1,
          selectable: false,
        });
        fabricCanvas.current.add(line);
      }

      // Vertical lines
      for (let x = 0; x < width; x += gridSpacing) {
        const line = new fabric.Line([x, 0, x, height], {
          stroke: 'rgba(235, 235, 235, 0.5)',
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
      fabricCanvas.current.getObjects("line").forEach(line => fabricCanvas.current?.remove(line));
      fabricCanvas.current.renderAll();
    };

    // Toggle grid visibility
    const toggleGrid = () => {
      setIsGridVisible(prev => !prev);
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

    // Enhanced Canny edge detection with better thresholding
    const enhancedCannyEdgeDetection = (data: Uint8ClampedArray, width: number, height: number) => {
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
    
      // First pass: Calculate gradients
      const gradients = new Array(width * height).fill(0);
      let maxGradient = 0;
      
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          let gx = 0, gy = 0;
    
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const i = ((y + ky) * width + (x + kx)) * 4;
              const grayValue = (data[i] + data[i + 1] + data[i + 2]) / 3;
    
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
      const highThreshold = maxGradient * 0.2;
      const lowThreshold = highThreshold * 0.5;
      
      // Second pass: Apply hysteresis thresholding
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const i = (y * width + x) * 4;
          const magnitude = gradients[y * width + x];
          
          if (magnitude >= highThreshold) {
            // Strong edge
            edgeData[i] = edgeData[i + 1] = edgeData[i + 2] = 0;
          } else if (magnitude >= lowThreshold) {
            // Check if connected to strong edge
            let isConnected = false;
            for (let ky = -1; ky <= 1 && !isConnected; ky++) {
              for (let kx = -1; kx <= 1 && !isConnected; kx++) {
                if (ky === 0 && kx === 0) continue;
                const ni = ((y + ky) * width + (x + kx)) * 4;
                if (gradients[(y + ky) * width + (x + kx)] >= highThreshold) {
                  isConnected = true;
                }
              }
            }
            edgeData[i] = edgeData[i + 1] = edgeData[i + 2] = isConnected ? 0 : 255;
          } else {
            // Non-edge
            edgeData[i] = edgeData[i + 1] = edgeData[i + 2] = 255;
          }
          edgeData[i + 3] = 255;
        }
      }
    
      return edgeData;
    };

    // Clean up edges function with morphological operations
    const cleanUpEdges = (data: Uint8ClampedArray, width: number, height: number) => {
      const cleanedData = new Uint8ClampedArray(data);
      
      // First pass: Remove isolated edge pixels
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const i = (y * width + x) * 4;
          if (data[i] === 0) { // Edge pixel
            let edgeNeighbors = 0;
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                if (ky === 0 && kx === 0) continue;
                const ni = ((y + ky) * width + (x + kx)) * 4;
                if (data[ni] === 0) edgeNeighbors++;
              }
            }
            if (edgeNeighbors < 2) { // Isolated edge
              cleanedData[i] = cleanedData[i + 1] = cleanedData[i + 2] = 255;
            }
          }
        }
      }
      
      // Second pass: Close small gaps
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const i = (y * width + x) * 4;
          if (cleanedData[i] === 255) { // Non-edge pixel
            let edgeNeighbors = 0;
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                if (ky === 0 && kx === 0) continue;
                const ni = ((y + ky) * width + (x + kx)) * 4;
                if (cleanedData[ni] === 0) edgeNeighbors++;
              }
            }
            if (edgeNeighbors >= 5) { // Probably a gap
              cleanedData[i] = cleanedData[i + 1] = cleanedData[i + 2] = 0;
            }
          }
        }
      }
      
      return cleanedData;
    };

    // Outline image function with improved edge processing
    const outlineImage = () => {
      if (!fabricCanvas.current || !mainImageRef.current) return;
    
      const originalImage = mainImageRef.current;
      const numbers = fabricCanvas.current.getObjects().filter(obj => obj.type === 'text');
      const backgrounds = fabricCanvas.current.getObjects().filter(obj => obj.type === 'rect');
      const gridLines = fabricCanvas.current.getObjects().filter(obj => obj.type === 'line');
    
      // Create temporary canvas for processing
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return;
    
      // Set dimensions matching the original image
      const originalWidth = originalImage.getOriginalSize().width;
      const originalHeight = originalImage.getOriginalSize().height;
      tempCanvas.width = originalWidth;
      tempCanvas.height = originalHeight;
      
      // Draw the original image to temp canvas with slight blur for noise reduction
      tempCtx.filter = 'blur(1px)';
      const imgElement = originalImage.getElement();
      tempCtx.drawImage(imgElement, 0, 0, originalWidth, originalHeight);
      tempCtx.filter = 'none';
    
      // Process image data for edge detection
      const imageData = tempCtx.getImageData(0, 0, originalWidth, originalHeight);
      const data = imageData.data;
    
      // Convert to grayscale with better luminance calculation
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = data[i + 1] = data[i + 2] = gray;
      }
    
      // Apply edge detection with better thresholding
      const edgeData = enhancedCannyEdgeDetection(data, originalWidth, originalHeight);
      const processedEdgeData = cleanUpEdges(edgeData, originalWidth, originalHeight);
    
      // Create final image data
      const finalImageData = new ImageData(processedEdgeData, originalWidth, originalHeight);
      tempCtx.putImageData(finalImageData, 0, 0);
    
      // Create Fabric.js image from processed canvas
      const outlinedImage = new fabric.Image(tempCanvas, {
        left: originalImage.left,
        top: originalImage.top,
        scaleX: originalImage.scaleX,
        scaleY: originalImage.scaleY,
        selectable: false,
        hasControls: false,
        hasBorders: false,
        opacity: 0.9,
      });
    
      // Clear and rebuild the canvas
      fabricCanvas.current.clear();
      
      // Add the original image (background)
      fabricCanvas.current.add(originalImage);
      
      // Add the outlined version (foreground)
      fabricCanvas.current.add(outlinedImage);
      
      // Restore all numbers and backgrounds
      backgrounds.forEach(bg => fabricCanvas.current?.add(bg));
      numbers.forEach(num => fabricCanvas.current?.add(num));
      
      // Restore grid if visible
      if (isGridVisible) {
        gridLines.forEach(line => fabricCanvas.current?.add(line));
      }
    
      // Bring all numbers to front
      numbers.forEach(num => num.bringToFront());
    
      // Trigger final render
      fabricCanvas.current.renderAll();
    
      // Export the processed image if callback provided
      if (onSegmentsUpdated) {
        const exportCanvas = document.createElement("canvas");
        exportCanvas.width = originalWidth;
        exportCanvas.height = originalHeight;
        const exportCtx = exportCanvas.getContext("2d");
        if (exportCtx) {
          exportCtx.putImageData(finalImageData, 0, 0);
          onSegmentsUpdated(exportCanvas.toDataURL("image/png"));
        }
      }
      
      // Re-analyze color regions after outlining
      analyzeColorRegions(originalImage);
    };

    // Helper to get outlined image data
    const getOutlinedImageData = (img: fabric.Image): ImageData => {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return new ImageData(1, 1);
      
      const originalSize = img.getOriginalSize();
      tempCanvas.width = originalSize.width;
      tempCanvas.height = originalSize.height;
      
      // Draw original image with slight blur for noise reduction
      tempCtx.filter = 'blur(1px)';
      const imgElement = img.getElement();
      tempCtx.drawImage(imgElement, 0, 0, originalSize.width, originalSize.height);
      tempCtx.filter = 'none';
      
      // Get image data and apply edge detection
      const imageData = tempCtx.getImageData(0, 0, originalSize.width, originalSize.height);
      const edgeData = enhancedCannyEdgeDetection(imageData.data, originalSize.width, originalSize.height);
      
      return new ImageData(edgeData, originalSize.width, originalSize.height);
    };

    // Improved region finding with flood fill
    const findEnclosedRegions = (data: Uint8ClampedArray, width: number, height: number) => {
      const visited = new Array(width * height).fill(false);
      const regions: Array<{color: string, points: Array<{x: number, y: number}>}> = [];
      const colorMap: Record<string, string> = {};
      
      // First pass to find edges (black pixels)
      const edgePixels = new Set<number>();
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          if (data[i] === 0) { // Edge pixel
            edgePixels.add(y * width + x);
          }
        }
      }
      
      // Second pass to find enclosed regions with flood fill
      for (let y = 1; y < height - 1; y += 2) { // Sample every 2px for performance
        for (let x = 1; x < width - 1; x += 2) {
          const index = y * width + x;
          if (!visited[index] && !edgePixels.has(index)) {
            // Get the color at this position (from original image)
            const i = index * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Skip white/transparent areas
            if (r > 240 && g > 240 && b > 240) continue;
            
            const color = `rgb(${r},${g},${b})`;
            colorMap[color] = color;
            
            // Flood fill to find enclosed region
            const regionPoints: Array<{x: number, y: number}> = [];
            const queue = [{x, y}];
            visited[index] = true;
            
            while (queue.length > 0) {
              const point = queue.shift()!;
              const px = point.x;
              const py = point.y;
              
              // Check bounds
              if (px <= 0 || px >= width - 1 || py <= 0 || py >= height - 1) continue;
              
              const pIndex = py * width + px;
              
              // Add to region if not edge and not visited
              if (!edgePixels.has(pIndex) && !visited[pIndex]) {
                visited[pIndex] = true;
                regionPoints.push({x: px, y: py});
                
                // Add neighbors (4-directional for better region detection)
                queue.push({x: px + 1, y: py});
                queue.push({x: px - 1, y: py});
                queue.push({x: px, y: py + 1});
                queue.push({x: px, y: py - 1});
              }
            }
            
            // Only keep regions larger than a threshold
            if (regionPoints.length > 50) { // Increased minimum region size
              regions.push({
                color,
                points: regionPoints
              });
            }
          }
        }
      }
      
      return regions;
    };

    // Analyze the image to find distinct color regions with improved accuracy
    const analyzeColorRegions = (img: fabric.Image) => {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx || !fabricCanvas.current) return;
      
      const originalSize = img.getOriginalSize();
      tempCanvas.width = originalSize.width;
      tempCanvas.height = originalSize.height;
      
      // Draw the original image to get color information
      const imgElement = img.getElement();
      tempCtx.drawImage(imgElement, 0, 0, originalSize.width, originalSize.height);
      const originalImageData = tempCtx.getImageData(0, 0, originalSize.width, originalSize.height);
      
      // Get the outlined image data for edge detection
      const outlined = getOutlinedImageData(img);
      tempCtx.putImageData(outlined, 0, 0);
      const edgeData = tempCtx.getImageData(0, 0, originalSize.width, originalSize.height).data;
      
      // Combine original colors with edge data
      const combinedData = new Uint8ClampedArray(originalImageData.data);
      for (let i = 0; i < edgeData.length; i += 4) {
        if (edgeData[i] === 0) { // Edge pixel
          combinedData[i] = combinedData[i + 1] = combinedData[i + 2] = 0; // Black edges
        }
      }
      
      // Find enclosed regions in the outline
      const regions = findEnclosedRegions(combinedData, originalSize.width, originalSize.height);
      
      setColorRegions(regions);
      generateNumbersForRegions(regions);
    };

    // Improved number generation for regions
    const generateNumbersForRegions = (regions: Array<{color: string, points: Array<{x: number, y: number}>}>) => {
      if (!mainImageRef.current || !fabricCanvas.current) return;
      
      const img = mainImageRef.current;
      const originalSize = img.getOriginalSize();
      const positions: Array<{x: number, y: number, number: number}> = [];
      
      // Sort regions by size (largest first)
      const sortedRegions = [...regions].sort((a, b) => b.points.length - a.points.length);
      
      sortedRegions.forEach((region, index) => {
        // Calculate centroid of the region
        let sumX = 0;
        let sumY = 0;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        region.points.forEach(point => {
          sumX += point.x;
          sumY += point.y;
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        });
        
        // Calculate center of mass
        const centerX = sumX / region.points.length;
        const centerY = sumY / region.points.length;
        
        // Adjust position to be more centered in the region
        // Find the point in the region closest to the center of mass
        let bestPoint = region.points[0];
        let minDist = Infinity;
        
        for (const point of region.points) {
          const dist = Math.sqrt(Math.pow(point.x - centerX, 2) + Math.pow(point.y - centerY, 2));
          if (dist < minDist) {
            minDist = dist;
            bestPoint = point;
          }
        }
        
        positions.push({
          x: bestPoint.x,
          y: bestPoint.y,
          number: index + 1
        });
      });
      
      if (onNumbersGenerated) {
        onNumbersGenerated(positions);
      }
      
      // Update the canvas with new numbers
      addNumbersToCanvas();
    };

    // Improved number placement with better visibility
    const addNumbersToCanvas = () => {
      if (!fabricCanvas.current || !mainImageRef.current) return;
    
      // Clear existing numbers and their backgrounds
      const existingNumbers = fabricCanvas.current.getObjects().filter(obj => obj.type === 'text');
      const existingBackgrounds = fabricCanvas.current.getObjects().filter(obj => obj.type === 'rect' && obj.name === 'number-bg');
      existingNumbers.forEach(num => fabricCanvas.current?.remove(num));
      existingBackgrounds.forEach(bg => fabricCanvas.current?.remove(bg));
    
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
        
        const x = imgLeft + (xPercent * imgWidth);
        const y = imgTop + (yPercent * imgHeight);
    
        // Check if position is within image bounds
        const isInsideImage = x >= imgLeft && 
                             x <= imgLeft + imgWidth && 
                             y >= imgTop && 
                             y <= imgTop + imgHeight;
    
        if (isInsideImage) {
    
          const text = new fabric.Text(pos.number.toString(), {
            left: x,
            top: y,
            fontSize: 12,
            fill: 'black',
            fontFamily: 'Arial',
            fontWeight: 'bold',
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
          });
    
          fabricCanvas.current?.add(text);
          text.bringToFront();
        }
      });
    };

    // Handle image loading and updates
    useEffect(() => {
      if (!fabricCanvas.current || !uploadedImage) return;

      // Clear existing objects except numbers and their backgrounds
      const existingNumbers = fabricCanvas.current.getObjects().filter(obj => obj.type === 'text');
      const existingBackgrounds = fabricCanvas.current.getObjects().filter(obj => obj.type === 'rect');
      fabricCanvas.current.clear();
      existingNumbers.forEach(num => fabricCanvas.current?.add(num));
      existingBackgrounds.forEach(bg => fabricCanvas.current?.add(bg));

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
            Outline Image
          </button>
          <button className="toggle-grid-button" onClick={toggleGrid}>
            {isGridVisible ? "Hide Grid" : "Show Grid"}
          </button>
          <button className="toggle-frame-button" onClick={handleFrameEditability}>
            {isFrameEditable ? "Lock Frame" : "Edit Frame"}
          </button>
          {/* <button className="generate-numbers-button" onClick={() => mainImageRef.current && analyzeColorRegions(mainImageRef.current)}>
            Generate Numbers
          </button> */}
        </div>
      </div>
    );
  }
);

export default ImageCanvas;