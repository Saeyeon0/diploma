import React from "react";
import Toolbar from "../../components/Toolbar/Toolbar";
import "./Editor.css";

const Editor: React.FC = () => {
  return (
    <div className="editor-container">
      <div className="canvas">
        <p>Your editor canvas goes here!</p>
      </div>
      <div className="properties-panel">
        <h3>Properties</h3>
        <p>Details of the selected item</p>
      </div>
      {/* Import Toolbar Component */}
      <Toolbar />
    </div>
  );
};

export default Editor;
