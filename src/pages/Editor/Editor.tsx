import React, { useState, useRef, useEffect } from "react";
import Toolbar from "../../components/Toolbar/Toolbar";
import "./Editor.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import Draggable from "react-draggable";
import { jsPDF } from "jspdf";

const Editor: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 500, height: 500 });
  const [initialMousePosition, setInitialMousePosition] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState<{
    active: boolean;
    corner: string | null;
  }>({
    active: false,
    corner: null,
  });

  const [history, setHistory] = useState<any[]>([]); // History stack for undo/redo
  const [historyIndex, setHistoryIndex] = useState<number>(-1); // To track the current position in the history

  const imageRef = useRef<HTMLImageElement | null>(null);
  const imageContainerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
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
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        pushToHistory(e.target?.result as string, imageSize); // Save image to history
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteImage = () => {
    setUploadedImage(null);
    setImageSize({ width: 400, height: 400 }); // Reset size
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    pushToHistory(null, { width: 400, height: 400 }); // Save deletion to history
  };

  const handleResizeStart = (e: React.MouseEvent, corner: string) => {
    e.preventDefault();
    setIsResizing({ active: true, corner });
    setInitialMousePosition({ x: e.clientX, y: e.clientY });
  };
  

  const handleResizeMove = (e: MouseEvent) => {
    if (isResizing.active && imageContainerRef.current) {
      const rect = imageContainerRef.current.getBoundingClientRect();
      
      const deltaX = e.clientX - initialMousePosition.x;
      const deltaY = e.clientY - initialMousePosition.y;
  
      let newWidth = imageSize.width;
      let newHeight = imageSize.height;
  
      // Adjust dimensions based on the corner being dragged
      if (isResizing.corner === "top-left") {
        newWidth = imageSize.width - deltaX;
        newHeight = imageSize.height - deltaY;
      } else if (isResizing.corner === "top-right") {
        newWidth = imageSize.width + deltaX;
        newHeight = imageSize.height - deltaY;
      } else if (isResizing.corner === "bottom-left") {
        newWidth = imageSize.width - deltaX;
        newHeight = imageSize.height + deltaY;
      } else if (isResizing.corner === "bottom-right") {
        newWidth = imageSize.width + deltaX;
        newHeight = imageSize.height + deltaY;
      }
  
      // Apply minimum size constraints
      if (newWidth > 100 && newHeight > 100) {
        setImageSize({ width: newWidth, height: newHeight });
      }
  
      // Update the initial position for smoother resizing
      setInitialMousePosition({ x: e.clientX, y: e.clientY });
    }
  };  

  const handleResizeEnd = () => {
    setIsResizing({ active: false, corner: null });
    pushToHistory(uploadedImage, imageSize); // Save resize to history
  };

  useEffect(() => {
    if (isResizing.active) {
      window.addEventListener("mousemove", handleResizeMove);
      window.addEventListener("mouseup", handleResizeEnd);
    } else {
      window.removeEventListener("mousemove", handleResizeMove);
      window.removeEventListener("mouseup", handleResizeEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleResizeMove);
      window.removeEventListener("mouseup", handleResizeEnd);
    };
  }, [isResizing.active]);

  const getDraggableBounds = () => {
    if (canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      return {
        top: -canvasRect.height + imageSize.height,
        left: -canvasRect.width + imageSize.width,
        right: canvasRect.width - imageSize.width,
        bottom: canvasRect.height - imageSize.height,
      };
    }
    return {};
  };

  const handlePlusClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Undo function
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevHistory = history[historyIndex - 1];
      setUploadedImage(prevHistory.image);
      setImageSize(prevHistory.size);
      setHistoryIndex(historyIndex - 1);
    }
  };

  // Redo function
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextHistory = history[historyIndex + 1];
      setUploadedImage(nextHistory.image);
      setImageSize(nextHistory.size);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Export PDF function using jsPDF
  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait", // or "landscape" based on your image aspect ratio
      unit: "px", // unit for measurement, use "px" for pixel-based
      format: [imageSize.width, imageSize.height], // set custom page size to match image size
    });

    if (uploadedImage) {
      const imgWidth = imageSize.width;
      const imgHeight = imageSize.height;
      doc.addImage(
        uploadedImage,
        "JPEG",
        0,
        0,
        imageSize.width,
        imageSize.height
      );
    } // Save the PDF with a name
    doc.save("exported-image.pdf");
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
        <button className="add-file-button">
          <label htmlFor="file-input">Add File</label>
          <input
            type="file"
            id="file-input"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
        </button>
        <div className="import-text">
          <p>Export</p>
          {/* Button for Exporting PDF */}
          <button className="export-button" onClick={handleExportPDF}>
            Export PDF
          </button>
        </div>
      </div>
      <div className="canvas-container" ref={canvasRef}>
        <div className="canvas-area">
          {uploadedImage ? (
            <Draggable bounds={getDraggableBounds()}>
              <div
                style={{
                  width: imageSize.width,
                  height: imageSize.height,
                  position: "relative",
                  display: "inline-block",
                }}
                ref={imageContainerRef}
              >
                <img
                  src={uploadedImage}
                  alt="Uploaded Preview"
                  className="uploaded-image"
                  ref={imageRef}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    border: "2px solid #ccc",
                  }}
                />
                {/* Close (X) Button */}
                <div className="image-close-button" onClick={handleDeleteImage}>
                  &times;
                </div>

                {/* Resize Handles */}
                <div
                  className="resize-handle top-left"
                  onMouseDown={(e) => handleResizeStart(e, "top-left")}
                  style={{ top: 0, left: 0 }}
                />
                <div
                  className="resize-handle top-right"
                  onMouseDown={(e) => handleResizeStart(e, "top-right")}
                  style={{ top: 0, right: 0 }}
                />
                <div
                  className="resize-handle bottom-left"
                  onMouseDown={(e) => handleResizeStart(e, "bottom-left")}
                  style={{ bottom: 0, left: 0 }}
                />
                <div
                  className="resize-handle bottom-right"
                  onMouseDown={(e) => handleResizeStart(e, "bottom-right")}
                  style={{ bottom: 0, right: 0 }}
                />
              </div>
            </Draggable>
          ) : (
            <div className="plus-sign">
              <p onClick={handlePlusClick} style={{ cursor: "pointer" }}>
                +
              </p>
            </div>
          )}
        </div>
      </div>
      <Toolbar onUndo={handleUndo} onRedo={handleRedo} />
    </div>
  );
};

export default Editor;
