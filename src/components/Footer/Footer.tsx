import React from "react";
import "./Footer.css";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <ul className="footer-links">
        <li className="footer-item">
          <Link to="/">{t("footer.home")}</Link>
        </li>
        <li className="footer-item">
          <Link to="/">{t("footer.gen")}</Link>
        </li>
        <li className="footer-item">
          <Link to="/tutorial">{t("footer.tut")}</Link>
        </li>
        <li className="footer-item">
          <Link to="/contact">{t("footer.contact")}</Link>
        </li>
      </ul>
      <p className="footer-credits">
        © 2025 ASG Therapy. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
