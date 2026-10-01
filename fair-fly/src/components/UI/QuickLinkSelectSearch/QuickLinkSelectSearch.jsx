import React, { useState, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { firestore } from '../../../firebase';
import useDebounce from '../../../hooks/useDebounce';
import './quick-link-select-search.css';

const DEFAULT_PORTAL_LINKS = [
  // Airlines
  { id: 'def-ceb', title: 'Cebu Pacific', url: 'https://www.cebupacificair.com', category: 'Airlines' },
  { id: 'def-pal', title: 'Philippine Airlines', url: 'https://www.philippineairlines.com', category: 'Airlines' },
  { id: 'def-airasia', title: 'AirAsia', url: 'https://www.airasia.com', category: 'Airlines' },
  { id: 'def-sia', title: 'Singapore Airlines', url: 'https://www.singaporeair.com', category: 'Airlines' },
  { id: 'def-cathay', title: 'Cathay Pacific', url: 'https://www.cathaypacific.com', category: 'Airlines' },
  // Government
  { id: 'def-dfa', title: 'DFA Passport Appointment', url: 'https://www.passport.gov.ph', category: 'Government' },
  { id: 'def-psa', title: 'PSA Serbilis', url: 'https://serbilis.psa.gov.ph', category: 'Government' },
  { id: 'def-bi', title: 'BI e-Services', url: 'https://onlineservices.immigration.gov.ph', category: 'Government' },
  { id: 'def-egov', title: 'eGov PH Portal', url: 'https://egov.ph', category: 'Government' },
  // Visa
  { id: 'def-usemb', title: 'US Embassy Manila Visa', url: 'https://ph.usembassy.gov', category: 'Visa' },
  { id: 'def-vfs', title: 'VFS Global Visa Application', url: 'https://www.vfsglobal.com', category: 'Visa' },
  { id: 'def-bls', title: 'BLS International Spain / Schengen', url: 'https://www.blsinternational.com', category: 'Visa' },
  { id: 'def-japan', title: 'Japan Visa Processing Portal', url: 'https://www.ph.emb-japan.go.jp', category: 'Visa' },
  // Hotels
  { id: 'def-booking', title: 'Booking.com', url: 'https://www.booking.com', category: 'Hotels' },
  { id: 'def-agoda', title: 'Agoda', url: 'https://www.agoda.com', category: 'Hotels' },
  { id: 'def-expedia', title: 'Expedia', url: 'https://www.expedia.com', category: 'Hotels' }
];

export default function QuickLinkSelectSearch({
  onSelectQuickLink,
  selectedTitle = '',
  selectedUrl = '',
  onClearSelection,
  placeholder = 'Search QuickLinks (e.g. DFA, Cebu Pacific, VFS, PSA)...',
  disabled = false
}) {
  const [quickLinks, setQuickLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 250);
  const containerRef = useRef(null);

  // Subscribe to real-time quickLinks collection
  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const q = query(collection(firestore, 'quickLinks'), orderBy('createdAt', 'desc'));
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const items = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data()
            }));
            setQuickLinks(items);
          } else {
            setQuickLinks(DEFAULT_PORTAL_LINKS);
          }
          setLoading(false);
        },
        (error) => {
          console.warn('Firestore quickLinks listener fallback:', error.message);
          setQuickLinks(DEFAULT_PORTAL_LINKS);
          setLoading(false);
        }
      );
    } catch (err) {
      console.warn('Error establishing quickLinks snapshot:', err);
      setQuickLinks(DEFAULT_PORTAL_LINKS);
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  // Click outside and escape key handling
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Filtered links
  const filteredLinks = useMemo(() => {
    const q = debouncedSearch.toLowerCase().trim();
    if (!q) {
      return quickLinks.slice(0, 15);
    }
    return quickLinks.filter((item) => {
      const title = (item.title || '').toLowerCase();
      const url = (item.url || '').toLowerCase();
      const category = (item.category || '').toLowerCase();
      return title.includes(q) || url.includes(q) || category.includes(q);
    });
  }, [quickLinks, debouncedSearch]);

  const handleSelect = (item) => {
    if (onSelectQuickLink) {
      onSelectQuickLink({
        title: item.title,
        url: item.url,
        category: item.category || 'Other'
      });
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  const getCategoryClass = (cat) => {
    const clean = (cat || '').toLowerCase().replace(/\s+/g, '');
    if (clean.includes('airline')) return 'airlines';
    if (clean.includes('hotel')) return 'hotels';
    if (clean.includes('gov')) return 'government';
    if (clean.includes('visa')) return 'visa';
    return '';
  };

  return (
    <div className="quicklink-search-container" ref={containerRef}>
      <div className="quicklink-search-input-wrapper">
        <i className="fa-solid fa-magnifying-glass quicklink-search-icon"></i>
        <input
          type="text"
          className="quicklink-search-input"
          placeholder={placeholder}
          value={searchTerm}
          disabled={disabled}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {searchTerm && (
          <button
            type="button"
            className="quicklink-search-clear-btn"
            title="Clear search"
            onClick={() => setSearchTerm('')}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        )}
      </div>

      {/* Selected Indicator Badge */}
      {selectedTitle && selectedUrl && (
        <div className="quicklink-selected-badge-row">
          <div className="quicklink-selected-badge-info" title={selectedUrl}>
            <i className="fa-solid fa-bolt" style={{ fontSize: '0.6875rem' }}></i>
            <span>
              Attached QuickLink: <strong>{selectedTitle}</strong> ({selectedUrl})
            </span>
          </div>
          {onClearSelection && (
            <button
              type="button"
              className="quicklink-selected-badge-clear"
              title="Detach link"
              onClick={onClearSelection}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>
      )}

      {/* Dropdown Results */}
      {isOpen && (
        <div className="quicklink-dropdown-menu">
          <div className="quicklink-dropdown-header">
            {loading ? 'Loading QuickLinks...' : debouncedSearch ? `Search Results (${filteredLinks.length})` : 'Popular / Saved QuickLinks'}
          </div>

          {filteredLinks.length === 0 ? (
            <div className="quicklink-empty-dropdown">
              <i className="fa-regular fa-folder-open"></i>
              <span>No quick links matching &quot;{debouncedSearch}&quot;</span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-light)' }}>
                You can still type a custom URL and title directly below.
              </span>
            </div>
          ) : (
            filteredLinks.map((item) => (
              <button
                type="button"
                key={item.id || item.url}
                className="quicklink-dropdown-item"
                onClick={() => handleSelect(item)}
              >
                <div className="quicklink-item-main">
                  <div className="quicklink-item-title-row">
                    <span className="quicklink-item-title">{item.title}</span>
                    <span className={`quicklink-category-pill ${getCategoryClass(item.category)}`}>
                      {item.category || 'Portal'}
                    </span>
                  </div>
                  <span className="quicklink-item-url">{item.url}</span>
                </div>
                <i
                  className="fa-solid fa-arrow-turn-down"
                  style={{
                    fontSize: '0.6875rem',
                    color: 'var(--purple)',
                    transform: 'rotate(-90deg)',
                    opacity: 0.6
                  }}
                  title="Select QuickLink"
                ></i>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

QuickLinkSelectSearch.propTypes = {
  onSelectQuickLink: PropTypes.func.isRequired,
  selectedTitle: PropTypes.string,
  selectedUrl: PropTypes.string,
  onClearSelection: PropTypes.func,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool
};
