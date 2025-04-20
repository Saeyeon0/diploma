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
}

const ImageCanvas = forwardRef<HTMLCanvasElement | null, ImageCanvasProps>(
  ({ uploadedImage, onSegmentsUpdated, onDeleteImage, showGrid = false, gridSpacing = 50, toggleFrameEditability, numberPositions = [] }, ref) => {
    const fabricCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const fabricCanvas = useRef<fabric.Canvas | null>(null);
    const mainImageRef = useRef<fabric.Image | null>(null);
    const [isGridVisible, setIsGridVisible] = useState(showGrid);
    const [isFrameEditable, setIsFrameEditable] = useState(false);

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
      });
    }, [uploadedImage, isFrameEditable]);

    // Handle number position updates
    useEffect(() => {
      if (!fabricCanvas.current) return;
      addNumbersToCanvas();
      fabricCanvas.current?.renderAll();
    }, [numberPositions]);

    // Handle grid visibility changes
    useEffect(() => {
      if (!fabricCanvas.current) return;
      if (isGridVisible) {
        drawGrid();
      } else {
        clearGrid();
      }
    }, [isGridVisible]);

    const addNumbersToCanvas = () => {
      if (!fabricCanvas.current || !mainImageRef.current) return;
    
      // Clear existing numbers
      const existingNumbers = fabricCanvas.current.getObjects().filter(obj => obj.type === 'text');
      existingNumbers.forEach(num => fabricCanvas.current?.remove(num));
    
      const img = mainImageRef.current;
      const imgLeft = img.left || 0;
      const imgTop = img.top || 0;
      const imgWidth = (img.width || 0) * (img.scaleX || 1);
      const imgHeight = (img.height || 0) * (img.scaleY || 1);
    
      // Add new numbers with proper positioning
      numberPositions.forEach((pos) => {
        // Calculate position relative to the original image dimensions
        const originalWidth = img.getOriginalSize().width;
        const originalHeight = img.getOriginalSize().height;
        
        // Convert percentage positions to absolute coordinates
        const xPercent = pos.x / originalWidth;
        const yPercent = pos.y / originalHeight;
        
        // Map to displayed image coordinates
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
            fontSize: 15,
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

    const clearGrid = () => {
      if (!fabricCanvas.current) return;
      fabricCanvas.current.getObjects("line").forEach(line => fabricCanvas.current?.remove(line));
      fabricCanvas.current.renderAll();
    };

    const toggleGrid = () => {
      setIsGridVisible(prev => !prev);
    };

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

    const outlineImage = () => {
      if (!fabricCanvas.current || !mainImageRef.current) return;
    
      // Store current canvas state
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
      
      // Draw the original image to temp canvas
      const imgElement = originalImage.getElement();
      tempCtx.drawImage(imgElement, 0, 0, originalWidth, originalHeight);
    
      // Process image data for edge detection
      const imageData = tempCtx.getImageData(0, 0, originalWidth, originalHeight);
      const data = imageData.data;
    
      // Convert to grayscale
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = data[i + 1] = data[i + 2] = avg;
      }
    
      // Apply edge detection
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
    };

    const cleanUpEdges = (data: Uint8ClampedArray, width: number, height: number) => {
      const cleanedData = new Uint8ClampedArray(data);
    
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const i = (y * width + x) * 4;
          const neighborValues = [
            data[i - 4], data[i + 4],
            data[i - width * 4], data[i + width * 4],
          ];
    
          if (data[i] === 0) {
            const hasNeighborEdge = neighborValues.some(value => value === 0);
            if (!hasNeighborEdge) {
              cleanedData[i] = cleanedData[i + 1] = cleanedData[i + 2] = 255;
            }
          }
        }
      }
    
      return cleanedData;
    };

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
          const i = (y * width + x) * 4;
    
          const edgeValue = magnitude > 150 ? 0 : 255;
    
          edgeData[i] = edgeData[i + 1] = edgeData[i + 2] = edgeValue;
          edgeData[i + 3] = 255;
        }
      }
    
      return edgeData;
    };

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
          <button className="toggle-grid-button" onClick={handleFrameEditability}>
            {isFrameEditable ? "Lock Frame" : "Edit Frame"}
          </button>
        </div>
      </div>
    );
  }
);

export default ImageCanvas;