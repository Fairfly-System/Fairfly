import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import useDebounce from '../../../hooks/useDebounce';
import './client-services-marketplace.css';

const PAGE_SIZE = 6;

const CATEGORY_ICON_MAP = {
  'visa & embassy assistance': 'fa-solid fa-passport',
  'visa assistance': 'fa-solid fa-passport',
  'passport processing': 'fa-solid fa-id-card',
  'psa & civil documents': 'fa-regular fa-file-lines',
  'psa documents': 'fa-regular fa-file-lines',
  'airline ticketing': 'fa-solid fa-plane-departure',
  'airline tickets': 'fa-solid fa-plane-departure',
  'tour packages': 'fa-solid fa-map-location-dot',
  'travel insurance & hotels': 'fa-solid fa-hotel',
  'authentication & legalization': 'fa-solid fa-certificate',
  'other': 'fa-solid fa-boxes-stacked',
  'general services': 'fa-solid fa-concierge-bell'
};

const UNIT_LABELS = {
  days: 'Day/s',
  weeks: 'Week/s',
  months: 'Month/s',
};

function formatProcessingTime(processingTime) {
  if (!processingTime || typeof processingTime !== 'object') {
    return processingTime || '';
  }
  const { min, max, unit } = processingTime;
  const label = UNIT_LABELS[unit] || unit;
  if (!min && !max) return '';
  if (min === max || !max) return `${min} ${label}`;
  return `${min}-${max} ${label}`;
}

function parseNumericPrice(priceStr) {
  if (typeof priceStr === 'number') return priceStr;
  if (!priceStr) return 0;
  const cleaned = String(priceStr).replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}

function formatPriceDisplay(price) {
  if (!price) return '₱0.00';
  if (typeof price === 'string' && (price.startsWith('₱') || price.startsWith('PHP'))) {
    return price;
  }
  const num = parseNumericPrice(price);
  return `₱${num.toLocaleString('en-US')}`;
}

function getTurnaroundDays(processingTime) {
  if (!processingTime) return 999;
  if (typeof processingTime === 'string') {
    const num = parseInt(processingTime.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 999 : num;
  }
  const min = parseInt(processingTime.min, 10) || 0;
  const unit = processingTime.unit || 'days';
  if (unit === 'weeks') return min * 7;
  if (unit === 'months') return min * 30;
  return min;
}

export default function ClientServicesMarketplace({
  services = [],
  loading = false,
  onRequestService
}) {
  const navigate = useNavigate();

  // Search & Sorting state
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Load More / Progressive Pagination state
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loadMoreObserverRef = useRef(null);

  // Aside Filter state
  const [selectedCategories, setSelectedCategories] = useState([]); // Array of checked category names
  const [selectedTags, setSelectedTags] = useState([]); // Array of checked tag names
  const [priceTier, setPriceTier] = useState('all'); // 'all' | 'under1000' | '1000-3000' | '3000-5000' | 'above5000' | 'custom'
  const [customMinPrice, setCustomMinPrice] = useState('');
  const [customMaxPrice, setCustomMaxPrice] = useState('');
  const [speedFilters, setSpeedFilters] = useState([]); // ['express', 'standard', 'extended']
  const [featuredOnly, setFeaturedOnly] = useState(false);

  // Expander toggles for aside sections if many
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);

  // Reset pagination whenever search query or filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [
    debouncedSearch,
    selectedCategories,
    selectedTags,
    priceTier,
    customMinPrice,
    customMaxPrice,
    speedFilters,
    featuredOnly,
    sortBy
  ]);

  // Extract unique categories & counts
  const categoriesWithCounts = useMemo(() => {
    const counts = {};
    services.forEach((s) => {
      const cat = s.category || 'General Services';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    return Object.keys(counts).map((cat) => ({
      name: cat,
      count: counts[cat],
      icon: CATEGORY_ICON_MAP[cat.toLowerCase()] || 'fa-solid fa-tag'
    })).sort((a, b) => b.count - a.count);
  }, [services]);

  // Extract unique tags & counts
  const tagsWithCounts = useMemo(() => {
    const counts = {};
    services.forEach((s) => {
      if (Array.isArray(s.tags)) {
        s.tags.forEach((t) => {
          if (t && String(t).trim()) {
            const clean = String(t).trim();
            counts[clean] = (counts[clean] || 0) + 1;
          }
        });
      }
    });

    return Object.keys(counts).map((t) => ({
      name: t,
      count: counts[t]
    })).sort((a, b) => b.count - a.count);
  }, [services]);

  // Handle Category checkbox toggle
  const handleToggleCategory = (catName) => {
    setSelectedCategories((prev) =>
      prev.includes(catName) ? prev.filter((c) => c !== catName) : [...prev, catName]
    );
  };

  // Handle Tag checkbox toggle
  const handleToggleTag = (tagName) => {
    setSelectedTags((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
    );
  };

  // Handle Speed checkbox toggle
  const handleToggleSpeed = (speedId) => {
    setSpeedFilters((prev) =>
      prev.includes(speedId) ? prev.filter((s) => s !== speedId) : [...prev, speedId]
    );
  };

  // Reset all filters
  const handleResetAllFilters = () => {
    setSelectedCategories([]);
    setSelectedTags([]);
    setPriceTier('all');
    setCustomMinPrice('');
    setCustomMaxPrice('');
    setSpeedFilters([]);
    setFeaturedOnly(false);
    setSearchTerm('');
    setSortBy('featured');
  };

  // Check if any filter is active
  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedTags.length > 0 ||
    priceTier !== 'all' ||
    customMinPrice !== '' ||
    customMaxPrice !== '' ||
    speedFilters.length > 0 ||
    featuredOnly ||
    searchTerm.trim().length > 0;

  // Filter & Sort Logic
  const filteredAndSortedServices = useMemo(() => {
    let result = [...services];

    // 1. Search Query Filter (Debounced)
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      result = result.filter((s) => {
        const matchName = (s.name || '').toLowerCase().includes(q);
        const matchCat = (s.category || '').toLowerCase().includes(q);
        const matchDesc = (s.description || '').toLowerCase().includes(q);
        const matchTags = Array.isArray(s.tags) && s.tags.some((t) => String(t).toLowerCase().includes(q));
        return matchName || matchCat || matchDesc || matchTags;
      });
    }

    // 2. Categories Checkbox Filter
    if (selectedCategories.length > 0) {
      result = result.filter((s) => {
        const cat = s.category || 'General Services';
        return selectedCategories.some((c) => c.toLowerCase() === cat.toLowerCase());
      });
    }

    // 3. Tags Checkbox Filter
    if (selectedTags.length > 0) {
      result = result.filter((s) => {
        if (!Array.isArray(s.tags)) return false;
        return selectedTags.some((selectedT) =>
          s.tags.some((itemTag) => String(itemTag).toLowerCase() === selectedT.toLowerCase())
        );
      });
    }

    // 4. Price Tier / Custom Range Filter
    if (priceTier === 'under1000') {
      result = result.filter((s) => parseNumericPrice(s.price) < 1000);
    } else if (priceTier === '1000-3000') {
      result = result.filter((s) => {
        const p = parseNumericPrice(s.price);
        return p >= 1000 && p <= 3000;
      });
    } else if (priceTier === '3000-5000') {
      result = result.filter((s) => {
        const p = parseNumericPrice(s.price);
        return p >= 3000 && p <= 5000;
      });
    } else if (priceTier === 'above5000') {
      result = result.filter((s) => parseNumericPrice(s.price) > 5000);
    } else if (priceTier === 'custom') {
      const min = parseFloat(customMinPrice);
      const max = parseFloat(customMaxPrice);
      if (!isNaN(min)) {
        result = result.filter((s) => parseNumericPrice(s.price) >= min);
      }
      if (!isNaN(max)) {
        result = result.filter((s) => parseNumericPrice(s.price) <= max);
      }
    }

    // 5. Processing Speed Filter
    if (speedFilters.length > 0) {
      result = result.filter((s) => {
        const days = getTurnaroundDays(s.processingTime);
        return speedFilters.some((speed) => {
          if (speed === 'express') return days <= 3;
          if (speed === 'standard') return days >= 4 && days <= 7;
          if (speed === 'extended') return days >= 8;
          return true;
        });
      });
    }

    // 6. Featured Only Filter
    if (featuredOnly) {
      result = result.filter((s) => Boolean(s.featured));
    }

    // 7. Sorting
    result.sort((a, b) => {
      if (sortBy === 'featured') {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === 'price-low') {
        return parseNumericPrice(a.price) - parseNumericPrice(b.price);
      }
      if (sortBy === 'price-high') {
        return parseNumericPrice(b.price) - parseNumericPrice(a.price);
      }
      if (sortBy === 'fastest') {
        return getTurnaroundDays(a.processingTime) - getTurnaroundDays(b.processingTime);
      }
      if (sortBy === 'name-asc') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      return 0;
    });

    return result;
  }, [
    services,
    debouncedSearch,
    selectedCategories,
    selectedTags,
    priceTier,
    customMinPrice,
    customMaxPrice,
    speedFilters,
    featuredOnly,
    sortBy
  ]);

  // Sliced batch for load-more pagination
  const displayedServices = useMemo(() => {
    return filteredAndSortedServices.slice(0, visibleCount);
  }, [filteredAndSortedServices, visibleCount]);

  const hasMore = visibleCount < filteredAndSortedServices.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredAndSortedServices.length));
  };

  // Facebook-style Infinite Scroll trigger on scroll down
  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredAndSortedServices.length));
        }
      },
      { rootMargin: '250px' }
    );

    const currentSentinel = loadMoreObserverRef.current;
    if (currentSentinel) observer.observe(currentSentinel);

    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel);
    };
  }, [hasMore, filteredAndSortedServices.length]);

  const getCategoryFallbackIcon = (category) => {
    const key = (category || '').toLowerCase();
    return CATEGORY_ICON_MAP[key] || 'fa-solid fa-plane';
  };

  // Determine categories to show (top 5 or all)
  const displayedCategories = showAllCategories
    ? categoriesWithCounts
    : categoriesWithCounts.slice(0, 5);

  // Determine tags to show (top 6 or all)
  const displayedTags = showAllTags
    ? tagsWithCounts
    : tagsWithCounts.slice(0, 6);

  return (
    <section className="shopping-ui-wrapper">
      {/* Header Row */}
      <div className="shopping-header">
        <div>
          <h2 className="shopping-header-title">
            <i className="fa-solid fa-store" style={{ color: 'var(--purple)' }}></i>
            Travel & Document Services Store
          </h2>
          <p className="shopping-header-subtitle">
            Browse our verified catalog, apply filters on the left, and request processing directly to your branch.
          </p>
        </div>

        <span className="shopping-count-pill">
          <i className="fa-solid fa-box-open"></i>
          {filteredAndSortedServices.length} {filteredAndSortedServices.length === 1 ? 'Service Available' : 'Services Available'}
        </span>
      </div>

      {/* 2-Column Shopping Layout (Aside Filters + Main Content) */}
      <div className="shopping-layout">
        {/* Mobile Backdrop for Drawer */}
        {isMobileDrawerOpen && (
          <div
            className="shopping-aside-backdrop"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
        )}

        {/* ── Left Sidebar Aside Filters ─────────────────────────────── */}
        <aside className={`shopping-aside ${isMobileDrawerOpen ? 'drawer-open' : ''}`}>
          {/* Aside Header */}
          <div className="aside-header">
            <h3 className="aside-title">
              <i className="fa-solid fa-sliders" style={{ color: 'var(--purple)' }}></i>
              Filter Services
            </h3>
            {hasActiveFilters && (
              <button
                type="button"
                className="aside-reset-btn"
                onClick={handleResetAllFilters}
              >
                Reset All
              </button>
            )}
          </div>

          {/* 1. Category Filter Section */}
          <div className="filter-group">
            <h4 className="filter-group-title">
              <span>Category</span>
              {selectedCategories.length > 0 && (
                <span style={{ color: 'var(--purple)', fontSize: '0.75rem' }}>
                  ({selectedCategories.length})
                </span>
              )}
            </h4>

            {/* Quick dropdown selector if many categories (> 5) */}
            {categoriesWithCounts.length > 5 && (
              <select
                className="filter-select-dropdown"
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleToggleCategory(e.target.value);
                  }
                }}
              >
                <option value="">+ Select Category Dropdown...</option>
                {categoriesWithCounts.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name} ({cat.count})
                  </option>
                ))}
              </select>
            )}

            {/* Checkbox Options List */}
            <div className="filter-options-list">
              {displayedCategories.map((cat) => {
                const isChecked = selectedCategories.includes(cat.name);
                return (
                  <label key={cat.name} className="filter-checkbox-label">
                    <input
                      type="checkbox"
                      className="filter-checkbox-input"
                      checked={isChecked}
                      onChange={() => handleToggleCategory(cat.name)}
                    />
                    <span className="filter-option-name" title={cat.name}>
                      <i className={`${cat.icon}`} style={{ marginRight: '0.375rem', color: 'var(--purple)', fontSize: '0.75rem' }}></i>
                      {cat.name}
                    </span>
                    <span className="filter-count-badge">{cat.count}</span>
                  </label>
                );
              })}
            </div>

            {/* Toggle show more categories */}
            {categoriesWithCounts.length > 5 && (
              <button
                type="button"
                className="filter-toggle-more-btn"
                onClick={() => setShowAllCategories(!showAllCategories)}
              >
                <i className={`fa-solid ${showAllCategories ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                {showAllCategories ? 'Show Less' : `Show All (${categoriesWithCounts.length})`}
              </button>
            )}
          </div>

          {/* 2. Price Range Filter Section */}
          <div className="filter-group">
            <h4 className="filter-group-title">
              <span>Price Range</span>
            </h4>

            <div className="filter-options-list">
              {[
                { id: 'all', label: 'All Prices' },
                { id: 'under1000', label: 'Under ₱1,000' },
                { id: '1000-3000', label: '₱1,000 - ₱3,000' },
                { id: '3000-5000', label: '₱3,000 - ₱5,000' },
                { id: 'above5000', label: 'Above ₱5,000' },
              ].map((tier) => (
                <label key={tier.id} className="filter-checkbox-label">
                  <input
                    type="radio"
                    name="priceTier"
                    className="filter-checkbox-input"
                    checked={priceTier === tier.id && !customMinPrice && !customMaxPrice}
                    onChange={() => {
                      setPriceTier(tier.id);
                      setCustomMinPrice('');
                      setCustomMaxPrice('');
                    }}
                  />
                  <span className="filter-option-name">{tier.label}</span>
                </label>
              ))}
            </div>

            {/* Custom Min / Max Price Inputs */}
            <div className="price-inputs-row">
              <input
                type="number"
                placeholder="₱ Min"
                className="price-mini-input"
                value={customMinPrice}
                onChange={(e) => {
                  setCustomMinPrice(e.target.value);
                  setPriceTier('custom');
                }}
              />
              <span className="price-separator">-</span>
              <input
                type="number"
                placeholder="₱ Max"
                className="price-mini-input"
                value={customMaxPrice}
                onChange={(e) => {
                  setCustomMaxPrice(e.target.value);
                  setPriceTier('custom');
                }}
              />
            </div>
          </div>

          {/* 3. Tags & Keywords Filter Section */}
          {tagsWithCounts.length > 0 && (
            <div className="filter-group">
              <h4 className="filter-group-title">
                <span>Tags & Features</span>
                {selectedTags.length > 0 && (
                  <span style={{ color: 'var(--purple)', fontSize: '0.75rem' }}>
                    ({selectedTags.length})
                  </span>
                )}
              </h4>

              {/* Tag Dropdown selector if many tags (> 6) */}
              {tagsWithCounts.length > 6 && (
                <select
                  className="filter-select-dropdown"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleToggleTag(e.target.value);
                    }
                  }}
                >
                  <option value="">+ Select Tag Dropdown...</option>
                  {tagsWithCounts.map((t) => (
                    <option key={t.name} value={t.name}>
                      #{t.name} ({t.count})
                    </option>
                  ))}
                </select>
              )}

              {/* Tag Checkbox List */}
              <div className="filter-options-list">
                {displayedTags.map((tag) => {
                  const isChecked = selectedTags.includes(tag.name);
                  return (
                    <label key={tag.name} className="filter-checkbox-label">
                      <input
                        type="checkbox"
                        className="filter-checkbox-input"
                        checked={isChecked}
                        onChange={() => handleToggleTag(tag.name)}
                      />
                      <span className="filter-option-name">#{tag.name}</span>
                      <span className="filter-count-badge">{tag.count}</span>
                    </label>
                  );
                })}
              </div>

              {tagsWithCounts.length > 6 && (
                <button
                  type="button"
                  className="filter-toggle-more-btn"
                  onClick={() => setShowAllTags(!showAllTags)}
                >
                  <i className={`fa-solid ${showAllTags ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                  {showAllTags ? 'Show Less' : `Show All Tags (${tagsWithCounts.length})`}
                </button>
              )}
            </div>
          )}

          {/* 4. Processing Speed Filter Section */}
          <div className="filter-group">
            <h4 className="filter-group-title">
              <span>Processing Turnaround</span>
            </h4>

            <div className="filter-options-list">
              {[
                { id: 'express', label: 'Express (1 - 3 Days)' },
                { id: 'standard', label: 'Standard (4 - 7 Days)' },
                { id: 'extended', label: 'Extended (8+ Days)' },
              ].map((speed) => (
                <label key={speed.id} className="filter-checkbox-label">
                  <input
                    type="checkbox"
                    className="filter-checkbox-input"
                    checked={speedFilters.includes(speed.id)}
                    onChange={() => handleToggleSpeed(speed.id)}
                  />
                  <span className="filter-option-name">{speed.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 5. Special Spotlight Filter */}
          <div className="filter-group">
            <h4 className="filter-group-title">
              <span>Spotlight</span>
            </h4>

            <label className="filter-checkbox-label">
              <input
                type="checkbox"
                className="filter-checkbox-input"
                checked={featuredOnly}
                onChange={(e) => setFeaturedOnly(e.target.checked)}
              />
              <span className="filter-option-name">
                <i className="fa-solid fa-star" style={{ color: 'var(--warning-yellow)', marginRight: '0.375rem' }}></i>
                Featured Services Only
              </span>
            </label>
          </div>
        </aside>

        {/* ── Right Main Area (Search Toolbar + Cards) ──────────────── */}
        <div className="shopping-main-area">
          {/* Toolbar Card */}
          <div className="shopping-toolbar-card">
            <div className="shopping-toolbar-row">
              {/* Mobile Filter Toggle */}
              <button
                type="button"
                className="mobile-filter-drawer-btn"
                onClick={() => setIsMobileDrawerOpen(true)}
              >
                <i className="fa-solid fa-sliders"></i>
                Filters {hasActiveFilters ? `(Active)` : ''}
              </button>

              {/* Search Box */}
              <div className="shopping-search-box">
                <i className="fa-solid fa-magnifying-glass shopping-search-icon"></i>
                <input
                  type="text"
                  className="shopping-search-input"
                  placeholder="Search by service name, category, document keywords, or #tag..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="shopping-search-clear"
                    onClick={() => setSearchTerm('')}
                    title="Clear search"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>

              {/* Right Controls: Sort & View Mode */}
              <div className="shopping-toolbar-controls">
                <div className="shopping-sort-wrap">
                  <label htmlFor="shoppingSort" className="shopping-sort-label">
                    <i className="fa-solid fa-arrow-down-short-wide" style={{ marginRight: '0.25rem' }}></i>
                    Sort:
                  </label>
                  <select
                    id="shoppingSort"
                    className="shopping-sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="featured">Featured & Recommended</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="fastest">Fastest Turnaround</option>
                    <option value="name-asc">Alphabetical (A - Z)</option>
                    <option value="newest">Newest Additions</option>
                  </select>
                </div>

                {/* Grid / List Switcher */}
                <div className="shopping-view-switcher">
                  <button
                    type="button"
                    className={`view-switch-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewMode('grid')}
                    title="Grid View"
                  >
                    <i className="fa-solid fa-table-cells"></i>
                  </button>
                  <button
                    type="button"
                    className={`view-switch-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => setViewMode('list')}
                    title="List View"
                  >
                    <i className="fa-solid fa-list"></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filter Pills Row */}
            {hasActiveFilters && (
              <div className="shopping-active-filters-bar">
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-mid)' }}>
                  Active Filters:
                </span>

                {searchTerm && (
                  <span className="active-filter-pill">
                    Search: "{searchTerm}"
                    <button type="button" onClick={() => setSearchTerm('')}>
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </span>
                )}

                {selectedCategories.map((c) => (
                  <span key={c} className="active-filter-pill">
                    Category: {c}
                    <button type="button" onClick={() => handleToggleCategory(c)}>
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </span>
                ))}

                {selectedTags.map((t) => (
                  <span key={t} className="active-filter-pill">
                    #{t}
                    <button type="button" onClick={() => handleToggleTag(t)}>
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </span>
                ))}

                {priceTier !== 'all' && priceTier !== 'custom' && (
                  <span className="active-filter-pill">
                    Price: {priceTier === 'under1000' ? 'Under ₱1,000' : priceTier === '1000-3000' ? '₱1,000 - ₱3,000' : priceTier === '3000-5000' ? '₱3,000 - ₱5,000' : 'Above ₱5,000'}
                    <button type="button" onClick={() => setPriceTier('all')}>
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </span>
                )}

                {(customMinPrice || customMaxPrice) && (
                  <span className="active-filter-pill">
                    Price: ₱{customMinPrice || '0'} - ₱{customMaxPrice || '∞'}
                    <button type="button" onClick={() => { setCustomMinPrice(''); setCustomMaxPrice(''); setPriceTier('all'); }}>
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </span>
                )}

                {speedFilters.map((s) => (
                  <span key={s} className="active-filter-pill">
                    Speed: {s === 'express' ? '1-3 Days' : s === 'standard' ? '4-7 Days' : '8+ Days'}
                    <button type="button" onClick={() => handleToggleSpeed(s)}>
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </span>
                ))}

                {featuredOnly && (
                  <span className="active-filter-pill">
                    Featured Only
                    <button type="button" onClick={() => setFeaturedOnly(false)}>
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </span>
                )}

                <button
                  type="button"
                  className="active-filter-clear-all"
                  onClick={handleResetAllFilters}
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>

          {/* Products Grid or List */}
          <div className={viewMode === 'grid' ? 'shopping-products-grid' : 'shopping-products-list'}>
            {loading ? (
              <div className="shopping-empty-card">
                <i className="fa-solid fa-spinner fa-spin shopping-empty-icon" style={{ fontSize: '2.5rem' }}></i>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-dark)' }}>
                  Loading Catalog Items...
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-mid)', margin: 0 }}>
                  Connecting to real-time service listings.
                </p>
              </div>
            ) : filteredAndSortedServices.length === 0 ? (
              <div className="shopping-empty-card">
                <div className="shopping-empty-icon">
                  <i className="fa-solid fa-filter-circle-xmark"></i>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-dark)' }}>
                  No Matching Services Found
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-mid)', maxWidth: '26rem', margin: 0 }}>
                  We couldn't find any services matching your filter combinations. Try unchecking some filters or resetting.
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleResetAllFilters}
                  style={{ display: 'inline-flex' }}
                >
                  <i className="fa-solid fa-rotate-left"></i>
                  Reset All Filters
                </button>
              </div>
            ) : (
              displayedServices.map((service) => {
                const reqCount = Array.isArray(service.requirements)
                  ? service.requirements.length
                  : (Array.isArray(service.actions) ? service.actions.length : 0);
                const turnaroundStr = formatProcessingTime(service.processingTime);
                const coverUrl = service.coverImage || service.coverPhoto || service.coverPhotoUrl;

                return (
                  <article
                    key={service.id}
                    className={`shopping-card ${viewMode === 'list' ? 'shopping-card--list' : ''}`}
                  >
                    {/* Media Header */}
                    <div
                      className="shopping-card-media"
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/client/services/${service.id}`)}
                    >
                      {coverUrl && (
                        <img
                          src={coverUrl}
                          alt={service.name}
                          className="shopping-cover-img"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.parentElement?.querySelector('.shopping-cover-fallback');
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      )}
                      <div
                        className="shopping-cover-fallback"
                        style={{ display: coverUrl ? 'none' : 'flex' }}
                      >
                        <i className={`${getCategoryFallbackIcon(service.category)} shopping-fallback-icon`}></i>
                        <span className="shopping-fallback-text">{service.category || 'Travel Service'}</span>
                      </div>

                      {/* Top Badges */}
                      <div className="shopping-overlay-top">
                        <span className="shopping-category-tag">
                          {service.category || 'General'}
                        </span>
                        {service.featured && (
                          <span className="shopping-featured-badge">
                            <i className="fa-solid fa-star"></i> Featured
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Content Body */}
                    <div className="shopping-card-body">
                      <div className="shopping-card-header">
                        <h4
                          className="shopping-card-title"
                          style={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/client/services/${service.id}`)}
                        >
                          {service.name}
                        </h4>

                        {/* Tags Badges */}
                        {Array.isArray(service.tags) && service.tags.length > 0 && (
                          <div className="shopping-tags-row">
                            {service.tags.map((t, idx) => (
                              <span
                                key={idx}
                                className="shopping-tag-badge"
                                onClick={() => handleToggleTag(t)}
                                style={{ cursor: 'pointer' }}
                                title={`Filter by #${t}`}
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Highlights Meta Row */}
                      <div className="shopping-meta-row">
                        {turnaroundStr && (
                          <div className="shopping-meta-item">
                            <i className="fa-regular fa-clock"></i>
                            <span>{turnaroundStr}</span>
                          </div>
                        )}
                        <div className="shopping-meta-item">
                          <i className="fa-solid fa-list-check"></i>
                          <span>{reqCount} {reqCount === 1 ? 'Requirement' : 'Requirements'}</span>
                        </div>
                      </div>

                      {/* Description */}
                      {service.description && (
                        <p
                          className="shopping-card-desc"
                          style={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/client/services/${service.id}`)}
                        >
                          {service.description}
                        </p>
                      )}

                      {/* Card Footer with Price and Action */}
                      <div className="shopping-card-footer">
                        <div className="shopping-price-box">
                          <span className="shopping-price-label">Fee</span>
                          <span className="shopping-price-val">
                            {formatPriceDisplay(service.price)}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => navigate(`/client/services/${service.id}`)}
                            title="View service details & gallery"
                            style={{ padding: '0.5rem 0.75rem', fontSize: '0.8125rem' }}
                          >
                            <i className="fa-regular fa-eye"></i> Details
                          </button>
                          <button
                            type="button"
                            className="btn-primary shopping-request-btn"
                            onClick={() => onRequestService && onRequestService(service)}
                          >
                            <i className="fa-solid fa-bag-shopping"></i>
                            Request
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            )}

            {/* Load More Section & Infinite Scroll Trigger */}
            {filteredAndSortedServices.length > PAGE_SIZE && (
              <div className="shopping-load-more-section">
                <div className="shopping-load-more-progress">
                  <span className="shopping-progress-text">
                    Showing <strong>{displayedServices.length}</strong> of <strong>{filteredAndSortedServices.length}</strong> services
                  </span>
                  <div className="shopping-progress-bar-track">
                    <div
                      className="shopping-progress-bar-fill"
                      style={{
                        width: `${Math.round((displayedServices.length / filteredAndSortedServices.length) * 100)}%`
                      }}
                    />
                  </div>
                </div>

                {hasMore ? (
                  <>
                    <button
                      type="button"
                      className="btn-secondary shopping-load-more-btn"
                      onClick={handleLoadMore}
                    >
                      <i className="fa-solid fa-arrow-down"></i>
                      Load More Services ({Math.min(PAGE_SIZE, filteredAndSortedServices.length - displayedServices.length)} more)
                    </button>
                    {/* Sentinel for infinite scroll */}
                    <div ref={loadMoreObserverRef} className="shopping-infinite-sentinel" />
                  </>
                ) : (
                  <div className="shopping-end-reached">
                    <i className="fa-solid fa-circle-check"></i>
                    <span>All {filteredAndSortedServices.length} services loaded</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
