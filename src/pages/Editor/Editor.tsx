import React, { useState, useRef, useEffect } from "react";
import Toolbar from "../../components/Toolbar/Toolbar";
import "./Editor.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { jsPDF } from "jspdf";
import ColorsList from "../../components/ColorsList/ColorsList";
import ImageCanvas from "../../components/ImageCanvas/ImageCanvas";
import TextBox from "../../components/TextBox/TextBox";

const Editor: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 600, height: 600 });
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [colors, setColors] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [segmentedImage, setSegmentedImage] = useState<string | null>(null);
  const fabricCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const dropAreaRef = useRef<HTMLDivElement | null>(null);
  const [isFrameEditable, setIsFrameEditable] = useState(false);

  useEffect(() => {
    const fetchColors = async () => {
      try {
        const response = await fetch("http://localhost:5001/colors");
        const data = await response.json();
        setColors(data);
      } catch (error) {
        console.error("Error fetching colors:", error);
      }
    };

    fetchColors();

    const handleDrop = (event: DragEvent) => {
      event.preventDefault();
      const file = event.dataTransfer?.files[0];
      if (file) {
        handleFile(file);
      }
    };

    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
    };

    const dropArea = dropAreaRef.current;
    if (dropArea) {
      dropArea.addEventListener("drop", handleDrop);
      dropArea.addEventListener("dragover", handleDragOver);
    }

    return () => {
      if (dropArea) {
        dropArea.removeEventListener("drop", handleDrop);
        dropArea.removeEventListener("dragover", handleDragOver);
      }
    };
  }, []);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      pushToHistory(e.target?.result as string, imageSize);
    };
    reader.readAsDataURL(file);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const toggleFrameEditability = () => {
    setIsFrameEditable((prev) => !prev);
  };

  const pushToHistory = (
    image: string | null,
    size: { width: number; height: number }
  ) => {
    setHistory((prevHistory) => {
      const updatedHistory = prevHistory.slice(0, historyIndex + 1);
      updatedHistory.push({ image, size });
      return updatedHistory;
    });
    setHistoryIndex((prevIndex) => prevIndex + 1);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDeleteImage = () => {
    setUploadedImage(null);
    setImageSize({ width: 600, height: 600 });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    pushToHistory(null, { width: 600, height: 600 });
  };

  const handleExportPDF = () => {
    const canvasElement = fabricCanvasRef.current;
    
    if (!canvasElement || !uploadedImage) return;
  
    // Create a temporary image element to get the image's dimensions
    const imageElement = new Image();
    imageElement.src = uploadedImage;
  
    imageElement.onload = () => {
      const imgWidth = imageElement.width;
      const imgHeight = imageElement.height;
  
      // Create a temporary canvas to render the image without extra space
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        // Draw the image onto the temporary canvas to access its pixel data
        tempCanvas.width = imgWidth;
        tempCanvas.height = imgHeight;
        tempCtx.drawImage(imageElement, 0, 0);
  
        // Get the image data from the canvas to find the bounds of the content
        const imageData = tempCtx.getImageData(0, 0, imgWidth, imgHeight);
        const data = imageData.data;
  
        let top = imgHeight;
        let bottom = 0;
        let left = imgWidth;
        let right = 0;
  
        // Find the boundaries of the non-empty image
        for (let y = 0; y < imgHeight; y++) {
          for (let x = 0; x < imgWidth; x++) {
            const index = (y * imgWidth + x) * 4; // RGBA index
            const alpha = data[index + 3]; // Alpha channel (transparency)
  
            if (alpha > 0) { // If the pixel is not transparent
              if (y < top) top = y;
              if (y > bottom) bottom = y;
              if (x < left) left = x;
              if (x > right) right = x;
            }
          }
        }
  
        // Calculate the width and height of the cropped image
        const croppedWidth = right - left;
        const croppedHeight = bottom - top;
  
        // Create a new temporary canvas to crop the image
        const cropCanvas = document.createElement('canvas');
        const cropCtx = cropCanvas.getContext('2d');
        if (cropCtx) {
          cropCanvas.width = croppedWidth;
          cropCanvas.height = croppedHeight;
  
          // Draw the cropped section of the image onto the new canvas
          cropCtx.drawImage(
            imageElement,
            left, top, croppedWidth, croppedHeight,
            0, 0, croppedWidth, croppedHeight
          );
  
          // Create the PDF using the cropped image's dimensions
          const doc = new jsPDF({
            orientation: "portrait",
            unit: "px",
            format: [croppedWidth, croppedHeight],
          });
  
          // Add the cropped image to the PDF
          doc.addImage(cropCanvas.toDataURL('image/png'), 'PNG', 0, 0, croppedWidth, croppedHeight);
  
          // Save the PDF
          doc.save("exported-image.pdf");
        }
      }
    };
  };  

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevHistory = history[historyIndex - 1];
      setUploadedImage(prevHistory.image);
      setImageSize(prevHistory.size);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextHistory = history[historyIndex + 1];
      setUploadedImage(nextHistory.image);
      setImageSize(nextHistory.size);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const handlePlusClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="editor-container">
      <div className="hamburger-menu" onClick={toggleSidebar}>
        <FontAwesomeIcon icon={faBars} />
      </div>
      <div className={`editor-sidebar ${isSidebarOpen ? "show" : ""}`}>
        <div className="import-text">
          <p>Import</p>
        </div>
        <button
          className="add-file-button"
          onClick={() => fileInputRef.current?.click()}
        >
          Add File
        </button>
        <input
          type="file"
          id="file-input"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />

        <div className="import-text">
          <p>Export</p>
          <button className="export-button" onClick={handleExportPDF}>
            Export PDF
          </button>
        </div>
      </div>

      <div className="canvas-container" ref={dropAreaRef}>
        <div className="canvas-area">
          {uploadedImage ? (
            <ImageCanvas
              uploadedImage={uploadedImage}
              ref={fabricCanvasRef}
              onSegmentsUpdated={(segmentedImageUrl) => {
                console.log("Segmented Image Data URL:", segmentedImageUrl);
                setUploadedImage(segmentedImageUrl);
              }}
              onDeleteImage={handleDeleteImage}
              showGrid={false}
              gridSpacing={50}
              toggleFrameEditability={toggleFrameEditability}
            />
          ) : (
            <div className="plus-sign">
              <p onClick={handlePlusClick} style={{ cursor: "pointer" }}>
              ☆ Drag an image here or click to upload ☆
              </p>
            </div>
          )}
          <ColorsList uploadedImage={uploadedImage} />
        </div>
      </div>
      <Toolbar onUndo={handleUndo} onRedo={handleRedo}/>
    </div>
  );
};

export default Editor;
