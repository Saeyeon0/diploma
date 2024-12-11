import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMousePointer,
  faCropSimple,
  faFont,
  faRotateLeft,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";
import "./Toolbar.css";

interface ToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ onUndo, onRedo }) => {
  const [isTextMode, setIsTextMode] = useState<boolean>(false);
  const [text, setText] = useState<string>(""); // Text input by the user
  const [textPosition, setTextPosition] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Switch text mode on and off
  const handleTextModeToggle = () => {
    setIsTextMode(!isTextMode);
  };

  // Handle text input change
  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setText(event.target.value);
  };

  // Handle mouse click on canvas to place the text
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isTextMode) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left; // X position relative to the canvas
      const y = event.clientY - rect.top;  // Y position relative to the canvas

      setTextPosition({ x, y });
    }
  };

  // Render the text on the canvas
  const renderText = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear the canvas (if needed) and render the text at the new position
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Optional: Clears canvas before drawing

    ctx.fillStyle = "#000";
    ctx.font = "30px Arial";
    ctx.fillText(text, textPosition.x, textPosition.y);
  };

  // Trigger text rendering whenever the text or position changes
  useEffect(() => {
    renderText();
  }, [text, textPosition]);

  return (
    <div>
      <div className="toolbar">
        <button className="toolbar-button" title="Undo" onClick={onUndo}>
          <FontAwesomeIcon icon={faRotateLeft} />
        </button>
        <button className="toolbar-button" title="Redo" onClick={onRedo}>
          <FontAwesomeIcon icon={faRotateRight} />
        </button>
        <button className="toolbar-button" title="Cursor">
          <FontAwesomeIcon icon={faMousePointer} />
        </button>
        <button className="toolbar-button" title="Frame">
          <FontAwesomeIcon icon={faCropSimple} />
        </button>
        <button className="toolbar-button" title="Text" onClick={handleTextModeToggle}>
          <FontAwesomeIcon icon={faFont} />
        </button>
      </div>

      {/* Text Input Box (conditionally rendered based on text mode) */}
      {isTextMode && (
        <div
          className="text-input-box"
          style={{
            position: "absolute",
            top: `${textPosition.y}px`,
            left: `${textPosition.x}px`,
            zIndex: 10,
          }}
        >
          <input
            type="text"
            value={text}
            onChange={handleTextChange}
            placeholder="Type your text"
            style={{
              width: "200px",
              padding: "5px",
              fontSize: "16px",
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Toolbar;
