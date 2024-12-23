import React, { useEffect, useState, useRef } from "react";
import ColorThief from "colorthief";
import "./ColorsList.css";

interface Color {
  _id: string;
  name: string;
  hex: string;
  order: number;
  number?: number; // Optional number field for assigned numbers
}

interface ColorsListProps {
  uploadedImage: string | null;
}

const ColorsList: React.FC<ColorsListProps> = ({ uploadedImage }) => {
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightedColors, setHighlightedColors] = useState<Color[]>([]);
  const [isVisible, setIsVisible] = useState<boolean>(false); // Initially hidden
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch colors from the server
  useEffect(() => {
    fetch("http://localhost:5001/colors")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        const sortedColors = data.sort((a: Color, b: Color) => a.order - b.order);
        setColors(sortedColors);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching colors:", error);
        setError("Failed to load colors. Please try again.");
        setLoading(false);
      });
  }, []);

  // Utility to convert HEX to RGB
  const hexToRgb = (hex: string): [number, number, number] => {
    const bigint = parseInt(hex.slice(1), 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
  };

  // Calculate color distance
  const colorDistance = (rgb1: [number, number, number], rgb2: [number, number, number]) => {
    return Math.sqrt((rgb1[0] - rgb2[0]) ** 2 + (rgb1[1] - rgb2[1]) ** 2 + (rgb1[2] - rgb2[2]) ** 2);
  };

  // Find the closest color from the database
  const findClosestColor = (extractedColor: [number, number, number], dbColors: Color[]) => {
    let closestColor = dbColors[0];
    let minDistance = Infinity;

    dbColors.forEach((dbColor) => {
      const dbRgb = hexToRgb(dbColor.hex);
      const distance = colorDistance(extractedColor, dbRgb);
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = dbColor;
      }
    });

    return closestColor;
  };

  // Extract and match colors using ColorThief
  useEffect(() => {
    if (uploadedImage && colors.length > 0) {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = uploadedImage;

      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Draw the image on the canvas
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);

        const colorThief = new ColorThief();
        const extractedColors = colorThief.getPalette(img, 24) as [number, number, number][]; // Get up to 24 colors

        // Map extracted colors to the closest colors from the database
        const matchedColors: Color[] = [];
        const usedColorIds = new Set<string>();
        let colorCounter = 1;

        extractedColors.forEach((extractedColor, index) => {
          const closestColor = findClosestColor(extractedColor, colors);
          if (!usedColorIds.has(closestColor._id)) {
            matchedColors.push({ ...closestColor, number: colorCounter });
            usedColorIds.add(closestColor._id);

            // Overlay the number on the canvas at random positions
            ctx.fillStyle = "#000";
            ctx.font = "20px Arial";
            ctx.fillText(`${colorCounter}`, 20 + index * 30, 40 + index * 30);
            colorCounter++;
          }
        });

        setHighlightedColors(matchedColors);
        setIsVisible(true); // Show the panel after colors are highlighted
      };

      img.onerror = () => {
        console.error("Failed to load the image for color extraction.");
      };
    }
  }, [uploadedImage, colors]);

  // Toggle visibility of the colors list
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  if (loading) {
    return <p>Loading colors...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <div className="colors-panel">
      <h3>Colors</h3>
      <button className="close-button" onClick={toggleVisibility}>
        {isVisible ? "✕" : "↓"}
      </button>

      <canvas ref={canvasRef} className="image-canvas"></canvas>

      {isVisible && (
        <div className="colors-list">
          {highlightedColors.length > 0 ? (
            highlightedColors.map((color, index) => (
              <div key={index} className="color-item" style={{ backgroundColor: color.hex }}>
                <span className="color-number">{color.number}</span> {color.name}
              </div>
            ))
          ) : (
            colors.map((color, index) => (
              <div key={index} className="color-item" style={{ backgroundColor: color.hex }}>
                {color.name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ColorsList;
