import React, { useEffect, useCallback } from 'react';

export default function AnnouncementLightbox({ isOpen, photos = [], activeIndex = 0, onClose, onNavigate }) {
  const count = photos.length;
  const currentPhoto = photos[activeIndex];

  const handlePrev = useCallback(() => {
    if (count <= 1) return;
    onNavigate((activeIndex - 1 + count) % count);
  }, [activeIndex, count, onNavigate]);

  const handleNext = useCallback(() => {
    if (count <= 1) return;
    onNavigate((activeIndex + 1) % count);
  }, [activeIndex, count, onNavigate]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handlePrev, handleNext, onClose]);

  if (!isOpen || !currentPhoto) return null;

  const photoUrl = typeof currentPhoto === 'string' ? currentPhoto : currentPhoto.url;
  const photoName = typeof currentPhoto === 'string' ? 'Announcement Photo' : (currentPhoto.name || 'Announcement Photo');

  return (
    <div className="fb-lightbox-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="fb-lightbox-container" onClick={(e) => e.stopPropagation()}>
        {/* Top bar */}
        <div className="fb-lightbox-header">
          <div className="fb-lightbox-title">
            <i className="fa-regular fa-image"></i>
            <span>{photoName}</span>
            {count > 1 && (
              <span className="fb-lightbox-counter">
                ({activeIndex + 1} of {count})
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <a
              href={photoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="fb-lightbox-action-btn"
              title="Open full size in new tab"
            >
              <i className="fa-solid fa-arrow-up-right-from-square"></i>
            </a>
            <button
              type="button"
              className="fb-lightbox-close-btn"
              onClick={onClose}
              aria-label="Close preview"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        {/* Image viewport */}
        <div className="fb-lightbox-content">
          {count > 1 && (
            <button
              type="button"
              className="fb-lightbox-nav-btn prev"
              onClick={handlePrev}
              aria-label="Previous photo"
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>
          )}

          <div className="fb-lightbox-image-wrap">
            <img
              src={photoUrl}
              alt={photoName}
              className="fb-lightbox-image"
            />
          </div>

          {count > 1 && (
            <button
              type="button"
              className="fb-lightbox-nav-btn next"
              onClick={handleNext}
              aria-label="Next photo"
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
