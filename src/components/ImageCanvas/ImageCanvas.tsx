import React, { useRef, useEffect } from "react";
import { fabric } from "fabric";
import "./ImageCanvas.css"; // Import the CSS file for styles

interface ImageCanvasProps {
  uploadedImage: string | null;
  width: number;
  height: number;
  onSegmentsUpdated?: (segments: any[]) => void; // Callback to send updated segments back to the parent
  onDeleteImage: () => void; // Callback to handle image deletion
}

const ImageCanvas: React.FC<ImageCanvasProps> = ({
  uploadedImage,
  width,
  height,
  onSegmentsUpdated,
  onDeleteImage,
}) => {
  const fabricCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricInstanceRef = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    if (fabricCanvasRef.current) {
      const fabricCanvas = new fabric.Canvas(fabricCanvasRef.current, {
        width,
        height,
        backgroundColor: "#f0f0f0",
        preserveObjectStacking: true,
      });

      fabricInstanceRef.current = fabricCanvas;

      // Cleanup function to dispose the canvas
      return () => {
        fabricCanvas.dispose();
      };
    }
  }, [width, height]);

  useEffect(() => {
    if (uploadedImage && fabricInstanceRef.current) {
      fabric.Image.fromURL(uploadedImage, (img) => {
        const scaleFactor = 1; // Adjust this factor to make the image bigger or smaller

        img.set({
          left: 0,
          top: 0,
          scaleX: (width / img.width!) * scaleFactor, // Apply scale factor to width
          scaleY: (height / img.height!) * scaleFactor, // Apply scale factor to height
        });

        fabricInstanceRef.current?.clear(); // Clear the canvas before adding a new image
        fabricInstanceRef.current?.add(img);
        fabricInstanceRef.current?.renderAll();
      });
    }
  }, [uploadedImage, width, height]);

  // Example function for detecting and segmenting shapes (mock logic)
  const segmentImage = () => {
    if (fabricInstanceRef.current) {
      const objects = fabricInstanceRef.current.getObjects();
      // Example: Create a mock segmentation by splitting the canvas into rectangles
      const segments = [];
      for (let i = 0; i < 3; i++) {
        const rect = new fabric.Rect({
          left: i * 100,
          top: i * 100,
          width: 100,
          height: 100,
          fill: `rgb(${50 * i}, ${100 + i * 50}, ${150 - i * 30})`,
          selectable: true,
        });
        fabricInstanceRef.current.add(rect);
        segments.push(rect);
      }

      fabricInstanceRef.current.renderAll();
      onSegmentsUpdated?.(segments);
    }
  };

  return (
    <div className="image-canvas-container">
      {uploadedImage && (
        <div className="image-close-button" onClick={onDeleteImage}>
          &times;
        </div>
      )}

      <canvas ref={fabricCanvasRef} />
      <button className="segment-button" onClick={segmentImage}>
        Segment Image
      </button>
    </div>
  );
};

export default ImageCanvas;
