import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMousePointer,
  faCropSimple,
  faFont,
} from "@fortawesome/free-solid-svg-icons";
import "./Toolbar.css";

const Toolbar: React.FC = () => {
  return (
    <div className="toolbar">
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
