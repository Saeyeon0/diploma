import React, { useState, useRef, useEffect } from "react";
import Draggable from "react-draggable";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";
import "./TextBox.css";

interface TextBoxProps {
  id: string;
  onDelete: (id: string) => void;
}

const TextBox: React.FC<TextBoxProps> = ({ id, onDelete }) => {
  const [text, setText] = useState<string>("Click to edit");
  const [isEditing, setIsEditing] = useState<boolean>(true);
  const textBoxRef = useRef<HTMLDivElement>(null);

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevents new line in textarea
      setIsEditing(false);
    }
  };

  const handleFocus = () => {
    setIsEditing(true);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (textBoxRef.current && !textBoxRef.current.contains(event.target as Node)) {
      setIsEditing(false); // Hide controls if clicked outside
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <Draggable>
      <div ref={textBoxRef} className={`text-box-container ${isEditing ? "editing" : "hidden-controls"}`}>
        <ResizableBox
          width={100}
          height={50}
          minConstraints={[100, 50]}
          maxConstraints={[400, 200]}
          className="resizable-box"
        >
          <div className="text-box">
            <textarea
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              className="text-area"
              placeholder="Type your text"
            />
            {isEditing && (
              <button className="delete-button" onClick={() => onDelete(id)}>
                ✕
              </button>
            )}
          </div>
        </ResizableBox>
      </div>
    </Draggable>
  );
};

export default TextBox;
