import React, { useRef } from 'react';
import './search-bar.css';

/**
 * A search bar component.
 * @param {Object} props
 * @param {string} props.searchQuery - The current search query string.
 * @param {Function} props.setSearchQuery - A function to update the search query state.
 * @param {boolean} [props.debounceSearch=false] - A boolean indicating whether to debounce the search.
 * @param {string} [props.placeholder="Search..."] - Placeholder text for input.
 * @param {Function} [props.onClear] - Optional callback when clear button is clicked.
 * @param {string} [props.className=""] - Optional container class.
 * @returns {JSX.Element} The search bar component.
 */
export default function SearchBar({
  searchQuery = '',
  setSearchQuery,
  debounceSearch = false,
  placeholder = 'Search...',
  onClear,
  className = '',
}) {
  const timeoutRef = useRef(null);

  function handleSearchChange(e) {
    const value = e.target.value;
    if (debounceSearch) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setSearchQuery(value);
      }, 300);
    } else {
      setSearchQuery(value);
    }
  }

  function handleClear() {
    setSearchQuery('');
    if (onClear) onClear();
  }

  return (
    <div className={`search-bar-wrapper search-box ${className}`.trim()}>
      <i className="fa-solid fa-magnifying-glass search-icon"></i>
      <input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={handleSearchChange}
      />
      {searchQuery && (
        <button
          type="button"
          className="clear-search-btn"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      )}
    </div>
  );
}