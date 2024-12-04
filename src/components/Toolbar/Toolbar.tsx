import React from "react";
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
  return (
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
      <button className="toolbar-button" title="Text">
        <FontAwesomeIcon icon={faFont} />
      </button>
    </div>
  );
};

export default Toolbar;
