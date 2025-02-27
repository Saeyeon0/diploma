import React from "react";
import "./Footer.css";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <ul className="footer-links">
        <li className="footer-item">
          <Link to="/">Home</Link>
        </li>
        <li className="footer-item">
          <Link to="/tutorial">Tutorial</Link>
        </li>
        <li className="footer-item">
          <Link to="/contact">Contact</Link>
        </li>
      </ul>
      <p className="footer-credits">
        © 2025 ASG Therapy. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
