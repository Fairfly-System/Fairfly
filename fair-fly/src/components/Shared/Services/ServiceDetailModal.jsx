import React, { useEffect } from 'react';
import './service-detail-modal.css';

/**
 * Helper to safely extract requirement text whether it is a string or an object { name, required }
 */
function getRequirementName(req, idx) {
  if (!req) return `Document ${idx + 1}`;
  if (typeof req === 'string') return req;
  return req.name || req.title || req.label || `Document ${idx + 1}`;
}

function isRequirementMandatory(req) {
  if (typeof req === 'object' && req !== null) {
    return req.required !== false;
  }
  return true;
}

function formatProcessingTime(processingTime) {
  if (!processingTime) return null;
  if (typeof processingTime === 'string') return processingTime;
  const { min, max, unit = 'days' } = processingTime;
  if (!min && !max) return null;
  if (min === max || !max) return `${min} ${unit}`;
  return `${min}-${max} ${unit}`;
}

function formatPriceDisplay(price) {
  if (!price) return '₱0.00';
  if (typeof price === 'string' && (price.startsWith('₱') || price.startsWith('PHP'))) {
    return price;
  }
  const num = typeof price === 'number' ? price : parseFloat(String(price).replace(/[^0-9.]/g, '')) || 0;
  return `₱${num.toLocaleString('en-US')}`;
}

/**
 * ServiceDetailModal — Clean e-commerce / Airbnb style detail view for services on the landing page.
 * Uses ONLY real data from the service object (no dummy inclusions or fake procedures).
 */
export default function ServiceDetailModal({
  isOpen,
  onClose,
  service,
  onAvailService,
}) {
  // ESC key listener & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !service) return null;

  const requirements = Array.isArray(service.requirements) ? service.requirements : [];
  const tags = Array.isArray(service.tags) ? service.tags : [];
  const turnaround = formatProcessingTime(service.processingTime);
  const priceDisplay = formatPriceDisplay(service.price);

  return (
    <div
      className="service-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-modal-title"
    >
      <div
        className="service-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          className="service-modal-close"
          onClick={onClose}
          aria-label="Close service details"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="service-modal-body">
          {/* Hero Media Banner */}
          <div className="service-modal-hero">
            <img
              src={service.coverImage || service.image || '/services/passport.jpg'}
              alt={service.name}
              className="service-modal-hero-img"
              onError={(e) => {
                e.currentTarget.src = service.fallbackImage || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1200&auto=format&fit=crop';
              }}
            />
            <div className="service-modal-hero-overlay">
              {service.category && (
                <div className="service-modal-badges-row">
                  <span className="service-modal-badge category">
                    {service.category}
                  </span>
                </div>
              )}
              <h2 id="service-modal-title" className="service-modal-hero-title">
                {service.name}
              </h2>
            </div>
          </div>

          {/* Content 2-Column Grid */}
          <div className="service-modal-content-grid">
            {/* Left Column: Real Service Details */}
            <div className="service-modal-main-col">
              {/* Description */}
              {service.description && (
                <div className="service-modal-section">
                  <h3 className="service-modal-section-title">
                    <i className="fa-solid fa-align-left"></i>
                    <span>Service Overview</span>
                  </h3>
                  <p className="service-modal-desc">{service.description}</p>
                </div>
              )}

              {/* Requirements Checklist (safely rendering strings or object names) */}
              {requirements.length > 0 && (
                <div className="service-modal-section">
                  <h3 className="service-modal-section-title">
                    <i className="fa-solid fa-list-check"></i>
                    <span>Required Documents & Inputs ({requirements.length})</span>
                  </h3>
                  <div className="service-requirements-list">
                    {requirements.map((req, idx) => {
                      const reqName = getRequirementName(req, idx);
                      const isMandatory = isRequirementMandatory(req);

                      return (
                        <div key={idx} className="service-req-item">
                          <i className="fa-regular fa-file-lines"></i>
                          <span className="service-req-name">{reqName}</span>
                          <span className={`service-req-pill ${isMandatory ? 'mandatory' : 'optional'}`}>
                            {isMandatory ? 'Required' : 'Optional'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tags (if any exist on the service) */}
              {tags.length > 0 && (
                <div className="service-modal-section">
                  <h3 className="service-modal-section-title">
                    <i className="fa-solid fa-tags"></i>
                    <span>Tags</span>
                  </h3>
                  <div className="service-tags-row">
                    {tags.map((tag, idx) => (
                      <span key={idx} className="service-tag-pill">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Sticky Booking Widget */}
            <div className="service-modal-booking-col">
              <aside className="service-booking-widget">
                <div className="service-booking-price-row">
                  <div>
                    <div className="service-booking-price-label">Starting fee</div>
                    <div className="service-booking-price-val">{priceDisplay}</div>
                  </div>
                </div>

                <div className="service-booking-meta-row">
                  {turnaround && (
                    <div className="service-booking-meta-item">
                      <i className="fa-regular fa-clock"></i>
                      <span>Estimated Processing: <strong>{turnaround}</strong></span>
                    </div>
                  )}
                  {requirements.length > 0 && (
                    <div className="service-booking-meta-item">
                      <i className="fa-solid fa-list-check"></i>
                      <span>Checklist: <strong>{requirements.length} {requirements.length === 1 ? 'item' : 'items'}</strong></span>
                    </div>
                  )}
                  {service.category && (
                    <div className="service-booking-meta-item">
                      <i className="fa-solid fa-layer-group"></i>
                      <span>Category: <strong>{service.category}</strong></span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="service-booking-avail-btn"
                  onClick={() => onAvailService(service)}
                >
                  <span>Avail Service</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </button>

                <button
                  type="button"
                  className="service-booking-secondary-btn"
                  onClick={onClose}
                >
                  <span>Close</span>
                </button>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
