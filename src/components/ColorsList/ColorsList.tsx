import React, { useEffect, useState, useRef } from "react";
import ColorThief from "colorthief";
import "./ColorsList.css";

interface Color {
  _id: string;
  name: string;
  hex: string;
  order: number;
  number?: number;
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
        const sortedColors = data.sort(
          (a: Color, b: Color) => a.order - b.order
        );
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
  const colorDistance = (
    rgb1: [number, number, number],
    rgb2: [number, number, number]
  ) => {
    return Math.sqrt(
      (rgb1[0] - rgb2[0]) ** 2 +
        (rgb1[1] - rgb2[1]) ** 2 +
        (rgb1[2] - rgb2[2]) ** 2
    );
  };

  // Check if a color is grayscale
  const isGrayscale = (rgb: [number, number, number]): boolean => {
    const [r, g, b] = rgb;
    const threshold = 20; // Allowable deviation for grayscale tones
    return (
      Math.abs(r - g) < threshold &&
      Math.abs(g - b) < threshold &&
      Math.abs(b - r) < threshold
    );
  };

  // Check if a color is sufficiently saturated and bright
  const isSaturatedAndBright = (rgb: [number, number, number]): boolean => {
    const [r, g, b] = rgb;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max - min;
    const brightness = max;

    return saturation > 30 && brightness > 50; // Adjust these thresholds as needed
  };

  // Find the closest color from the database, with grayscale filtering
  const findClosestColor = (
    extractedColor: [number, number, number],
    dbColors: Color[],
    threshold: number = 50
  ) => {
    if (isGrayscale(extractedColor)) {
      // If grayscale, map to either black or white based on intensity
      const intensity = extractedColor[0]; // R == G == B in grayscale
      if (intensity < 128)
        return dbColors.find((color) => color.hex === "#000000")!; // Black
      return dbColors.find((color) => color.hex === "#FFFFFF")!; // White
    }

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

    // Return null if no closest color is found
    return closestColor || null;
  };

  // Extract and match colors using ColorThief
  useEffect(() => {
    if (uploadedImage && colors.length > 0) {
      const img = new Image();
      img.crossOrigin = "Anonymous";  // Ensure the image can be loaded from different origins
      img.src = uploadedImage;

      img.onload = () => {
        console.log("Image loaded:", img.width, img.height); // Debugging output
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Scale down the image if it’s too large
        const maxWidth = 800;
        const maxHeight = 800;

        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          if (width > height) {
            width = maxWidth;
            height = width / aspectRatio;
          } else {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const colorThief = new ColorThief();
        try {
          const extractedColors = colorThief.getPalette(img, 24);
          console.log("Extracted colors:", extractedColors); // Debugging output

          const matchedColors: Color[] = [];
          const usedColorIds = new Set<string>();
          let colorCounter = 1;

          extractedColors
            .filter((color) => isSaturatedAndBright(color) || isGrayscale(color))
            .forEach((extractedColor, index) => {
              const closestColor = findClosestColor(extractedColor, colors);

              // Check if the color is too similar to any already added color
              const isDuplicate = matchedColors.some(
                (existingColor) =>
                  colorDistance(extractedColor, hexToRgb(existingColor.hex)) < 40
              );

              if (closestColor && !isDuplicate) {
                matchedColors.push({ ...closestColor, number: colorCounter });
                usedColorIds.add(closestColor._id);

                ctx.fillStyle = "#000";
                ctx.font = "20px Arial";
                ctx.fillText(`${colorCounter}`, 20 + index * 30, 40 + index * 30);
                colorCounter++;
              } else {
                // Handle case where no match is found or color is too similar
                console.log("Color is too similar or no match found:", extractedColor);
              }
            });

          setHighlightedColors(matchedColors);
          setIsVisible(true);
        } catch (error) {
          console.error("Error extracting colors:", error);
        }
      };

      img.onerror = () => {
        console.error("Failed to load the image for color extraction.");
      };
    }
  }, [uploadedImage, colors]);

  // Toggle visibility of the colors list
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
    if (isVisible) {
      // Clear the highlighted colors when hiding the panel
      setHighlightedColors([]);
    }
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

      <canvas
        ref={canvasRef}
        className="image-canvas"
        style={{ display: uploadedImage ? "block" : "none" }}
      ></canvas>

      {isVisible && (
        <div className="colors-list">
          {highlightedColors.length > 0
            ? highlightedColors.map((color, index) => (
                <div
                  key={index}
                  className="color-item"
                  style={{ backgroundColor: color.hex }}
                >
                  <span className="color-number">{color.number}</span>
                  {color.name}
                </div>
              ))
            : colors.map((color, index) => (
                <div
                  key={index}
                  className="color-item"
                  style={{ backgroundColor: color.hex }}
                >
                  {color.name}
                </div>
              ))}
        </div>
      )}
    </div>
  );
};

export default ColorsList;
