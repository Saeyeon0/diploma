import React from "react";
import { FaInstagram, FaLinkedin, FaEnvelope } from "react-icons/fa";
import "./Contact.css";
import { useTranslation } from "react-i18next";

const Contact: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="contact-container">
      <main className="contact-main">
        <h1>{t("contacts.text")}</h1>
        <p>
        {t("contacts.sub")}<br />
        {t("contacts.sub2")}
        </p>

        <div className="contact-links">
          <a
            href="https://www.instagram.com/asg_therapy/"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-link instagram"
          >
            <FaInstagram size={30} />
            <span>@asg_therapy</span>
          </a>

          <a
            href="https://www.linkedin.com/company/106533804/admin/dashboard/?fbclid=PAZXh0bgNhZW0CMTEAAactxtkyif9qX_Nh4ws7T0VOAzJqnbnSjBoeMFG_LzJjPLhhv81c7M1SvRI3uw_aem_1WMbq46w_Es0hB-WNjrAzw"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-link linkedin"
          >
            <FaLinkedin size={30} />
            <span>ASG Art Therapy</span>
          </a>

          <a
            href="mailto:asg.therapy.team@gmail.com"
            className="contact-link email"
          >
            <FaEnvelope size={30} />
            <span>asg.arttherapy@gmail.com</span>
          </a>
        </div>
      </main>
    </div>
  );
};

export default Contact;
