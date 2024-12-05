import React, { useEffect, useState } from "react";
import "./ColorsList.css";

interface ColorsListProps {
  colors: string[]; // Assuming colors are passed as an array of strings (e.g., hex values)
}

const ColorsList: React.FC = () => {
  const [colors, setColors] = useState<string[]>([]);  // State to hold the fetched colors

  // Fetch colors from the server
  useEffect(() => {
    fetch("http://localhost:5001/colors")
      .then((response) => response.json())
      .then((data) => {
        const colorHexValues = data.map((color: { hex: string }) => color.hex); // Map data to just hex values
        setColors(colorHexValues); // Set the colors to state
      })
      .catch((error) => {
        console.error("Error fetching colors:", error);
      });
  }, []);  // Empty array ensures this effect runs only once after the initial render

  return (
    <div className="colors-list">
      {colors.length > 0 ? (
        colors.map((color, index) => (
          <div
            key={index}
            className="color-item"
            style={{ backgroundColor: color }}
          >
            {color}
          </div>
        ))
      ) : (
        <p>No colors available</p>
      )}
    </div>
  );
};

export default ColorsList;
