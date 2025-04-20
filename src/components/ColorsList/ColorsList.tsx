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
  onNumbersDetected?: (numbers: { x: number; y: number; number: number }[]) => void;
}

const ColorsList: React.FC<ColorsListProps> = ({ uploadedImage, onNumbersDetected }) => {
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightedColors, setHighlightedColors] = useState<Color[]>([]);
  const [sortedExtractedColors, setSortedExtractedColors] = useState<Color[]>([]);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const hexToRgb = (hex: string): [number, number, number] => {
    const bigint = parseInt(hex.slice(1), 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
  };

  const colorDistance = (rgb1: [number, number, number], rgb2: [number, number, number]) => {
    return Math.sqrt(
      (rgb1[0] - rgb2[0]) ** 2 +
      (rgb1[1] - rgb2[1]) ** 2 +
      (rgb1[2] - rgb2[2]) ** 2
    );
  };

  const isGrayscale = (rgb: [number, number, number]): boolean => {
    const [r, g, b] = rgb;
    const threshold = 20;
    return (
      Math.abs(r - g) < threshold &&
      Math.abs(g - b) < threshold &&
      Math.abs(b - r) < threshold
    );
  };

  const isSaturatedAndBright = (rgb: [number, number, number]): boolean => {
    const [r, g, b] = rgb;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max - min;
    const brightness = max;
    return saturation > 30 && brightness > 50;
  };

  const findClosestColor = (
    extractedColor: [number, number, number],
    dbColors: Color[],
    threshold: number = 50
  ) => {
    if (isGrayscale(extractedColor)) {
      const intensity = extractedColor[0];
      if (intensity < 128) return dbColors.find((color) => color.hex === "#000000")!;
      return dbColors.find((color) => color.hex === "#FFFFFF")!;
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

    return closestColor || null;
  };

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
          const matchedColors: Color[] = [];
          const usedColorIds = new Set<string>();
          let colorCounter = 1;
          const detectedNumbers: {x: number, y: number, number: number}[] = [];

          extractedColors
            .filter((color) => isSaturatedAndBright(color) || isGrayscale(color))
            .forEach((extractedColor) => {
              const closestColor = findClosestColor(extractedColor, colors);
              const isDuplicate = matchedColors.some(
                (existingColor) =>
                  existingColor.hex === closestColor?.hex ||
                  colorDistance(extractedColor, hexToRgb(existingColor.hex)) < 40
              );

              if (closestColor && !isDuplicate) {
                matchedColors.push({ ...closestColor, number: colorCounter });
                usedColorIds.add(closestColor._id);
                colorCounter++;
              }
            });

          setHighlightedColors(matchedColors);

          matchedColors.forEach((color) => {
            const colorRgb = hexToRgb(color.hex);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData.data;

            let totalX = 0;
            let totalY = 0;
            let pixelCount = 0;

            for (let y = 0; y < canvas.height; y++) {
              for (let x = 0; x < canvas.width; x++) {
                const idx = (y * canvas.width + x) * 4;
                const r = pixels[idx];
                const g = pixels[idx + 1];
                const b = pixels[idx + 2];

                if (colorDistance([r, g, b], colorRgb) < 20) {
                  totalX += x;
                  totalY += y;
                  pixelCount++;
                }
              }
            }

            if (pixelCount > 0) {
              const centerX = totalX / pixelCount;
              const centerY = totalY / pixelCount;

              detectedNumbers.push({ x: centerX, y: centerY, number: color.number || 0 });

              ctx.fillStyle = "#000000";
              ctx.font = "20px Arial";
              ctx.fillText(color.number?.toString() || "", centerX, centerY);
            }
          });

          if (onNumbersDetected) {
            onNumbersDetected(detectedNumbers);
          }

          setSortedExtractedColors((prevColors) => {
            const highestNumber = prevColors.reduce(
              (max, color) => Math.max(max, color.number || 0),
              0
            );
            let colorCounter = highestNumber + 1;

            const newColors = matchedColors
              .filter((color) => !prevColors.some((prev) => prev.hex === color.hex))
              .map((color) => ({
                ...color,
                number: colorCounter++,
              }));

            return [...prevColors, ...newColors];
          });

          setIsVisible(true);
        } catch (error) {
          console.error("Error extracting colors:", error);
        }
      };

      img.onerror = () => {
        console.error("Failed to load the image for color extraction.");
      };
    }
  }, [uploadedImage, colors, onNumbersDetected]);

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

      <canvas
        ref={canvasRef}
        className="image-canvas"
        style={{ display: uploadedImage ? "block" : "none" }}
      ></canvas>

      {isVisible && (
        <>
          <div className="colors-list">
            <h4 className="colorslist-text">Extracted Colors</h4>
            {sortedExtractedColors.length > 0 ? (
              sortedExtractedColors.map((color, index) => (
                <div
                  key={index}
                  className="color-item"
                  style={{ backgroundColor: color.hex }}
                >
                  <span className="color-number">{color.number}</span>
                  {color.name}
                </div>
              ))
            ) : (
              <p className="placeholder">No extracted colors yet.</p>
            )}
          </div>

          <div className="colors-list">
            <h4 className="colorslist-text">Current Image Colors</h4>
            {highlightedColors.length > 0 ? (
              highlightedColors.map((color, index) => (
                <div
                  key={index}
                  className="color-item"
                  style={{ backgroundColor: color.hex }}
                >
                  <span className="color-number">{color.number}</span>
                  {color.name}
                </div>
              ))
            ) : (
              <p className="placeholder">No colors extracted.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ColorsList;