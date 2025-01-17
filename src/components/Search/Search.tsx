import React, { useState } from "react";
import "./Search.css";

interface SearchProps {
  onSearch: (term: string) => void;
}

const Search: React.FC<SearchProps> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSearch(searchTerm);
    setSearchTerm(""); // Clear the input after search
  };

  return (
    <form className="search-form" onSubmit={handleSearchSubmit}>
      <div className="search-input-container">
        <input
          type="text"
          placeholder="Search for a painting..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-input"
        />
        <span className="search-icon">&#128269;</span>
      </div>
    </form>
  );
};

export default Search;
