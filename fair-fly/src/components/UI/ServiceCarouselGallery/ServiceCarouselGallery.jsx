import React, { useState, useMemo, useEffect, useCallback } from 'react';
import './service-carousel-gallery.css';

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

export default function ServiceCarouselGallery({ service }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Aggregate cover image and carousel images into a clean, deduplicated array
  const galleryImages = useMemo(() => {
    if (!service) return [];
    const list = [];
    const cover = service.coverImage || service.coverPhoto || service.coverPhotoUrl;
    if (cover && typeof cover === 'string') {
      list.push(cover);
    }

    if (Array.isArray(service.carouselImages)) {
      service.carouselImages.forEach((img) => {
        const url = typeof img === 'string' ? img : img?.url || img?.previewUrl;
        if (url && typeof url === 'string' && !list.includes(url)) {
          list.push(url);
        }
      });
    }

    return list;
  }, [service]);

  // Keep index within bounds if gallery changes
  useEffect(() => {
    if (activeImageIndex >= galleryImages.length) {
      setActiveImageIndex(0);
    }
  }, [galleryImages, activeImageIndex]);

  const handlePrev = useCallback((e) => {
    if (e) e.stopPropagation();
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
  }, [galleryImages.length]);

  const handleNext = useCallback((e) => {
    if (e) e.stopPropagation();
    setActiveImageIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0));
  }, [galleryImages.length]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, handlePrev, handleNext]);

  const categoryKey = (service?.category || '').toLowerCase();
  const categoryIcon = CATEGORY_ICON_MAP[categoryKey] || 'fa-solid fa-concierge-bell';
  const hasImages = galleryImages.length > 0;
  const currentImageUrl = hasImages ? galleryImages[activeImageIndex] : null;

  return (
    <div className="service-carousel-gallery">
      {/* Main Display Stage */}
      <div
        className="service-gallery-stage"
        onClick={() => hasImages && setIsLightboxOpen(true)}
        title={hasImages ? 'Click to view full-resolution image' : undefined}
      >
        {hasImages ? (
          <img
            key={currentImageUrl}
            src={currentImageUrl}
            alt={`${service?.name || 'Service'} - Image ${activeImageIndex + 1}`}
            className="service-gallery-main-img"
            loading="eager"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.parentElement?.querySelector('.service-gallery-fallback');
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}

        {/* Fallback Banner when no image is available */}
        {!hasImages && (
          <div className="service-gallery-fallback">
            <i className={`${categoryIcon} service-gallery-fallback-icon`}></i>
            <span className="service-gallery-fallback-text">
              {service?.category || 'FairFly Travel & Document Service'}
            </span>
          </div>
        )}

        {/* Overlay Badges */}
        <div className="service-gallery-overlay">
          <span className="service-gallery-category-pill">
            <i className={categoryIcon}></i>
            {service?.category || 'General Services'}
          </span>

          <div className="service-gallery-badges-right">
            {service?.featured && (
              <span className="service-gallery-featured-pill">
                <i className="fa-solid fa-star"></i> Featured on Store
              </span>
            )}
            {hasImages && (
              <span className="service-gallery-zoom-pill">
                <i className="fa-solid fa-magnifying-glass-plus"></i> Click to Zoom
              </span>
            )}
          </div>
        </div>

        {/* Previous & Next Navigation Buttons */}
        {galleryImages.length > 1 && (
          <>
            <button
              type="button"
              className="service-gallery-nav-btn service-gallery-nav-prev"
              onClick={handlePrev}
              aria-label="Previous photo"
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <button
              type="button"
              className="service-gallery-nav-btn service-gallery-nav-next"
              onClick={handleNext}
              aria-label="Next photo"
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>

            <div className="service-gallery-counter-pill">
              <i className="fa-regular fa-images"></i> {activeImageIndex + 1} / {galleryImages.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails Navigation Strip */}
      {galleryImages.length > 1 && (
        <div className="service-gallery-thumbs-wrapper">
          <div className="service-gallery-thumbs-header">
            <span className="service-gallery-thumbs-title">
              <i className="fa-regular fa-images"></i> Service Photos ({galleryImages.length})
            </span>
            <span className="service-gallery-thumbs-subtitle">
              Click thumbnail to preview
            </span>
          </div>

          <div className="service-gallery-thumbs-strip">
            {galleryImages.map((imgUrl, idx) => (
              <button
                key={idx}
                type="button"
                className={`service-gallery-thumb-item ${activeImageIndex === idx ? 'active' : ''}`}
                onClick={() => setActiveImageIndex(idx)}
                aria-label={`View photo ${idx + 1}`}
              >
                <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} />
                {idx === 0 && <span className="service-gallery-thumb-tag">Cover</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && hasImages && (
        <div
          className="service-lightbox-backdrop"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="service-lightbox-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="service-lightbox-close-btn"
              onClick={() => setIsLightboxOpen(false)}
              aria-label="Close full view"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div className="service-lightbox-content">
              <img
                src={currentImageUrl}
                alt={`${service?.name || 'Service'} - High Resolution Photo ${activeImageIndex + 1}`}
                className="service-lightbox-img"
              />
            </div>

            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  className="service-lightbox-nav-btn service-lightbox-nav-prev"
                  onClick={handlePrev}
                  aria-label="Previous image"
                >
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
                <button
                  type="button"
                  className="service-lightbox-nav-btn service-lightbox-nav-next"
                  onClick={handleNext}
                  aria-label="Next image"
                >
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
              </>
            )}

            <div className="service-lightbox-footer">
              <span className="service-lightbox-title">{service?.name}</span>
              <span className="service-lightbox-counter">
                Photo {activeImageIndex + 1} of {galleryImages.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
