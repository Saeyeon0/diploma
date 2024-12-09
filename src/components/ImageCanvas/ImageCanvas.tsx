import React, { useRef, useEffect } from "react";
import { fabric } from "fabric";
import "./ImageCanvas.css"; // Import the CSS file for styles

interface ImageCanvasProps {
  uploadedImage: string | null;
  onSegmentsUpdated?: (segments: any[]) => void; // Callback to send updated segments back to the parent
  onDeleteImage: () => void; // Callback to handle image deletion
}

const ImageCanvas: React.FC<ImageCanvasProps> = ({
  uploadedImage,
  onSegmentsUpdated,
  onDeleteImage,
}) => {
  const fabricCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricInstanceRef = useRef<fabric.Canvas | null>(null); // Create a reference for the Fabric.js canvas

  // Initialize the Fabric.js canvas
  useEffect(() => {
    if (fabricCanvasRef.current) {
        const fabricCanvas = new fabric.Canvas(fabricCanvasRef.current, {
          width: 700,
          height: 700,
          backgroundColor: "#f0f0f0",
          preserveObjectStacking: true,
        });

      fabricInstanceRef.current = fabricCanvas; // Assign Fabric canvas to the ref

      // Cleanup function to dispose the canvas
      return () => {
        fabricCanvas.dispose();
      };
    }
  }, []);
  
  // Upload and render image on Fabric.js canvas
  useEffect(() => {
    if (uploadedImage && fabricInstanceRef.current) {
        fabric.Image.fromURL(uploadedImage, (img) => {
          img.scaleToWidth(550);
          img.scaleToHeight(550);
  
          fabricInstanceRef.current?.clear();
          fabricInstanceRef.current?.add(img);
          fabricInstanceRef.current?.renderAll();
        });
      }
    }, [uploadedImage]);

  useEffect(() => {
    const checkOpenCV = () => {
      if (cv && cv.getBuildInformation) {
        console.log("OpenCV loaded successfully!");
      } else {
        setTimeout(checkOpenCV, 100);
      }
    };
  
    checkOpenCV();
  }, []);

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
  
      // Set canvas size
      tempCanvas.width = imageObj.width!;
      tempCanvas.height = imageObj.height!;
  
      // Draw the original image onto the temporary canvas
      tempCtx.drawImage(imgElement, 0, 0);
  
      // Get image data
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const data = imageData.data;
  
      // Extract unique colors
      const colorSet = new Set<string>();
  
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
  
        // Ignore fully transparent pixels
        if (a > 0) {
          const color = `rgb(${r}, ${g}, ${b})`;
          colorSet.add(color);
        }
      }
  
      const uniqueColors = Array.from(colorSet);
  
      // Pass unique colors to the parent component
      onSegmentsUpdated?.(uniqueColors);
  
      // Edge detection logic (as before)
      const src = cv.imread(tempCanvas);
      const dst = new cv.Mat();
  
      cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);
      cv.Canny(src, dst, 50, 150);
  
      const whiteBackground = new cv.Mat.zeros(dst.rows, dst.cols, cv.CV_8UC3);
      whiteBackground.setTo(new cv.Scalar(255, 255, 255));
  
      for (let i = 0; i < dst.rows; i++) {
        for (let j = 0; j < dst.cols; j++) {
          if (dst.ucharPtr(i, j)[0] !== 0) {
            whiteBackground.ucharPtr(i, j)[0] = 0;
            whiteBackground.ucharPtr(i, j)[1] = 0;
            whiteBackground.ucharPtr(i, j)[2] = 0;
          }
        }
      }
  
      cv.imshow(tempCanvas, whiteBackground);
  
      const resultImage = new fabric.Image(tempCanvas);
      canvas.clear();
      canvas.add(resultImage);
      canvas.renderAll();
  
      // Cleanup
      src.delete();
      dst.delete();
      whiteBackground.delete();
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
