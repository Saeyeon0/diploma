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
      const src = cv.imread(tempCanvas);
      const dst = new cv.Mat();
  
      // Convert to grayscale
      cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);
  
      // Apply Canny edge detection
      cv.Canny(src, dst, 50, 150);
  
      // Create a white background image
      const whiteBackground = new cv.Mat.zeros(dst.rows, dst.cols, cv.CV_8UC3);
      whiteBackground.setTo(new cv.Scalar(255, 255, 255)); // Set to white
  
      // Copy the edges onto the white background
      for (let i = 0; i < dst.rows; i++) {
        for (let j = 0; j < dst.cols; j++) {
          if (dst.ucharPtr(i, j)[0] !== 0) {
            whiteBackground.ucharPtr(i, j)[0] = 0;   // Set black color for detected edge (B)
            whiteBackground.ucharPtr(i, j)[1] = 0;   // (G)
            whiteBackground.ucharPtr(i, j)[2] = 0;   // (R)
          }
        }
      }
  
      // Display the result on the Fabric canvas
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
