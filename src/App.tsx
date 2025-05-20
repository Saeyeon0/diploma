import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Homepage from "./pages/Homepage/Homepage";
import Tutorial from "./pages/Tutorial/Tutorial";
import Contact from "./pages/Contact/Contact";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import Search from "./components/Search/Search";
import Editor from "./pages/Editor/Editor";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import translationEN from "./locales/en/translation.json";
import translationRU from "./locales/ru/translation.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: translationEN,
      },
      ru: {
        translation: translationRU,
      },
    },
    fallbackLng: "en", // Fallback language
    detection: {
      order: [
        "querystring",
        "cookie",
        "localStorage",
        "navigator",
        "htmlTag",
        "path",
        "subdomain",
      ],
      caches: ["localStorage", "cookie"],
    },
    interpolation: {
      escapeValue: false, // Not needed for React
    },
  });

export { i18n };

const AppRoutes: React.FC = () => {
  const location = useLocation();

  // const isHomepage = location.pathname === "/";

  return (
    <>
      <Navbar />

      {/* {isHomepage && (
        <Search onSearch={(term) => alert(`Searching for: ${term}`)} />
      )} */}

      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/tutorial" element={<Tutorial />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/editor" element={<Editor />} /> 
      </Routes>

      {location.pathname !== "/editor" && <Footer />}
    </>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

export default App;
