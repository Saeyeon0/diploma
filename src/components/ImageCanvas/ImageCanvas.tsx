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
  const fabricInstanceRef = useRef<fabric.Canvas | null>(null); // Create a reference for the Fabric.js canvas

  // Initialize the Fabric.js canvas
  useEffect(() => {
    if (fabricCanvasRef.current) {
      const newWidth = window.innerWidth <= 480 ? 150 : window.innerWidth <= 768 ? 400 : 550;
      const newHeight = newWidth; // Maintain a square aspect ratio

      const fabricCanvas = new fabric.Canvas(fabricCanvasRef.current, {
        width: newWidth,
        height: newHeight,
        backgroundColor: "#f0f0f0",
        preserveObjectStacking: true,
      });

      fabricInstanceRef.current = fabricCanvas; // Assign Fabric canvas to the ref

      // Cleanup function to dispose the canvas
      return () => {
        fabricCanvas.dispose();
      };
    }
  }, [width, height]);
  
  // Upload and render image on Fabric.js canvas
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
      const canvas = fabricInstanceRef.current;
  
      const imageObj = canvas.getObjects("image")[0] as fabric.Image;
  
      if (!imageObj) return;
  
      const imgElement = imageObj.getElement();
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");
  
      if (!tempCtx || !imgElement) return;
  
      tempCanvas.width = imageObj.width!;
      tempCanvas.height = imageObj.height!;
      tempCtx.drawImage(imgElement, 0, 0);
  
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const data = imageData.data;
      const segments: fabric.Rect[] = [];
  
      const step = 20; // Step size for pixel grouping
  
      for (let y = 0; y < tempCanvas.height; y += step) {
        for (let x = 0; x < tempCanvas.width; x += step) {
          const i = (y * tempCanvas.width + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
  
          const rect = new fabric.Rect({
            left: x,
            top: y,
            width: step,
            height: step,
            fill: `rgb(${r}, ${g}, ${b})`,
            selectable: true,
            opacity: 0.6,
          });
  
          canvas.add(rect);
          segments.push(rect);
        }
      }
  
      canvas.renderAll();
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
