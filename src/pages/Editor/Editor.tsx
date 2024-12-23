import React, { useState, useRef, useEffect } from "react";
import Toolbar from "../../components/Toolbar/Toolbar";
import "./Editor.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { jsPDF } from "jspdf";
import ColorsList from "../../components/ColorsList/ColorsList";
import ImageCanvas from "../../components/ImageCanvas/ImageCanvas";

const Editor: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 600, height: 600 });
  const [history, setHistory] = useState<any[]>([]); // History stack for undo/redo
  const [historyIndex, setHistoryIndex] = useState<number>(-1); // To track the current position in the history
  const [colors, setColors] = useState<any[]>([]); // Colors fetched from the server
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [segmentedImage, setSegmentedImage] = useState<string | null>(null);

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
  }, []);

  useEffect(() => {
    const updateCanvasSize = () => {
      if (window.innerWidth <= 480) {
        setImageSize({ width: 150, height: 150 });
      } else if (window.innerWidth <= 768) {
        setImageSize({ width: 400, height: 400 });
      } else {
        setImageSize({ width: 550, height: 550 });
      }
    };
  
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);
  
  
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const imageUrl = URL.createObjectURL(event.target.files[0]);
      setUploadedImage(imageUrl);
    }
  };

  const handleDeleteImage = () => {
    setUploadedImage(null);
    setImageSize({ width: 600, height: 600 }); // Reset size
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    pushToHistory(null, { width: 600, height: 600 }); // Save deletion to history
  };

  const handleExportPDF = () => {
    const exportImage = segmentedImage || uploadedImage;
  
    if (!exportImage) return;
  
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [imageSize.width, imageSize.height],
    });
  
    doc.addImage(
      exportImage,
      "PNG", // Use "PNG" for segmented image (as it is a Data URL of a PNG)
      0,
      0,
      imageSize.width,
      imageSize.height
    );
  
    doc.save("exported-image.pdf");
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
      {/* Sidebar */}
      <div className="hamburger-menu" onClick={toggleSidebar}>
        <FontAwesomeIcon icon={faBars} />
      </div>
      <div className={`editor-sidebar ${isSidebarOpen ? "show" : ""}`}>
        <div className="import-text">
          <p>Import</p>
        </div>
        <button
          className="add-file-button"
          onClick={() => fileInputRef.current?.click()} // Trigger the file input
        >
          Add File
        </button>
        <input
          type="file"
          id="file-input"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: "none" }} // Hide the input visually
        />

        <div className="import-text">
          <p>Export</p>
          {/* Button for Exporting PDF */}
          <button className="export-button" onClick={handleExportPDF}>
            Export PDF
          </button>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="canvas-container">
        {uploadedImage ? (
          <ImageCanvas
          uploadedImage={uploadedImage}
          onSegmentsUpdated={(segmentedImageUrl) => {
            console.log("Segmented Image Data URL:", segmentedImageUrl);
            setUploadedImage(segmentedImageUrl); // Update the current image with the segmented image
          }}
          onDeleteImage={handleDeleteImage}
        />
        
        
        ) : (
          <div className="plus-sign">
            <p onClick={handlePlusClick} style={{ cursor: "pointer" }}>
              +
            </p>
          </div>
        )}
        {/* <input type="file" accept="image/*" onChange={handleImageUpload} />
      {uploadedImage && <img src={uploadedImage} alt="Uploaded" className="preview-image" />} */}
      <ColorsList uploadedImage={uploadedImage} />
      </div>

      {/* Toolbar */}
      <Toolbar onUndo={handleUndo} onRedo={handleRedo} />
    </div>
  );
};

export default Editor;
