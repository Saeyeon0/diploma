import React, { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { fabric } from "fabric";
import "./ImageCanvas.css";

interface ImageCanvasProps {
  uploadedImage: string;
  onSegmentsUpdated?: (segmentedImageUrl: string) => void;
  onDeleteImage: () => void;
}

const ImageCanvas = forwardRef<HTMLCanvasElement | null, ImageCanvasProps>(
  ({ uploadedImage, onSegmentsUpdated, onDeleteImage }, ref) => {
    const fabricCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const fabricCanvas = useRef<fabric.Canvas | null>(null);

    useImperativeHandle(ref, () => fabricCanvasRef.current as HTMLCanvasElement);

    useEffect(() => {
      if (fabricCanvasRef.current) {
        fabricCanvas.current = new fabric.Canvas(fabricCanvasRef.current, {
          width: 700,
          height: 700,
          backgroundColor: "#ffffff",
          preserveObjectStacking: true,
        });
    
        fabric.Image.fromURL(uploadedImage, (img) => {
          const originalSize = img.getOriginalSize();
          const aspectRatio = originalSize.width / originalSize.height;
          let newWidth, newHeight;
    
          if (originalSize.width > originalSize.height) {
            newWidth = 550;
            newHeight = 550 / aspectRatio;
          } else {
            newHeight = 550;
            newWidth = 550 * aspectRatio;
          }
    
          img.scaleToWidth(newWidth);
          img.scaleToHeight(newHeight);
    
          img.set({
            left: (fabricCanvas.current!.width! - newWidth) / 2,
            top: (fabricCanvas.current!.height! - newHeight) / 2,
          });
    
          fabricCanvas.current?.add(img);
          fabricCanvas.current?.renderAll();
        });
    
        return () => {
          fabricCanvas.current?.dispose();
        };
      }
    }, [uploadedImage]);
  
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
    
      // Apply edge detection using the Canny algorithm
      const edgeData = cannyEdgeDetection(data, tempCanvas.width, tempCanvas.height);
    
      // Set non-edge pixels to white and edge pixels to black
      for (let i = 0; i < edgeData.length; i += 4) {
        if (edgeData[i] === 255) {
          edgeData[i] = 0;     // Red
          edgeData[i + 1] = 0; // Green
          edgeData[i + 2] = 0; // Blue
        } else {
          edgeData[i] = 255;     // Red
          edgeData[i + 1] = 255; // Green
          edgeData[i + 2] = 255; // Blue
          edgeData[i + 3] = 255; // Full opacity (white background)
        }
      }
    
      // Put the processed edge data back to the canvas
      const finalImageData = new ImageData(edgeData, tempCanvas.width, tempCanvas.height);
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
    
      // Set the background to white and clear the canvas
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

    // Canny edge detection implementation
    const cannyEdgeDetection = (data: Uint8ClampedArray, width: number, height: number) => {
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
          const edgeValue = magnitude > 180 ? 255 : 0;

          edgeData[i] = edgeData[i + 1] = edgeData[i + 2] = edgeValue;
          edgeData[i + 3] = 255; // Full opacity
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
        <button className="segment-button" onClick={outlineImage}>
          Outline Image
        </button>
      </div>
    );
  }
);

export default ImageCanvas;
