import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { firestore } from '../../../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { fetchServices } from '../../../services/serviceService';
import ServiceDetailModal from './ServiceDetailModal';
import './services.css';

// Curated operator services that represent the core FairFly franchise offerings
// Curated operator services that represent the core FairFly franchise offerings
const DEFAULT_OPERATOR_SERVICES = [
  {
    id: 'op-passport-expedite',
    name: 'DFA Passport Application & Renewal Expedite',
    category: 'Passport Processing',
    price: '₱1,200',
    processingTime: { min: 5, max: 7, unit: 'days' },
    requirements: [
      'Original PSA Birth Certificate',
      'Valid Government-Issued ID',
      'Confirmed DFA Appointment Schedule',
      'Accomplished Application Form'
    ],
    description: 'Complete DFA appointment slot booking, document validation, PSA authentication verification, and express consular submission.',
    tags: ['DFA', 'Passport', 'Renewal', 'Expedited'],
    featured: true,
    icon: 'fa-solid fa-id-card',
    iconBg: 'linear-gradient(135deg, #6366f1, #818cf8)'
  },
  {
    id: 'op-psa-civil-docs',
    name: 'PSA Civil Registry Documents (Birth, Marriage, CENOMAR)',
    category: 'PSA & Civil Documents',
    price: '₱950',
    processingTime: { min: 3, max: 5, unit: 'days' },
    requirements: [
      'Valid ID of Document Owner',
      'Authorization Letter (if representative)',
      'PSA Request Verification Slip',
      'Clear Photocopy of Valid ID'
    ],
    description: 'Hassle-free retrieval and authentication of PSA birth certificates, marriage contracts, CENOMAR, and death records with doorstep delivery.',
    tags: ['PSA', 'BirthCert', 'CENOMAR', 'Authentication'],
    featured: true,
    icon: 'fa-regular fa-file-lines',
    iconBg: 'linear-gradient(135deg, #3b82f6, #60a5fa)'
  },
  {
    id: 'op-japan-visa',
    name: 'Japan Tourist Visa Assistance (Single & Multiple Entry)',
    category: 'Visa & Embassy Assistance',
    price: '₱2,800',
    processingTime: { min: 7, max: 10, unit: 'days' },
    requirements: [
      'Valid Philippine Passport (6 mos validity)',
      'PSA Birth Certificate',
      'Bank Certificate & Statement',
      'Income Tax Return (ITR Form 2316)',
      'Detailed Daily Travel Itinerary'
    ],
    description: 'Embassy-accredited visa filing with full documentation audit, itinerary crafting, financial proof verification, and submission tracking.',
    tags: ['Visa', 'Japan', 'TouristVisa', 'Embassy', 'MultipleEntry'],
    featured: true,
    icon: 'fa-solid fa-passport',
    iconBg: 'linear-gradient(135deg, #ec4899, #f472b6)'
  },
  {
    id: 'op-flight-ticketing',
    name: 'Domestic & International Airline Flight Ticketing',
    category: 'Airline Ticketing',
    price: '₱1,500',
    processingTime: { min: 1, max: 2, unit: 'days' },
    requirements: [
      'Valid Government ID / Passport',
      'Travel Dates & Route Preferences',
      'Passenger Contact Information',
      'Baggage & Seat Preferences'
    ],
    description: 'Real-time GDS airline flight booking with exclusive consolidated promo fares, baggage add-ons, flexible date changes, and 24/7 rebooking support.',
    tags: ['Airlines', 'PromoFares', 'Domestic', 'International'],
    featured: true,
    icon: 'fa-solid fa-plane-departure',
    iconBg: 'linear-gradient(135deg, #0ea5e9, #38bdf8)'
  },
  {
    id: 'op-boracay-package',
    name: 'Boracay Island Beachfront Holiday Tour (3D2N)',
    category: 'Tour Packages',
    price: '₱12,500',
    processingTime: { min: 3, max: 5, unit: 'days' },
    requirements: [
      'Valid Government ID for all guests',
      'Confirmed Flight Details',
      'Room Occupancy Preference',
      'Activity & Island Transfer Requests'
    ],
    description: 'All-inclusive beachfront resort stay, roundtrip speedboat transfers, island hopping with seafood buffet, and environmental compliance passes.',
    tags: ['Boracay', 'TourPackage', 'BeachResort', 'IslandHopping'],
    featured: true,
    icon: 'fa-solid fa-map-location-dot',
    iconBg: 'linear-gradient(135deg, #f59e0b, #fbbf24)'
  },
  {
    id: 'op-korea-visa',
    name: 'South Korea Tourist Visa & E-Arrival Processing',
    category: 'Visa & Embassy Assistance',
    price: '₱2,500',
    processingTime: { min: 8, max: 12, unit: 'days' },
    requirements: [
      'Valid Passport',
      'Certificate of Employment / Business Permit',
      'Bank Certificate with ADB',
      'ITR 2316',
      'KVAC Application Form'
    ],
    description: 'Complete KVAC South Korea visa consultation, form preparation, financial assessment, and visa application submission assistance.',
    tags: ['Visa', 'Korea', 'KVAC', 'Seoul'],
    featured: false,
    icon: 'fa-solid fa-passport',
    iconBg: 'linear-gradient(135deg, #ec4899, #f472b6)'
  },
  {
    id: 'op-schengen-visa',
    name: 'Schengen European Tourist & Business Visa Assistance',
    category: 'Visa & Embassy Assistance',
    price: '₱4,950',
    processingTime: { min: 15, max: 20, unit: 'days' },
    requirements: [
      'Valid Passport (6 mos)',
      'Cover Letter & Flight Reservation',
      'Proof of Accommodation',
      'Travel Medical Insurance (EUR 30,000)',
      'Bank Statements & Solvency Proof'
    ],
    description: 'Expert consultation for France, Italy, Spain, and Germany Schengen visa applications, mock interview prep, and appointment booking.',
    tags: ['Visa', 'Schengen', 'Europe', 'VFS', 'TLScontact'],
    featured: false,
    icon: 'fa-solid fa-passport',
    iconBg: 'linear-gradient(135deg, #ec4899, #f472b6)'
  },
  {
    id: 'op-singapore-twin-tour',
    name: 'Singapore & Malaysia Twin City Tour Package (4D3N)',
    category: 'Tour Packages',
    price: '₱18,900',
    processingTime: { min: 5, max: 7, unit: 'days' },
    requirements: [
      'Valid Passport with 6 months validity',
      'Vaccination Record / E-arrival card',
      'Emergency Contact Information'
    ],
    description: 'Curated 4-day twin city itinerary featuring Universal Studios Singapore, Gardens by the Bay, cross-border transfers, and Kuala Lumpur city tour.',
    tags: ['Singapore', 'Malaysia', 'TourPackage', 'TwinCity'],
    featured: false,
    icon: 'fa-solid fa-compass',
    iconBg: 'linear-gradient(135deg, #14b8a6, #2dd4bf)'
  }
];

const BASE_CATEGORY_CONFIG = [
  {
    id: 'all',
    label: 'All Services',
    icon: 'fa-solid fa-layer-group',
    keywords: [],
  },
  {
    id: 'passport',
    label: 'Passport',
    icon: 'fa-solid fa-id-card',
    keywords: ['passport', 'dfa', 'renewal', 'expedite'],
  },
  {
    id: 'psa',
    label: 'PSA Documents',
    icon: 'fa-regular fa-file-lines',
    keywords: ['psa', 'civil', 'birth', 'marriage', 'cenomar', 'death'],
  },
  {
    id: 'visa',
    label: 'Visa Assistance',
    icon: 'fa-solid fa-passport',
    keywords: ['visa', 'embassy', 'kvac', 'schengen', 'consular'],
  },
  {
    id: 'flights',
    label: 'Flight Tickets',
    icon: 'fa-solid fa-plane-departure',
    keywords: ['airline', 'flight', 'ticketing', 'ticket', 'airfare', 'promo'],
  },
  {
    id: 'tours',
    label: 'Tour Packages',
    icon: 'fa-solid fa-map-location-dot',
    keywords: ['tour', 'package', 'beachfront', 'island', 'travel package', 'holiday', 'itinerary', 'resort'],
  },
  {
    id: 'insurance',
    label: 'Insurance & Hotels',
    icon: 'fa-solid fa-hotel',
    keywords: ['insurance', 'hotel', 'accommodation'],
  },
  {
    id: 'authentication',
    label: 'Authentication',
    icon: 'fa-solid fa-stamp',
    keywords: ['authentication', 'legalization', 'apostille', 'red ribbon', 'notarization'],
  },
];

function getCategoryVisuals(category, name) {
  const cat = (category || '').toLowerCase();
  const title = (name || '').toLowerCase();

  if (cat.includes('visa') || cat.includes('embassy') || title.includes('visa')) {
    return {
      icon: 'fa-solid fa-passport',
      iconBg: 'linear-gradient(135deg, #ec4899, #f472b6)',
    };
  }
  if (cat.includes('passport') || title.includes('passport') || cat.includes('dfa')) {
    return {
      icon: 'fa-solid fa-id-card',
      iconBg: 'linear-gradient(135deg, #6366f1, #818cf8)',
    };
  }
  if (cat.includes('psa') || cat.includes('civil') || title.includes('psa') || title.includes('birth') || title.includes('marriage')) {
    return {
      icon: 'fa-regular fa-file-lines',
      iconBg: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
    };
  }
  if (cat.includes('flight') || cat.includes('airline') || cat.includes('ticket') || title.includes('flight')) {
    return {
      icon: 'fa-solid fa-plane-departure',
      iconBg: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
    };
  }
  if (cat.includes('tour') || title.includes('tour') || title.includes('package')) {
    return {
      icon: 'fa-solid fa-map-location-dot',
      iconBg: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
    };
  }
  return {
    icon: 'fa-solid fa-briefcase',
    iconBg: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
  };
}

function isServiceMatchingCategory(service, tab) {
  if (!tab || tab.id === 'all') return true;
  if (!service) return false;

  const category = (service.category || '').toLowerCase().trim();
  const name = (service.name || '').toLowerCase().trim();
  const tabId = (tab.id || '').toLowerCase().trim();
  const tabLabel = (tab.label || '').toLowerCase().trim();

  // 1. Direct match with ID, Label, or substring
  if (category === tabId || category === tabLabel) return true;
  if (category.includes(tabId) || (category.length > 3 && tabLabel.includes(category))) return true;

  // 2. Keyword check against category, name, and tags
  if (Array.isArray(tab.keywords) && tab.keywords.length > 0) {
    const serviceTags = Array.isArray(service.tags)
      ? service.tags.map((t) => String(t).toLowerCase())
      : [];

    const matchesKeyword = tab.keywords.some((kw) => {
      const kwLower = kw.toLowerCase();
      return (
        category.includes(kwLower) ||
        name.includes(kwLower) ||
        serviceTags.some((t) => t.includes(kwLower))
      );
    });

    if (matchesKeyword) return true;
  }

  return false;
}

function formatProcessingTime(processingTime) {
  if (!processingTime) return '1-3 Days';
  if (typeof processingTime === 'string') return processingTime;
  const { min, max, unit = 'days' } = processingTime;
  if (!min && !max) return '1-3 Days';
  if (min === max || !max) return `${min} ${unit}`;
  return `${min}-${max} ${unit}`;
}

function formatPriceDisplay(price) {
  if (!price) return '₱950';
  if (typeof price === 'string' && (price.startsWith('₱') || price.startsWith('PHP'))) {
    return price;
  }
  const num = typeof price === 'number' ? price : parseFloat(String(price).replace(/[^0-9.]/g, '')) || 0;
  return `₱${num.toLocaleString('en-US')}`;
}

export default function Services() {
  const navigate = useNavigate();
  const [dbServices, setDbServices] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Dual-sync live Firestore listener & API fetch
  useEffect(() => {
    // 1. Live Firestore listener
    const q = query(collection(firestore, 'services'), where('status', '!=', 'Disabled'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        if (list.length > 0) {
          setDbServices(list);
        }
      },
      (err) => {
        console.warn('[Landing Services] Firestore listener notice:', err);
      }
    );

    // 2. Fetch REST API
    fetchServices(
      (data) => {
        if (Array.isArray(data) && data.length > 0) {
          const active = data.filter((s) => s.status !== 'Disabled' && s.status !== 'Inactive');
          if (active.length > 0) {
            setDbServices(active);
          }
        }
      },
      (err) => {
        console.warn('[Landing Services] API fetch notice:', err);
      }
    );

    return () => unsubscribe();
  }, []);

  // Merge live database services with rich operator defaults
  const allServices = useMemo(() => {
    if (dbServices.length === 0) {
      return DEFAULT_OPERATOR_SERVICES;
    }

    // Use DB services, mapping missing UI fields with clean defaults (no placeholder images)
    return dbServices.map((service) => {
      const visuals = getCategoryVisuals(service.category, service.name || service.title);
      const rawCover = service.coverImage || service.coverPhoto || service.coverPhotoUrl || service.image;
      const isValidImage =
        typeof rawCover === 'string' &&
        rawCover.trim().length > 0 &&
        !rawCover.includes('unsplash.com') &&
        !rawCover.startsWith('/services/');

      return {
        ...service,
        id: service.id,
        name: service.name || service.title || 'Custom Service',
        category: service.category || 'General Service',
        price: service.price || '₱950',
        processingTime: service.processingTime || '3-5 days',
        requirements: Array.isArray(service.requirements)
          ? service.requirements
          : Array.isArray(service.actions)
          ? service.actions
          : [],
        description:
          service.description ||
          'Standardized service processing handled directly by certified FairFly franchise operators.',
        tags: Array.isArray(service.tags) ? service.tags : [],
        featured: Boolean(service.featured),
        icon: service.icon || visuals.icon,
        iconBg: service.iconBg || visuals.iconBg,
        coverImage: isValidImage ? rawCover : null,
      };
    });
  }, [dbServices]);

  // Dynamically compute category tabs with accurate counts
  const categoryTabs = useMemo(() => {
    const configured = BASE_CATEGORY_CONFIG.map((tab) => {
      const count =
        tab.id === 'all'
          ? allServices.length
          : allServices.filter((s) => isServiceMatchingCategory(s, tab)).length;
      return { ...tab, count };
    });

    // Capture any custom categories added in Firestore that don't match base tabs
    const customTabs = [];
    allServices.forEach((service) => {
      if (service.category) {
        const matchesAnyBase = BASE_CATEGORY_CONFIG.slice(1).some((bt) =>
          isServiceMatchingCategory(service, bt)
        );
        if (!matchesAnyBase) {
          const rawCat = service.category.trim();
          const customId = rawCat.toLowerCase();
          if (!customTabs.some((ct) => ct.id === customId)) {
            const count = allServices.filter(
              (s) => (s.category || '').trim().toLowerCase() === customId
            ).length;
            customTabs.push({
              id: customId,
              label: rawCat,
              icon: 'fa-solid fa-tag',
              keywords: [customId],
              count,
            });
          }
        }
      }
    });

    // Display 'all' plus any category with services
    return [...configured, ...customTabs].filter(
      (tab) => tab.id === 'all' || tab.count > 0
    );
  }, [allServices]);

  const [selectedService, setSelectedService] = useState(null);

  // Filter by category and search term with robust tag support
  const filteredServices = useMemo(() => {
    const queryStr = searchTerm.toLowerCase().trim();
    const selectedTab =
      categoryTabs.find((t) => t.id === activeCategory) || {
        id: 'all',
        keywords: [],
      };

    return allServices.filter((service) => {
      // 1. Category Match
      const matchesCategory = isServiceMatchingCategory(service, selectedTab);

      // 2. Search Match
      if (!queryStr) return matchesCategory;

      const nameMatch = (service.name || '').toLowerCase().includes(queryStr);
      const catMatch = (service.category || '').toLowerCase().includes(queryStr);
      const descMatch = (service.description || '').toLowerCase().includes(queryStr);
      const tagsMatch =
        Array.isArray(service.tags) &&
        service.tags.some((t) => String(t).toLowerCase().includes(queryStr));
      const reqsMatch =
        Array.isArray(service.requirements) &&
        service.requirements.some((r) => {
          const text = typeof r === 'string' ? r : r.name || r.title || '';
          return text.toLowerCase().includes(queryStr);
        });

      const matchesSearch = nameMatch || catMatch || descMatch || tagsMatch || reqsMatch;

      return matchesCategory && matchesSearch;
    });
  }, [allServices, activeCategory, searchTerm, categoryTabs]);

  // Handle Avail Service Button -> Go to login page with service parameter
  const handleAvailService = (service) => {
    navigate(`/login?serviceId=${encodeURIComponent(service.id)}&serviceName=${encodeURIComponent(service.name)}`);
  };

  return (
    <section id="services" className="landing-services-section">
      <div className="landing-services-container">
        {/* Section Header */}
        <div className="landing-services-header">
          <div className="services-badge">
            <i className="fa-solid fa-briefcase"></i>
            <span>Verified Operator Services</span>
          </div>
          <h2 className="landing-services-title">Available Travel & Document Services</h2>
          <p className="landing-services-sub">
            Standardized, verified processing handled directly by our certified FairFly franchise operators and branch network.
          </p>
        </div>

        {/* Filter Toolbar: Search & Category Chips */}
        <div className="services-toolbar">
          {/* Category Filter Chips */}
          <div className="services-category-chips">
            {categoryTabs.map((tab) => {
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`service-chip-btn ${activeCategory === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(tab.id)}
                >
                  <i className={tab.icon}></i>
                  <span>{tab.label}</span>
                  <span className="chip-count">{tab.count}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="services-search-wrapper">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              className="services-search-input"
              placeholder="Search passport, visa, PSA, flights..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search services"
            />
            {searchTerm && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>
        </div>

        {/* Services Cards Grid */}
        <div className="landing-services-grid">
          {filteredServices.length === 0 ? (
            <div className="services-empty-state">
              <div className="empty-icon-wrap">
                <i className="fa-solid fa-filter-circle-xmark"></i>
              </div>
              <h3>No matching services found</h3>
              <p>Try searching for a different keyword or choose another category filter.</p>
              <button
                type="button"
                className="btn-reset-filters"
                onClick={() => {
                  setActiveCategory('all');
                  setSearchTerm('');
                }}
              >
                <i className="fa-solid fa-rotate-left"></i> Reset Filters
              </button>
            </div>
          ) : (
            filteredServices.map((service) => {
              const reqCount = Array.isArray(service.requirements) ? service.requirements.length : 0;
              const turnaround = formatProcessingTime(service.processingTime);
              const priceDisplay = formatPriceDisplay(service.price);

              return (
                <article
                  key={service.id}
                  className="landing-service-card"
                  onClick={() => setSelectedService(service)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedService(service);
                    }
                  }}
                  aria-label={`View details for ${service.name}`}
                >
                  {/* Uniform Cover Image Banner: Real cover image or FairFly Brand Logo */}
                  <div className={`service-card-media ${!service.coverImage ? 'service-card-media-logo' : ''}`}>
                    {service.coverImage ? (
                      <img
                        src={service.coverImage}
                        alt={service.name}
                        className="service-card-img"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const logoEl = e.currentTarget.parentElement?.querySelector('.service-card-logo-backdrop');
                          if (logoEl) logoEl.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="service-card-logo-backdrop"
                      style={{ display: service.coverImage ? 'none' : 'flex' }}
                    >
                      <img
                        src="/FairflyLogo.png"
                        alt="FairFly"
                        className="service-card-brand-logo"
                      />
                    </div>
                    {service.category && (
                      <span className="service-card-category-pill">
                        {service.category}
                      </span>
                    )}
                  </div>

                  {/* Clean, spacious card body */}
                  <div className="service-card-body">
                    <h3 className="service-card-title">{service.name}</h3>

                    {/* Subtle 1-line metadata */}
                    <div className="service-card-meta">
                      <span className="service-card-meta-item">
                        <i className="fa-regular fa-clock"></i>
                        <span>{turnaround}</span>
                      </span>
                      {reqCount > 0 && (
                        <>
                          <span className="service-card-meta-dot">•</span>
                          <span className="service-card-meta-item">
                            <i className="fa-regular fa-file-lines"></i>
                            <span>{reqCount} {reqCount === 1 ? 'doc required' : 'docs required'}</span>
                          </span>
                        </>
                      )}
                    </div>

                    <p className="service-card-description">{service.description}</p>

                    {/* Service Tags */}
                    {Array.isArray(service.tags) && service.tags.length > 0 && (
                      <div className="service-card-tags">
                        {service.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="service-tag-pill"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSearchTerm(tag);
                            }}
                            title={`Filter by #${tag}`}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Clean footer: Starting price on left, single CTA on right */}
                  <div className="service-card-footer">
                    <div className="service-card-price">
                      <span className="service-card-price-label">Starting at</span>
                      <span className="service-card-price-amount">{priceDisplay}</span>
                    </div>

                    <button
                      type="button"
                      className="service-card-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedService(service);
                      }}
                    >
                      <span>View Details</span>
                      <i className="fa-solid fa-arrow-right"></i>
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* Airbnb / E-commerce Style Detail Modal */}
        <ServiceDetailModal
          isOpen={Boolean(selectedService)}
          service={selectedService}
          onClose={() => setSelectedService(null)}
          onAvailService={handleAvailService}
        />
      </div>
    </section>
  );
}
