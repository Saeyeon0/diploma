import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar: React.FC = () => {
  const [language, setLanguage] = useState<string>("en");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setIsDropdownOpen(false);
  };

  return (
    <nav className="navbar">
      <ul className="navbar-links">
        <li className="navbar-item">
          <Link to="/">Home</Link>
        </li>
        <li className="navbar-item">
          <Link to="/">Generate Image</Link>
        </li>
        <li className="navbar-item">
          <Link to="/tutorial">Tutorial</Link>
        </li>
        <li className="navbar-item">
          <Link to="/contact">Contact</Link>
        </li>
      </ul>
      <div className="navbar-language">
        <button onClick={toggleDropdown} className="language-toggle">
          {language === "en" ? "EN" : "RU"} ▼
        </button>
        {isDropdownOpen && (
          <ul className="dropdown-menu">
            <li onClick={() => handleLanguageChange("en")}>EN</li>
            <li onClick={() => handleLanguageChange("ru")}>RU</li>
          </ul>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
