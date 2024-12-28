import React, { useRef, useEffect } from "react";
import { fabric } from "fabric";
import "./ImageCanvas.css";

interface ImageCanvasProps {
  uploadedImage: string;
  onSegmentsUpdated?: (segmentedImageUrl: string) => void; // Accepts a string
  onDeleteImage: () => void;
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
    if (!fabricInstanceRef.current) return;
  
    const canvas = fabricInstanceRef.current;
  
    // Get the first image object on the canvas
    const imageObj = canvas.getObjects("image")[0] as fabric.Image;
    if (!imageObj) return;
  
    // Get the image element and context
    const imgElement = imageObj.getElement();
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx || !imgElement) return;
  
    // Set canvas size
    tempCanvas.width = imageObj.width!;
    tempCanvas.height = imageObj.height!;
  
    // Draw the original image onto the temporary canvas
    tempCtx.drawImage(imgElement, 0, 0);
  
    // --- Perform Edge Detection ---
  
    const src = cv.imread(tempCanvas);
    const dst = new cv.Mat();
  
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);
    cv.Canny(src, dst, 50, 150);
  
    // Create a white background for the edge-detected image
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
  
    // Draw the final edge-detected image onto the temporary canvas
    cv.imshow(tempCanvas, whiteBackground);
  
    // Convert the temporary canvas to a Data URL
    const segmentedImageUrl = tempCanvas.toDataURL("image/png");
  
    // Pass the segmented image Data URL to the parent component
    if (onSegmentsUpdated) {
      onSegmentsUpdated(segmentedImageUrl);
    }
  
    // Replace the original image on the fabric canvas with the segmented image
    const resultImage = new fabric.Image(tempCanvas);
    canvas.clear();
    canvas.add(resultImage);
    canvas.renderAll();
  
    // Cleanup
    src.delete();
    dst.delete();
    whiteBackground.delete();
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
