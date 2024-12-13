// TextBox.tsx
import React, { useState } from "react";
import Draggable from "react-draggable";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";
import "./TextBox.css"

interface TextBoxProps {
  id: string;
  onDelete: (id: string) => void;
}

const TextBox: React.FC<TextBoxProps> = ({ id, onDelete }) => {
  const [text, setText] = useState<string>("Double-click to edit");

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
  };

  return (
    <Draggable>
      <ResizableBox width={100} height={50} minConstraints={[100, 50]} maxConstraints={[400, 200]}>
        <div className="text-box">
          <textarea
            value={text}
            onChange={handleTextChange}
            className="text-area"
            placeholder="Type your text"
          />
          <button className="delete-button" onClick={() => onDelete(id)}>
            ✕
          </button>
        </div>
      </ResizableBox>
    </Draggable>
  );
};

export default TextBox;