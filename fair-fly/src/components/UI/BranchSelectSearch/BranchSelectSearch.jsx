import React, { useState, useEffect, useMemo, useRef } from 'react';
import './branch-select-search.css';

/**
 * Reusable debounced searchable branch selection component.
 * Allows instant search filtering with a 300ms debounce while keeping UI responsive.
 *
 * @param {Object} props
 * @param {Array} props.branches - Array of branch objects { uid, branchName, name, address, location, email, contactNumber }
 * @param {string} props.selectedBranchUid - Currently selected branch UID
 * @param {Function} props.onSelectBranch - Callback when a branch is selected: (branchUid, branchObj) => void
 * @param {boolean} [props.isLoading=false] - Loading indicator for branches fetch
 * @param {string} [props.label="Preferred Processing Branch"] - Label text
 * @param {boolean} [props.required=false] - Whether the field is required
 * @param {string} [props.placeholder="Search branch by name, city or address..."] - Search placeholder
 * @param {string} [props.className=""] - Additional container class
 */
export default function BranchSelectSearch({
  branches = [],
  selectedBranchUid = '',
  onSelectBranch,
  isLoading = false,
  label = 'Preferred Processing Branch',
  required = false,
  placeholder = 'Search branch by name, city or location...',
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Debounce the search query by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchTerm);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Find currently selected branch object
  const selectedBranch = useMemo(() => {
    return branches.find((b) => (b.uid || b.id) === selectedBranchUid) || null;
  }, [branches, selectedBranchUid]);

  // Debounced filtered list
  const filteredBranches = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return branches;

    return branches.filter((b) => {
      const name = (b.branchName || b.name || '').toLowerCase();
      const addr = (b.address || b.location || '').toLowerCase();
      const mail = (b.email || '').toLowerCase();
      return name.includes(q) || addr.includes(q) || mail.includes(q);
    });
  }, [branches, debouncedQuery]);

  const handleSelect = (branch) => {
    const uid = branch.uid || branch.id;
    if (onSelectBranch) {
      onSelectBranch(uid, branch);
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClearSearch = (e) => {
    e.stopPropagation();
    setSearchTerm('');
    setDebouncedQuery('');
    if (inputRef.current) inputRef.current.focus();
  };

  const toggleDropdown = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      return next;
    });
  };

  const selectedName = selectedBranch
    ? selectedBranch.branchName || selectedBranch.name || 'Selected Branch'
    : '';
  const selectedAddress = selectedBranch
    ? selectedBranch.address || selectedBranch.location || ''
    : '';

  return (
    <div
      ref={containerRef}
      className={`branch-select-search-container ${isOpen ? 'is-open' : ''} ${className}`.trim()}
    >
      {label && (
        <label className="branch-search-label">
          {label} {required && <span className="req-star">*</span>}
        </label>
      )}

      {/* Main Trigger Display */}
      <div
        className={`branch-search-trigger ${selectedBranch ? 'has-selection' : ''}`}
        onClick={toggleDropdown}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleDropdown();
          }
        }}
      >
        <div className="branch-trigger-icon">
          <i className="fa-solid fa-building-circle-check"></i>
        </div>

        <div className="branch-trigger-text">
          {selectedBranch ? (
            <>
              <div className="branch-trigger-title-row">
                <span className="branch-trigger-name">{selectedName}</span>
                <span className="branch-trigger-badge">
                  <i className="fa-solid fa-check"></i> Selected
                </span>
              </div>
              {selectedAddress && (
                <div className="branch-trigger-address">
                  <i className="fa-solid fa-location-dot"></i> {selectedAddress}
                </div>
              )}
            </>
          ) : (
            <span className="branch-trigger-placeholder">
              {isLoading ? 'Loading available branches...' : 'Select your preferred branch...'}
            </span>
          )}
        </div>

        <div className="branch-trigger-actions">
          {selectedBranch && (
            <span className="branch-change-btn">Change</span>
          )}
          <i className={`fa-solid fa-chevron-${isOpen ? 'up' : 'down'} branch-trigger-chevron`}></i>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="branch-search-dropdown">
          {/* Debounced Search Input Header */}
          <div className="branch-search-input-wrap">
            <i className="fa-solid fa-magnifying-glass branch-search-input-icon"></i>
            <input
              ref={inputRef}
              type="text"
              className="branch-search-input"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
            {searchTerm && (
              <button
                type="button"
                className="branch-search-clear-btn"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>

          {/* Results Summary Bar */}
          <div className="branch-search-meta-bar">
            <span>
              {debouncedQuery
                ? `Showing ${filteredBranches.length} of ${branches.length} branches for "${debouncedQuery}"`
                : `${branches.length} branches nationwide available`}
            </span>
          </div>

          {/* Options List */}
          <div className="branch-options-list">
            {isLoading ? (
              <div className="branch-search-empty">
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Loading FairFly branches...</span>
              </div>
            ) : filteredBranches.length === 0 ? (
              <div className="branch-search-empty">
                <i className="fa-solid fa-map-location-dot"></i>
                <span className="empty-title">No matching branches found</span>
                <span className="empty-desc">
                  Try checking your spelling or searching by province or city.
                </span>
              </div>
            ) : (
              filteredBranches.map((branch) => {
                const bUid = branch.uid || branch.id;
                const isCurrent = bUid === selectedBranchUid;
                const bName = branch.branchName || branch.name || 'Branch';
                const bAddr = branch.address || branch.location || '';

                return (
                  <div
                    key={bUid}
                    className={`branch-option-row ${isCurrent ? 'selected' : ''}`}
                    onClick={() => handleSelect(branch)}
                    role="option"
                    aria-selected={isCurrent}
                  >
                    <div className="branch-option-icon">
                      <i className="fa-solid fa-store"></i>
                    </div>

                    <div className="branch-option-details">
                      <div className="branch-option-name">{bName}</div>
                      {bAddr && (
                        <div className="branch-option-location">
                          <i className="fa-solid fa-location-dot"></i> {bAddr}
                        </div>
                      )}
                    </div>

                    <div className="branch-option-end">
                      {isCurrent ? (
                        <span className="branch-option-check">
                          <i className="fa-solid fa-check"></i>
                        </span>
                      ) : (
                        <span className="branch-option-select-action">Select</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
