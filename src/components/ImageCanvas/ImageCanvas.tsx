import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState } from "react";
import { fabric } from "fabric";
import "./ImageCanvas.css";
import Toolbar from "../Toolbar/Toolbar";
import FrameTool from "../FrameTool/FrameTool";

interface ImageCanvasProps {
  uploadedImage: string;
  onSegmentsUpdated?: (segmentedImageUrl: string) => void;
  onDeleteImage: () => void;
  showGrid?: boolean;
  gridSpacing?: number;
  toggleFrameEditability: () => void;
}

const ImageCanvas = forwardRef<HTMLCanvasElement | null, ImageCanvasProps>(
  ({ uploadedImage, onSegmentsUpdated, onDeleteImage }, ref) => {
    const fabricCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const fabricCanvas = useRef<fabric.Canvas | null>(null);
    const [isGridVisible, setIsGridVisible] = useState(true); // State for grid visibility
    const [isFrameEditable, setIsFrameEditable] = useState(false);

    useImperativeHandle(ref, () => fabricCanvasRef.current as HTMLCanvasElement);

    useEffect(() => {
      if (fabricCanvasRef.current) {
        fabricCanvas.current = new fabric.Canvas(fabricCanvasRef.current, {
          width: 900,
          height: 750,
          backgroundColor: "#ffffff",
          preserveObjectStacking: true,
        });

        fabric.Image.fromURL(uploadedImage, (img) => {
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

          img.scaleToWidth(newWidth);
          img.scaleToHeight(newHeight);

          img.set({
            left: (fabricCanvas.current!.width! - newWidth) / 2,
            top: (fabricCanvas.current!.height! - newHeight) / 2,
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
          fabricCanvas.current?.renderAll();

          if (isGridVisible) {
            drawGrid();
          }
        });

        return () => {
          fabricCanvas.current?.dispose();
        };
      }
    }, [uploadedImage, isGridVisible, isFrameEditable]);

    // Function to draw a grid over the canvas
    const drawGrid = () => {
      if (!fabricCanvas.current) return;

      const gridSize = 50; // Grid size (adjustable)
      const width = fabricCanvas.current.width!;
      const height = fabricCanvas.current.height!;

      // Clear any previous grid
      fabricCanvas.current.getObjects("line").forEach(line => fabricCanvas.current?.remove(line));

      // Horizontal lines
      for (let y = 0; y < height; y += gridSize) {
        const line = new fabric.Line([0, y, width, y], {
          stroke: 'rgba(235, 235, 235, 0.5)',
          strokeWidth: 1,
          selectable: false,
        });
        fabricCanvas.current.add(line);
      }

      // Vertical lines
      for (let x = 0; x < width; x += gridSize) {
        const line = new fabric.Line([x, 0, x, height], {
          stroke: 'rgba(235, 235, 235, 0.5)',
          strokeWidth: 1,
          selectable: false,
        });
        fabricCanvas.current.add(line);
      }

      fabricCanvas.current.renderAll(); // Rerender the canvas to display the grid
    };

    const toggleFrameEditability = () => {
      setIsFrameEditable((prev) => !prev);

      if (fabricCanvas.current) {
        const img = fabricCanvas.current.getObjects("image")[0] as fabric.Image;
        if (img) {
          img.set({
            selectable: !isFrameEditable,
            hasControls: !isFrameEditable,
            hasBorders: !isFrameEditable,
            lockMovementX: isFrameEditable,
            lockMovementY: isFrameEditable,
            lockScalingX: isFrameEditable,
            lockScalingY: isFrameEditable,
            lockRotation: isFrameEditable,
          });
          fabricCanvas.current.renderAll();
        }
      }
    };

    const outlineImage = () => {
      if (!fabricCanvas.current) return;
    
      const imageObj = fabricCanvas.current.getObjects("image")[0] as fabric.Image;
      if (!imageObj) return;
    
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return;
    
      tempCanvas.width = imageObj.width!;
      tempCanvas.height = imageObj.height!;
      const imgElement = imageObj.getElement();
      tempCtx.drawImage(imgElement, 0, 0, tempCanvas.width, tempCanvas.height);
    
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const data = imageData.data;
    
      // Convert to grayscale
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = data[i + 1] = data[i + 2] = avg;
      }
    
      // Apply edge detection using the enhanced Canny algorithm
      const edgeData = enhancedCannyEdgeDetection(data, tempCanvas.width, tempCanvas.height);
    
      // Post-process the edges to clean up small artifacts and make the outlines smoother
      const processedEdgeData = cleanUpEdges(edgeData, tempCanvas.width, tempCanvas.height);
    
      // Set processed edges to the final image
      const finalImageData = new ImageData(processedEdgeData, tempCanvas.width, tempCanvas.height);
      tempCtx.putImageData(finalImageData, 0, 0);
    
      // Create a Fabric Image object from the outlined canvas
      const outlinedImage = new fabric.Image(tempCanvas, {
        left: 0,
        top: 0,
        hasBorders: true,
        hasControls: true,
        lockMovementX: false,
        lockMovementY: false,
        lockRotation: false,
        lockScalingX: false,
        lockScalingY: false,
      });
    
      fabricCanvas.current.setBackgroundColor("white", fabricCanvas.current.renderAll.bind(fabricCanvas.current));
    
      // Get the original image object and center it on the canvas
      const canvasWidth = fabricCanvas.current.width!;
      const canvasHeight = fabricCanvas.current.height!;
      const imageWidth = imageObj.width!;
      const imageHeight = imageObj.height!;
      imageObj.set({
        left: (canvasWidth - imageWidth) / 2,
        top: (canvasHeight - imageHeight) / 2,
        hasControls: true,
        hasBorders: true,
        lockMovementX: false,
        lockMovementY: false,
      });
    
      // Add both images (original and traced) to the canvas
      fabricCanvas.current?.clear(); // Clear any existing objects
      fabricCanvas.current?.add(imageObj); // Add the original image
      fabricCanvas.current?.add(outlinedImage); // Add the traced image
    
      fabricCanvas.current?.renderAll();
    
      if (onSegmentsUpdated) {
        const segmentedImageUrl = tempCanvas.toDataURL("image/png");
        onSegmentsUpdated(segmentedImageUrl);
      }
    };
    
    // Function to clean up edges and make them more suitable for coloring
    const cleanUpEdges = (data: Uint8ClampedArray, width: number, height: number) => {
      const cleanedData = new Uint8ClampedArray(data);
    
      // Post-process to remove small noise and make the edges more continuous
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const i = (y * width + x) * 4;
          const neighborValues = [
            data[i - 4], data[i + 4], // Left and right neighbors
            data[i - width * 4], data[i + width * 4], // Top and bottom neighbors
          ];
    
          // If a pixel is an edge and at least one of its neighbors is also an edge, keep it
          if (data[i] === 0) { // Black (edge)
            const hasNeighborEdge = neighborValues.some(value => value === 0);
            if (!hasNeighborEdge) {
              cleanedData[i] = 255; // Set it to white if no neighbors are edges
              cleanedData[i + 1] = 255;
              cleanedData[i + 2] = 255;
            }
          }
        }
      }
    
      return cleanedData;
    };
    

    // Enhanced Canny edge detection
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
    
          // If edge is detected, set to black, otherwise set to white
          const edgeValue = magnitude > 150 ? 0 : 255;
    
          edgeData[i] = edgeData[i + 1] = edgeData[i + 2] = edgeValue;
          edgeData[i + 3] = 255; // Full opacity
        }
      }
    
      return edgeData;
    };    

    const toggleGrid = () => {
      setIsGridVisible(prev => !prev);
    };

    return (
      <div className="image-canvas-container">
        {uploadedImage && (
          <div className="image-close-button" onClick={onDeleteImage}>
            &times;
          </div>
        )}
        <canvas ref={fabricCanvasRef} />
        <button className="segment-button" onClick={outlineImage}>
          Outline Image
        </button>
        <button className="toggle-grid-button" onClick={toggleGrid}>
          {isGridVisible ? "Hide Grid" : "Show Grid"}
        </button>
        <button className="toggle-grid-button" onClick={toggleFrameEditability}>
          {isFrameEditable ? "Lock Frame" : "Edit Frame"}
        </button>
      </div>
    );
  }
);

export default ImageCanvas;
