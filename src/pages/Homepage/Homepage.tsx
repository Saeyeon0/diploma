import React from "react";
import "./Homepage.css";
import homepageImage from "../../assets/homepage.webp";
import { useNavigate } from "react-router-dom";

const Homepage: React.FC = () => {
  const navigate = useNavigate();
  const handleStartProject = () => {
    navigate("/editor"); // Navigate to the editor page
  };

  return (
    <div className="homepage-container">
      <div className="homepage-text">
        <h1 className="homepage-title">ASG Therapy:</h1>
        <h2 className="homepage-subtitle">Color / Art / Heal</h2>
        <p className="homepage-description">
          Our web app enables users to visualize and generate detailed vector
          segments for various paintings, transforming images into structured,
          paint-by-numbers compositions. Designed for precision and creativity,
          it streamlines the process of segmenting, numbering, and organizing
          colors, making it an ideal tool for art therapy, custom artwork, and
          paint kit production.
        </p>
        <div className="homepage-button">
          <button className="button-start" onClick={handleStartProject}>
            Start Project
          </button>
        </div>
      </div>
      <div className="homepage-image">
        <img
          src={homepageImage}
          alt="Artistic painting"
          className="homepage-img"
        />
      </div>
      {/* <div className="explore-section">
        <p className="explore-text">Explore Our Library</p>
      </div> */}
    </div>
  );
};

export default Homepage;
