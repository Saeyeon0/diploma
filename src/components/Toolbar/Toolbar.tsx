import React, { useState, useRef } from "react";
import { fabric } from "fabric";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMousePointer,
  faCropSimple,
  faFont,
  faRotateLeft,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";
import TextBox from "../TextBox/TextBox";
import FrameTool from "../FrameTool/FrameTool";
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
  const fabricCanvas = useRef<fabric.Canvas | null>(null); // Ensure this is correctly initialized elsewhere
  const [isFrameEditable, setIsFrameEditable] = useState(false);

  const handleAddTextBox = () => {
    const newTextBox: TextBoxData = {
      id: Math.random().toString(36).substr(2, 9),
    };
    setTextBoxes([...textBoxes, newTextBox]);
  };

  const handleDeleteTextBox = (id: string) => {
    setTextBoxes(textBoxes.filter((box) => box.id !== id));
  };

  const toggleFrameEditability = () => {
    setIsFrameEditable((prev) => !prev);

    if (fabricCanvas.current) {
      const img = fabricCanvas.current.getObjects("image")[0] as fabric.Image;
      if (img) {
        img.set({
          selectable: !isFrameEditable,
          hasControls: !isFrameEditable,
          hasBorders: !isFrameEditable,
          lockMovementX: isFrameEditable,
          lockMovementY: isFrameEditable,
          lockScalingX: isFrameEditable,
          lockScalingY: isFrameEditable,
          lockRotation: isFrameEditable,
        });
        fabricCanvas.current.renderAll();
      }
    }
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

        {/* Integrate FrameTool as a separate component */}
        <FrameTool fabricCanvas={fabricCanvas} />

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
