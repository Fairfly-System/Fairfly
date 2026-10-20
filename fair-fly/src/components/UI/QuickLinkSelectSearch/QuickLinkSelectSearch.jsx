import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  where
} from 'firebase/firestore';
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

const PAGE_BATCH_SIZE = 5;

export default function QuickLinkSelectSearch({
  onSelectQuickLink,
  selectedTitle = '',
  selectedUrl = '',
  onClearSelection,
  placeholder = 'Search QuickLinks (e.g. DFA, Cebu Pacific, VFS, PSA)...',
  disabled = false
}) {
  const [quickLinks, setQuickLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const containerRef = useRef(null);
  const dropdownMenuRef = useRef(null);
  const lastDocRef = useRef(null);
  const activeReqIdRef = useRef(0);

  // Fetch initial batch of 5 items based on debounced search
  const fetchFirstPage = useCallback(async (searchQuery = '') => {
    const reqId = ++activeReqIdRef.current;
    setLoading(true);
    setHasMore(true);
    lastDocRef.current = null;

    try {
      const qText = searchQuery.trim().toLowerCase();
      const colRef = collection(firestore, 'quickLinks');

      let q;
      if (qText) {
        // Query bounded batch
        q = query(
          colRef,
          orderBy('createdAt', 'desc'),
          limit(25) // Bounded search pool to client-filter multi-field safely
        );
      } else {
        // Direct query-level pagination limit of 5
        q = query(
          colRef,
          orderBy('createdAt', 'desc'),
          limit(PAGE_BATCH_SIZE)
        );
      }

      const snap = await getDocs(q);
      if (reqId !== activeReqIdRef.current) return; // Stale request guard

      if (!snap.empty) {
        const allItems = snap.docs.map((d) => ({ id: d.id, _doc: d, ...d.data() }));

        if (qText) {
          // Filter matching title, url, or category
          const filtered = allItems.filter((item) => {
            const title = (item.title || '').toLowerCase();
            const url = (item.url || '').toLowerCase();
            const cat = (item.category || '').toLowerCase();
            return title.includes(qText) || url.includes(qText) || cat.includes(qText);
          });

          const initialSlice = filtered.slice(0, PAGE_BATCH_SIZE);
          setQuickLinks(initialSlice);
          setHasMore(filtered.length > PAGE_BATCH_SIZE);
          lastDocRef.current = { filteredPool: filtered, offset: PAGE_BATCH_SIZE };
        } else {
          setQuickLinks(allItems);
          lastDocRef.current = snap.docs[snap.docs.length - 1];
          setHasMore(snap.docs.length >= PAGE_BATCH_SIZE);
        }
      } else {
        // Fallback default links if Firestore collection is empty
        const fallback = DEFAULT_PORTAL_LINKS.filter((item) => {
          if (!qText) return true;
          const title = (item.title || '').toLowerCase();
          const url = (item.url || '').toLowerCase();
          const cat = (item.category || '').toLowerCase();
          return title.includes(qText) || url.includes(qText) || cat.includes(qText);
        });

        const initialSlice = fallback.slice(0, PAGE_BATCH_SIZE);
        setQuickLinks(initialSlice);
        setHasMore(fallback.length > PAGE_BATCH_SIZE);
        lastDocRef.current = { filteredPool: fallback, offset: PAGE_BATCH_SIZE };
      }
    } catch (err) {
      console.warn('[QuickLinkSelectSearch] Error fetching quickLinks:', err.message);
      const qText = searchQuery.trim().toLowerCase();
      const fallback = DEFAULT_PORTAL_LINKS.filter((item) => {
        if (!qText) return true;
        const title = (item.title || '').toLowerCase();
        const url = (item.url || '').toLowerCase();
        const cat = (item.category || '').toLowerCase();
        return title.includes(qText) || url.includes(qText) || cat.includes(qText);
      });
      setQuickLinks(fallback.slice(0, PAGE_BATCH_SIZE));
      setHasMore(fallback.length > PAGE_BATCH_SIZE);
      lastDocRef.current = { filteredPool: fallback, offset: PAGE_BATCH_SIZE };
    } finally {
      if (reqId === activeReqIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Fetch next batch of 5 items on scroll down
  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;

    // Check if handling client-filtered pool
    if (lastDocRef.current && lastDocRef.current.filteredPool) {
      const { filteredPool, offset } = lastDocRef.current;
      const nextSlice = filteredPool.slice(offset, offset + PAGE_BATCH_SIZE);
      if (nextSlice.length > 0) {
        setQuickLinks((prev) => [...prev, ...nextSlice]);
        const newOffset = offset + nextSlice.length;
        lastDocRef.current.offset = newOffset;
        setHasMore(newOffset < filteredPool.length);
      } else {
        setHasMore(false);
      }
      return;
    }

    if (!lastDocRef.current) {
      setHasMore(false);
      return;
    }

    setLoadingMore(true);
    try {
      const colRef = collection(firestore, 'quickLinks');
      const nextQuery = query(
        colRef,
        orderBy('createdAt', 'desc'),
        startAfter(lastDocRef.current),
        limit(PAGE_BATCH_SIZE)
      );

      const snap = await getDocs(nextQuery);
      if (!snap.empty) {
        const nextItems = snap.docs.map((d) => ({ id: d.id, _doc: d, ...d.data() }));
        setQuickLinks((prev) => [...prev, ...nextItems]);
        lastDocRef.current = snap.docs[snap.docs.length - 1];
        setHasMore(snap.docs.length >= PAGE_BATCH_SIZE);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.warn('[QuickLinkSelectSearch] Error loading more quickLinks:', err.message);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, hasMore]);

  // Handle dropdown scroll event for infinite pagination
  const handleDropdownScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // When within 30px of bottom, trigger loadMore
    if (scrollHeight - scrollTop <= clientHeight + 30) {
      loadMore();
    }
  };

  // Re-fetch on dropdown open or debounced search change
  useEffect(() => {
    if (isOpen) {
      fetchFirstPage(debouncedSearch);
    }
  }, [isOpen, debouncedSearch, fetchFirstPage]);

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
        <div
          className="quicklink-dropdown-menu"
          ref={dropdownMenuRef}
          onScroll={handleDropdownScroll}
        >
          <div className="quicklink-dropdown-header">
            {loading ? 'Loading QuickLinks...' : debouncedSearch ? `Search Results (${quickLinks.length}${hasMore ? '+' : ''})` : 'Popular / Saved QuickLinks'}
          </div>

          {loading ? (
            <div className="quicklink-dropdown-loading">
              <i className="fa-solid fa-spinner fa-spin"></i>
              <span>Loading links...</span>
            </div>
          ) : quickLinks.length === 0 ? (
            <div className="quicklink-empty-dropdown">
              <i className="fa-regular fa-folder-open"></i>
              <span>No quick links matching &quot;{debouncedSearch}&quot;</span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-light)' }}>
                You can still type a custom URL and title directly.
              </span>
            </div>
          ) : (
            <>
              {quickLinks.map((item) => (
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
              ))}

              {loadingMore && (
                <div className="quicklink-dropdown-loading">
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Loading 5 more...</span>
                </div>
              )}

              {!hasMore && quickLinks.length >= 5 && (
                <div className="quicklink-dropdown-end">
                  <span>End of results</span>
                </div>
              )}
            </>
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
