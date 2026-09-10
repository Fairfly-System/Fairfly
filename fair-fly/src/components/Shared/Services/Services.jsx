import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { firestore } from '../../../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { fetchServices } from '../../../services/serviceService';
import ServiceDetailModal from './ServiceDetailModal';
import './services.css';

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
    iconBg: 'linear-gradient(135deg, #6366f1, #818cf8)',
    image: '/services/passport.jpg',
    fallbackImage: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80'
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
    iconBg: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
    image: '/services/psa-docs.jpg',
    fallbackImage: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'op-japan-visa',
    name: 'Japan Tourist Visa Assistance (Single & Multiple Entry)',
    category: 'Visa Assistance',
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
    tags: ['Japan', 'TouristVisa', 'Embassy', 'MultipleEntry'],
    featured: true,
    icon: 'fa-solid fa-passport',
    iconBg: 'linear-gradient(135deg, #ec4899, #f472b6)',
    image: '/services/japan-visa.jpg',
    fallbackImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80'
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
    iconBg: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
    image: '/services/flight-ticket.jpg',
    fallbackImage: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80'
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
    iconBg: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
    image: '/services/boracay.jpg',
    fallbackImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'op-korea-visa',
    name: 'South Korea Tourist Visa & E-Arrival Processing',
    category: 'Visa Assistance',
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
    tags: ['Korea', 'KVAC', 'Visa', 'Seoul'],
    featured: false,
    icon: 'fa-solid fa-plane-up',
    iconBg: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
    image: '/services/korea-visa.jpg',
    fallbackImage: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'op-schengen-visa',
    name: 'Schengen European Tourist & Business Visa Assistance',
    category: 'Visa Assistance',
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
    tags: ['Schengen', 'Europe', 'VFS', 'TLScontact'],
    featured: false,
    icon: 'fa-solid fa-earth-europe',
    iconBg: 'linear-gradient(135deg, #10b981, #34d399)',
    image: '/services/schengen-visa.jpg',
    fallbackImage: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80'
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
    iconBg: 'linear-gradient(135deg, #14b8a6, #2dd4bf)',
    image: '/services/singapore-tour.jpg',
    fallbackImage: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80'
  }
];

const CATEGORY_TABS = [
  { id: 'all', label: 'All Services', icon: 'fa-solid fa-layer-group' },
  { id: 'Passport Processing', label: 'Passport', icon: 'fa-solid fa-id-card' },
  { id: 'PSA & Civil Documents', label: 'PSA Documents', icon: 'fa-regular fa-file-lines' },
  { id: 'Visa Assistance', label: 'Visa Assistance', icon: 'fa-solid fa-passport' },
  { id: 'Airline Ticketing', label: 'Flight Tickets', icon: 'fa-solid fa-plane-departure' },
  { id: 'Tour Packages', label: 'Tour Packages', icon: 'fa-solid fa-map-location-dot' },
];

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

    // Use DB services, mapping missing UI fields with clean defaults
    return dbServices.map((service, index) => {
      const fallback = DEFAULT_OPERATOR_SERVICES[index % DEFAULT_OPERATOR_SERVICES.length];
      return {
        ...fallback,
        ...service,
        id: service.id || fallback.id,
        name: service.name || service.title || fallback.name,
        category: service.category || fallback.category,
        price: service.price || fallback.price,
        processingTime: service.processingTime || fallback.processingTime,
        requirements: Array.isArray(service.requirements) && service.requirements.length > 0
          ? service.requirements
          : fallback.requirements,
        description: service.description || fallback.description,
        tags: Array.isArray(service.tags) && service.tags.length > 0
          ? service.tags
          : fallback.tags,
        featured: service.featured !== undefined ? service.featured : fallback.featured,
        icon: service.icon || fallback.icon,
        iconBg: service.iconBg || fallback.iconBg,
        coverImage: service.coverImage || service.coverPhoto || service.coverPhotoUrl,
        image: service.image || service.coverImage || fallback.image,
        fallbackImage: service.fallbackImage || fallback.fallbackImage,
      };
    });
  }, [dbServices]);

  const [selectedService, setSelectedService] = useState(null);

  // Filter by category and search term
  const filteredServices = useMemo(() => {
    return allServices.filter((service) => {
      // Category Match
      const matchesCategory =
        activeCategory === 'all' ||
        (service.category && service.category.toLowerCase().includes(activeCategory.toLowerCase()));

      // Search Match
      const queryStr = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !queryStr ||
        (service.name && service.name.toLowerCase().includes(queryStr)) ||
        (service.description && service.description.toLowerCase().includes(queryStr)) ||
        (service.category && service.category.toLowerCase().includes(queryStr)) ||
        (Array.isArray(service.tags) && service.tags.some((t) => t.toLowerCase().includes(queryStr)));

      return matchesCategory && matchesSearch;
    });
  }, [allServices, activeCategory, searchTerm]);

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
            {CATEGORY_TABS.map((tab) => {
              const count = tab.id === 'all'
                ? allServices.length
                : allServices.filter((s) => s.category && s.category.toLowerCase().includes(tab.id.toLowerCase())).length;

              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`service-chip-btn ${activeCategory === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(tab.id)}
                >
                  <i className={tab.icon}></i>
                  <span>{tab.label}</span>
                  <span className="chip-count">{count}</span>
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
                  {/* Photo Media Banner with single clean category tag */}
                  <div className="service-card-media">
                    <img
                      src={service.image || service.coverImage || '/services/passport.jpg'}
                      alt={service.name}
                      className="service-card-img"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = service.fallbackImage || 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
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
