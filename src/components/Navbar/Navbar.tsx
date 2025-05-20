import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";
import { useTranslation } from "react-i18next";

const Navbar: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const { t, i18n } = useTranslation();

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    setIsDropdownOpen(false);
  };

  return (
    <nav className="navbar">
      <ul className="navbar-links">
        <li className="navbar-item">
          <Link to="/">{t("navbar.home")}</Link>
        </li>
        <li className="navbar-item">
          <Link to="/">{t("navbar.gen")}</Link>
        </li>
        <li className="navbar-item">
          <Link to="/tutorial">{t("navbar.tut")}</Link>
        </li>
        <li className="navbar-item">
          <Link to="/contact">{t("navbar.contact")}</Link>
        </li>
      </ul>
      <div className="navbar-language">
        <button onClick={toggleDropdown} className="language-toggle">
          {i18n.language.toUpperCase()} ▼
        </button>
        {isDropdownOpen && (
          <ul className="dropdown-menu">
            <li onClick={() => handleLanguageChange("en")}>{t("En")}</li>
            <li onClick={() => handleLanguageChange("ru")}>{t("Ru")}</li>
          </ul>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
