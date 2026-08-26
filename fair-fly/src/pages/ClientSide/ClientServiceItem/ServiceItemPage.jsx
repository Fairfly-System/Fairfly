import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { fetchServiceById } from '../../../services/serviceService';
import ClientServiceRequestModal from '../../../components/Client/ClientServiceRequestModal/ClientServiceRequestModal';
import ClientAppointmentForm from '../../../components/Client/ClientAppointmentForm/ClientAppointmentForm';
import Breadcrumbs from '../../../components/UI/Breadcrumbs/Breadcrumbs';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import toFriendlyMessage from '../../../utils/friendlyErrors';
import './service-item-page.css';

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

export default function ServiceItemPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  useEffect(() => {
    if (!serviceId) return;

    setLoading(true);
    fetchServiceById(
      serviceId,
      (data) => {
        setService(data);
        setLoading(false);
        setActiveImageIndex(0);
      },
      (error) => {
        console.error('Error fetching service details:', error);
        addToast(toFriendlyMessage(error, 'Unable to load service item. Please refresh.'), 'error');
        setLoading(false);
      },
      setLoading
    );
  }, [serviceId, addToast]);

  // Gallery image list (cover image + carousel images)
  const galleryImages = useMemo(() => {
    if (!service) return [];
    const list = [];
    const cover = service.coverImage || service.coverPhoto || service.coverPhotoUrl;
    if (cover) list.push(cover);

    if (Array.isArray(service.carouselImages)) {
      service.carouselImages.forEach((img) => {
        const url = typeof img === 'string' ? img : img?.url;
        if (url && !list.includes(url)) {
          list.push(url);
        }
      });
    }
    return list;
  }, [service]);

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0));
  };

  const categoryIcon = service?.category
    ? CATEGORY_ICON_MAP[service.category.toLowerCase()] || 'fa-solid fa-concierge-bell'
    : 'fa-solid fa-concierge-bell';

  const turnaround = formatProcessingTime(service?.processingTime);
  const reqList = Array.isArray(service?.requirements)
    ? service.requirements
    : (Array.isArray(service?.actions) ? service.actions : []);

  const breadcrumbs = [
    { label: 'Client Portal', to: '/client' },
    { label: 'Services Store', to: '/client' },
    { label: service?.name || 'Service Details' }
  ];

  if (loading) {
    return (
      <main className="service-product-page page-fade-in">
        <Breadcrumbs items={breadcrumbs} />
        <div className="card service-loading-card">
          <i className="fa-solid fa-circle-notch fa-spin service-loading-icon"></i>
          <h3>Loading Service Details...</h3>
          <p>Connecting to travel service specifications.</p>
        </div>
      </main>
    );
  }

  if (!service) {
    return (
      <main className="service-product-page page-fade-in">
        <Breadcrumbs items={breadcrumbs} />
        <div className="card service-not-found-card">
          <div className="service-not-found-icon">
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          <h2>Service Item Not Found</h2>
          <p>The requested travel service listing is unavailable or has been archived.</p>
          <button className="btn-primary" onClick={() => navigate('/client')}>
            <i className="fa-solid fa-arrow-left"></i> Return to Services Store
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="service-product-page page-fade-in">
      <div className="service-page-nav-bar">
        <Breadcrumbs items={breadcrumbs} />
        <button
          type="button"
          className="btn-secondary service-back-btn"
          onClick={() => navigate('/client')}
        >
          <i className="fa-solid fa-arrow-left"></i> Back to Catalog
        </button>
      </div>

      {/* Main E-Commerce Product Layout Grid */}
      <div className="service-ecommerce-grid">
        
        {/* Left Column: Interactive Media Gallery */}
        <section className="service-gallery-card card">
          <div className="service-main-image-viewport">
            {galleryImages.length > 0 && (
              <img
                src={galleryImages[activeImageIndex]}
                alt={`${service.name} preview ${activeImageIndex + 1}`}
                className="service-main-display-img"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.service-gallery-fallback');
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            )}
            <div
              className="service-gallery-fallback"
              style={{ display: galleryImages.length > 0 ? 'none' : 'flex' }}
            >
              <i className={`${categoryIcon} service-fallback-icon`}></i>
              <span>{service.category || 'Travel Service'}</span>
            </div>

            {/* Overlaid Badges */}
            <div className="service-gallery-badges">
              <span className="service-badge-category">
                <i className={categoryIcon} style={{ marginRight: '0.375rem' }}></i>
                {service.category || 'General'}
              </span>
              {service.featured && (
                <span className="service-badge-featured">
                  <i className="fa-solid fa-star"></i> Featured
                </span>
              )}
            </div>

            {/* Navigation Arrows for Carousel */}
            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  className="gallery-nav-btn gallery-nav-btn--prev"
                  onClick={handlePrevImage}
                  title="Previous image"
                >
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
                <button
                  type="button"
                  className="gallery-nav-btn gallery-nav-btn--next"
                  onClick={handleNextImage}
                  title="Next image"
                >
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
                <div className="gallery-counter-pill">
                  {activeImageIndex + 1} / {galleryImages.length}
                </div>
              </>
            )}
          </div>

          {/* Thumbnails Row */}
          {galleryImages.length > 1 && (
            <div className="service-thumbnails-strip">
              {galleryImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`service-thumb-item ${activeImageIndex === idx ? 'active' : ''}`}
                  onClick={() => setActiveImageIndex(idx)}
                >
                  <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}

          {/* Quick Trust Badges Below Gallery */}
          <div className="service-trust-grid">
            <div className="service-trust-item">
              <i className="fa-solid fa-shield-halved"></i>
              <div>
                <strong>Secure Document Handling</strong>
                <span>Direct submission to authorized branch</span>
              </div>
            </div>
            <div className="service-trust-item">
              <i className="fa-solid fa-building-user"></i>
              <div>
                <strong>Branch Assistance</strong>
                <span>Assigned to certified Fairfly operator</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Product Overview & Actions */}
        <section className="service-details-card card">
          <div className="service-header-meta">
            <span className="service-header-category">
              <i className={categoryIcon}></i> {service.category || 'Travel Service'}
            </span>
            {turnaround && (
              <span className="service-turnaround-pill">
                <i className="fa-regular fa-clock"></i> Turnaround: {turnaround}
              </span>
            )}
          </div>

          <h1 className="service-main-title">{service.name}</h1>

          {/* Tag Badges */}
          {Array.isArray(service.tags) && service.tags.length > 0 && (
            <div className="service-tags-wrap">
              {service.tags.map((t, idx) => (
                <span key={idx} className="service-tag-pill">
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Price Box */}
          <div className="service-price-block">
            <div className="service-price-main">
              <span className="service-price-label">Service Processing Fee</span>
              <span className="service-price-amount">{formatPriceDisplay(service.price)}</span>
            </div>
            <span className="service-price-note">
              <i className="fa-solid fa-circle-check"></i> Includes initial document review & branch processing
            </span>
          </div>

          {/* Description Section */}
          <div className="service-section-box">
            <h3 className="service-section-title">
              <i className="fa-solid fa-circle-info"></i> Service Overview
            </h3>
            <p className="service-description-text">
              {service.description || 'No detailed description provided for this service yet.'}
            </p>
          </div>

          {/* Document Requirements Checklist */}
          <div className="service-section-box">
            <div className="service-section-title-row">
              <h3 className="service-section-title">
                <i className="fa-solid fa-clipboard-list"></i> Required Client Documents ({reqList.length})
              </h3>
            </div>

            {reqList.length === 0 ? (
              <p className="service-empty-reqs">
                No specific documents listed. General travel and identity requirements apply upon submission.
              </p>
            ) : (
              <ul className="service-reqs-checklist">
                {reqList.map((req, idx) => {
                  const reqName = typeof req === 'string' ? req : (req.name || req.title || `Requirement ${idx + 1}`);
                  const reqDesc = typeof req === 'object' ? req.description : '';
                  const attachment = typeof req === 'object' ? req.attachment : null;

                  return (
                    <li key={idx} className="service-req-item">
                      <div className="service-req-bullet">
                        <i className="fa-solid fa-check"></i>
                      </div>
                      <div className="service-req-info">
                        <span className="service-req-name">{reqName}</span>
                        {reqDesc && <span className="service-req-desc">{reqDesc}</span>}
                        {attachment?.url && (
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="service-req-download-link"
                          >
                            <i className="fa-solid fa-download"></i> Download Template / Form: {attachment.name || 'Sample File'}
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Primary Action Buttons Bar */}
          <div className="service-actions-cta-bar">
            <button
              type="button"
              className="btn-primary service-cta-primary-btn"
              onClick={() => setShowRequestModal(true)}
            >
              <i className="fa-solid fa-bag-shopping"></i>
              Request This Service Now
            </button>

            <button
              type="button"
              className="btn-secondary service-cta-secondary-btn"
              onClick={() => setShowAppointmentModal(true)}
            >
              <i className="fa-solid fa-calendar-plus"></i>
              Book Branch Appointment
            </button>

            <Link
              to="/messages"
              className="service-cta-chat-link"
            >
              <i className="fa-regular fa-comment-dots"></i> Questions? Chat with an operator
            </Link>
          </div>
        </section>
      </div>

      {/* Service Request Modal */}
      <ClientServiceRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onRequestSuccess={() => {
          setShowRequestModal(false);
          addToast('Service request submitted successfully! You can track it in your dashboard.', 'success');
          navigate('/client/tracking');
        }}
        initialServiceId={service.id}
      />

      {/* Appointment Booking Modal */}
      <ClientAppointmentForm
        isOpen={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        onAppointmentCreated={() => {
          setShowAppointmentModal(false);
          addToast('Appointment scheduled successfully!', 'success');
          navigate('/client/appointments');
        }}
      />
    </main>
  );
}
