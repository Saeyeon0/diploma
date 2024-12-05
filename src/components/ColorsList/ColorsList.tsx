import React, { useEffect, useState } from "react";
import "./ColorsList.css";

interface Color {
  name: string;
  hex: string;
  order: number;
}

const ColorsList: React.FC = () => {
  const [colors, setColors] = useState<Color[]>([]); // State to hold the fetched colors
  const [loading, setLoading] = useState<boolean>(true); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state
  const [displayCount, setDisplayCount] = useState<number>(24); // State for the number of colors to display

  // Define the sets of colors for 6 and 12
  const sixColors = [
    "Red", "Blue", "Green", "Yellow", "White", "Black"
  ];

  const twelveColors = [
    "Red", "Orange", "Yellow", "Green", "Blue", "Purple", "Pink", "Sand Yellow", "White", "Gray", "Dark Brown", "Black"
  ];

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
        const sortedColors = data.sort((a: { order: number }, b: { order: number }) => {
          const orderA = a.order || 0;  // Default to 0 if 'order' is missing
          const orderB = b.order || 0;  // Default to 0 if 'order' is missing
          return orderA - orderB;
        });
        setColors(sortedColors); // Set the fetched data to state
        setLoading(false); // Set loading to false
      })
      .catch((error) => {
        console.error("Error fetching colors:", error);
        setError("Failed to load colors. Please try again.");
        setLoading(false); // Stop loading
      });
  }, []); // Empty array ensures this effect runs only once after the initial render

  // Filter colors based on the selected count
  const filteredColors = colors.filter(color => {
    if (displayCount === 6) {
      return sixColors.includes(color.name); // Filter for 6 specific colors
    } else if (displayCount === 12) {
      return twelveColors.includes(color.name); // Filter for 12 specific colors
    }
    return true; // Display all colors for 24
  });

  const handleDropdownChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setDisplayCount(Number(event.target.value)); // Update the display count based on dropdown selection
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
      <select onChange={handleDropdownChange} value={displayCount}>
        <option value={6}>6</option>
        <option value={12}>12</option>
        <option value={24}>24</option>
      </select>

      <div className="colors-list">
        {filteredColors.length > 0 ? (
          filteredColors.map((color, index) => (
            <div
              key={index}
              className="color-item"
              style={{ backgroundColor: color.hex }}
              title={color.name} // Tooltip to show color name
            >
              {color.name}
            </div>
          ))
        ) : (
          <p>No colors available</p>
        )}
      </div>
    </div>
  );
};

export default ColorsList;
