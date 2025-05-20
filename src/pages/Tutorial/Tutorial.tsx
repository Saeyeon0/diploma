import React, { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import "./Tutorial.css";
import { useTranslation } from "react-i18next";

const Tutorial: React.FC = () => {
  const { t } = useTranslation();

  const steps = [
    {
      title: t("tutorial.1"),
      content: t("tutorial.sub1"),
    },
    {
      title: t("tutorial.2"),
      content: t("tutorial.sub2"),
    },
    {
      title: t("tutorial.3"),
      content: t("tutorial.sub3"),
    },
    {
      title: t("tutorial.4"),
      content: t("tutorial.sub4"),
    },
    {
      title: t("tutorial.5"),
      content: t("tutorial.sub5"),
    },
    {
      title: t("tutorial.6"),
      content: t("tutorial.sub6"),
    },
  ];

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleStep = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div style={{ backgroundColor: "#E5E3E3", padding: "2rem 0" }}>
      <div className="tutorial-container">
        <h1 className="tutorial-title">{t("tutorial.title")}</h1>
        <div className="tutorial-steps">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`tutorial-step ${activeIndex === index ? "active" : ""}`}
              onClick={() => toggleStep(index)}
            >
              <div className="step-header">
                <h2>{step.title}</h2>
                {activeIndex === index ? <FaChevronUp /> : <FaChevronDown />}
              </div>
              {activeIndex === index && (
                <div className="step-content">
                  <p>{step.content}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Tutorial;
