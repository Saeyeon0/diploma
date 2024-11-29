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
        <h1 className="homepage-title">Vector Segment Layouts of Paintings</h1>
        <p className="homepage-description">
          This app will help visualize and create detailed vector segments for
          various paintings.
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
