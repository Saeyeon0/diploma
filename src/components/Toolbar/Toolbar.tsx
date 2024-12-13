// Toolbar.tsx
import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMousePointer,
  faCropSimple,
  faFont,
  faRotateLeft,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";
import TextBox from "../TextBox/TextBox";
import "./Toolbar.css";

interface ToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
}

interface TextBoxData {
  id: string;
}

const Toolbar: React.FC<ToolbarProps> = ({ onUndo, onRedo }) => {
  const [textBoxes, setTextBoxes] = useState<TextBoxData[]>([]);

  const handleAddTextBox = () => {
    const newTextBox: TextBoxData = {
      id: Math.random().toString(36).substr(2, 9),
    };
    setTextBoxes([...textBoxes, newTextBox]);
  };

  const handleDeleteTextBox = (id: string) => {
    setTextBoxes(textBoxes.filter((box) => box.id !== id));
  };

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
        <button className="toolbar-button" title="Add Text" onClick={handleAddTextBox}>
          <FontAwesomeIcon icon={faFont} />
        </button>
      </div>

      <div className="canvas">
        {textBoxes.map((box) => (
          <TextBox key={box.id} id={box.id} onDelete={handleDeleteTextBox} />
        ))}
      </div>
    </div>
  );
};

export default Toolbar;
