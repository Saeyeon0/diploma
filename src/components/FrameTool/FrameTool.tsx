import React, { useState } from "react";
import { fabric } from "fabric";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCropSimple } from "@fortawesome/free-solid-svg-icons";

interface FrameToolProps {
  fabricCanvas: React.MutableRefObject<fabric.Canvas | null>;
}

const FrameTool: React.FC<FrameToolProps> = ({ fabricCanvas }) => {
  const [isFrameEditable, setIsFrameEditable] = useState(false);

  const toggleFrameEditability = () => {
    setIsFrameEditable((prev) => {
      console.log("Toggling frame editability:", !prev);

      if (fabricCanvas.current) {
        // Get the first image object from the canvas
        const img = fabricCanvas.current.getObjects("image")[0] as fabric.Image;

        if (img) {
          const newEditableState = !prev; // Toggle the editability state

          // Update the image properties based on the new editable state
          img.set({
            selectable: newEditableState, // Allow selection
            hasControls: newEditableState, // Show resize handles
            hasBorders: newEditableState, // Show borders
            lockMovementX: !newEditableState, // Unlock horizontal movement
            lockMovementY: !newEditableState, // Unlock vertical movement
            lockScalingX: !newEditableState, // Unlock scaling in X axis
            lockScalingY: !newEditableState, // Unlock scaling in Y axis
            lockRotation: !newEditableState, // Unlock rotation
          });

          // Select the image if it's now editable
          if (newEditableState) {
            fabricCanvas.current.setActiveObject(img); // Select the object for editing
          } else {
            fabricCanvas.current.discardActiveObject(); // Deselect the object if not editable
          }

          // Re-render the canvas to apply the changes
          fabricCanvas.current.renderAll();

          console.log("Image properties:", img); // Log the image properties for debugging
        } else {
          console.log("No image found on the canvas."); // Handle the case where the image is not found
        }
      }

      return !prev; // Toggle the state after updating properties
    });
  };

  const cannyEdgeDetection = (
    data: Uint8ClampedArray,
    width: number,
    height: number
  ) => {
    const edgeData = new Uint8ClampedArray(data.length);
    const sobelX = [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1],
    ];
    const sobelY = [
      [1, 2, 1],
      [0, 0, 0],
      [-1, -2, -1],
    ];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0,
          gy = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const i = ((y + ky) * width + (x + kx)) * 4;
            const grayValue = (data[i] + data[i + 1] + data[i + 2]) / 3;

            gx += grayValue * sobelX[ky + 1][kx + 1];
            gy += grayValue * sobelY[ky + 1][kx + 1];
          }
        }

        const magnitude = Math.sqrt(gx * gx + gy * gy);
        const i = (y * width + x) * 4;
        const edgeValue = magnitude > 180 ? 255 : 0;

        edgeData[i] = edgeData[i + 1] = edgeData[i + 2] = edgeValue;
        edgeData[i + 3] = 255; // Full opacity
      }
    }

    return edgeData;
  };

  return (
    <button
      className={`toolbar-button ${isFrameEditable ? "active" : ""}`}
      title={isFrameEditable ? "Lock Frame" : "Edit Frame"} // Dynamic title based on state
      onClick={toggleFrameEditability}
    >
      <FontAwesomeIcon icon={faCropSimple} />
    </button>
  );
};

export default FrameTool;
