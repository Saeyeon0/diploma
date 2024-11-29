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

const AppRoutes: React.FC = () => {
  const location = useLocation();

  const isHomepage = location.pathname === "/";

  return (
    <>
      <Navbar />

      {isHomepage && (
        <Search onSearch={(term) => alert(`Searching for: ${term}`)} />
      )}

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
