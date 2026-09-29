import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import './image-lightbox.css';

/**
 * Universal helper to check if a URL or filename represents a viewable image
 * 
 * @param {string} url - File URL or storage URL
 * @param {string} [fileName=''] - File name or description
 * @returns {boolean}
 */
export const isImageUrl = (url = '', fileName = '') => {
  if (!url && !fileName) return false;
  const target = `${fileName || ''} ${url || ''}`.toLowerCase();
  return (
    /\.(png|jpe?g|webp|gif|svg|bmp|avif)(\?.*)?$/i.test(target) ||
    target.includes('image/') ||
    target.includes('client_ids') ||
    target.includes('announcement_photos') ||
    target.includes('.jpg') ||
    target.includes('.jpeg') ||
    target.includes('.png') ||
    target.includes('.webp') ||
    target.includes('.gif')
  );
};

/**
 * Universal Image Lightbox Modal for FairFly
 * Used for inspecting all User Generated Content (UGC) images, ID verifications, 
 * requirement attachments, chat photos, and announcement media without raw URL navigation.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the lightbox is open
 * @param {Function} props.onClose - Close callback
 * @param {string} [props.imageUrl] - Direct image URL (for single image mode)
 * @param {string} [props.title] - Title / caption for image
 * @param {string} [props.subtitle] - Contextual subtitle (e.g. "Front Side · Client ID")
 * @param {Array<Object|string>} [props.images=[]] - Array of images for gallery mode
 * @param {number} [props.activeIndex=0] - Active image index for gallery mode
 * @param {Function} [props.onNavigate] - Index navigation callback
 * @param {boolean} [props.downloadable=true] - Whether to allow direct file download
 * @param {boolean} [props.zoomable=true] - Whether to allow zoom in/out
 */
export default function ImageLightbox({
  isOpen,
  onClose,
  imageUrl,
  title,
  subtitle,
  images = [],
  activeIndex = 0,
  onNavigate,
  downloadable = true,
  zoomable = true
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const containerRef = useRef(null);

  // Normalize current photo data
  const hasList = Array.isArray(images) && images.length > 0;
  const count = hasList ? images.length : (imageUrl ? 1 : 0);
  const currentItem = hasList ? images[activeIndex] : null;

  const resolvedUrl = (currentItem
    ? (typeof currentItem === 'string' ? currentItem : (currentItem.url || currentItem.src || currentItem.previewUrl))
    : imageUrl) || '';

  const resolvedTitle = (currentItem
    ? (typeof currentItem === 'string' ? (title || 'Image Preview') : (currentItem.title || currentItem.name || currentItem.fileName || title || 'Image Preview'))
    : (title || 'Image Preview'));

  const resolvedSubtitle = (currentItem && typeof currentItem === 'object' && currentItem.subtitle)
    ? currentItem.subtitle
    : (subtitle || '');

  // Reset zoom on item switch or close
  useEffect(() => {
    setZoomLevel(1);
  }, [resolvedUrl, isOpen]);

  const handlePrev = useCallback(() => {
    if (count <= 1 || !onNavigate) return;
    onNavigate((activeIndex - 1 + count) % count);
  }, [activeIndex, count, onNavigate]);

  const handleNext = useCallback(() => {
    if (count <= 1 || !onNavigate) return;
    onNavigate((activeIndex + 1) % count);
  }, [activeIndex, count, onNavigate]);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(3, +(prev + 0.25).toFixed(2)));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(0.75, +(prev - 0.25).toFixed(2)));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  // Keyboard navigation & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, handlePrev, handleNext, onClose]);

  // Clean direct file download without opening new tabs
  const handleDownload = async () => {
    if (!resolvedUrl || isDownloading) return;
    setIsDownloading(true);

    try {
      const response = await fetch(resolvedUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const safeName = resolvedTitle.replace(/[/\\?%*:|"<>]/g, '-');
      const ext = resolvedUrl.split('?')[0].split('.').pop() || 'jpg';
      link.download = safeName.includes('.') ? safeName : `${safeName}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.warn('[ImageLightbox] Direct download failed, falling back to download link:', err);
      const link = document.createElement('a');
      link.href = resolvedUrl;
      link.download = resolvedTitle || 'image';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isOpen || !resolvedUrl) return null;

  return createPortal(
    <div
      className="ff-lightbox-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={resolvedTitle}
    >
      <div
        className="ff-lightbox-container"
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <header className="ff-lightbox-header">
          <div className="ff-lightbox-info">
            <div className="ff-lightbox-title-row">
              <i className="fa-regular fa-image ff-lightbox-icon"></i>
              <span className="ff-lightbox-title" title={resolvedTitle}>
                {resolvedTitle}
              </span>
              {count > 1 && (
                <span className="ff-lightbox-counter">
                  {activeIndex + 1} of {count}
                </span>
              )}
            </div>
            {resolvedSubtitle && (
              <span className="ff-lightbox-subtitle">{resolvedSubtitle}</span>
            )}
          </div>

          <div className="ff-lightbox-actions">
            {zoomable && (
              <>
                <button
                  type="button"
                  className="ff-lightbox-btn"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 0.75}
                  title="Zoom Out (-)"
                  aria-label="Zoom Out"
                >
                  <i className="fa-solid fa-magnifying-glass-minus"></i>
                </button>
                <span className="ff-lightbox-zoom-indicator">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  className="ff-lightbox-btn"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 3}
                  title="Zoom In (+)"
                  aria-label="Zoom In"
                >
                  <i className="fa-solid fa-magnifying-glass-plus"></i>
                </button>
                {zoomLevel !== 1 && (
                  <button
                    type="button"
                    className="ff-lightbox-btn"
                    onClick={handleResetZoom}
                    title="Reset Zoom (0)"
                    aria-label="Reset Zoom"
                  >
                    <i className="fa-solid fa-rotate-left"></i>
                  </button>
                )}
              </>
            )}

            {downloadable && (
              <button
                type="button"
                className="ff-lightbox-btn"
                onClick={handleDownload}
                disabled={isDownloading}
                title="Download Image File"
                aria-label="Download Image File"
              >
                <i className={isDownloading ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-download"}></i>
              </button>
            )}

            <button
              type="button"
              className="ff-lightbox-btn close"
              onClick={onClose}
              title="Close (Esc)"
              aria-label="Close Lightbox"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </header>

        {/* Viewport */}
        <main
          className={`ff-lightbox-viewport ${zoomLevel > 1 ? 'is-zoomed' : ''}`}
          onClick={zoomLevel > 1 ? handleResetZoom : undefined}
          title={zoomLevel > 1 ? "Click to reset zoom" : undefined}
        >
          {count > 1 && (
            <button
              type="button"
              className="ff-lightbox-nav-btn prev"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              aria-label="Previous Image"
              title="Previous (Left Arrow)"
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>
          )}

          <div
            className="ff-lightbox-image-wrap"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <img
              src={resolvedUrl}
              alt={resolvedTitle}
              className="ff-lightbox-img"
              draggable={false}
            />
          </div>

          {count > 1 && (
            <button
              type="button"
              className="ff-lightbox-nav-btn next"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              aria-label="Next Image"
              title="Next (Right Arrow)"
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          )}
        </main>

        {/* Footer info & shortcut hint */}
        <footer className="ff-lightbox-footer">
          <div className="ff-lightbox-hint">
            <i className="fa-regular fa-keyboard"></i>
            <span>
              Press <kbd className="ff-lightbox-kbd">Esc</kbd> to close
              {count > 1 && (
                <>
                  {' '}• <kbd className="ff-lightbox-kbd">←</kbd> <kbd className="ff-lightbox-kbd">→</kbd> to navigate
                </>
              )}
              {zoomable && (
                <>
                  {' '}• <kbd className="ff-lightbox-kbd">+</kbd> <kbd className="ff-lightbox-kbd">-</kbd> to zoom
                </>
              )}
            </span>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
}

/**
 * Global Lightbox Context & Provider
 * Allows any component in the application to trigger the root-level Lightbox
 * via `useLightbox()` without rendering the Lightbox as a child in its JSX.
 */
export const LightboxContext = createContext(null);

export const useLightbox = () => {
  const context = useContext(LightboxContext);
  if (!context) {
    throw new Error('useLightbox must be used within a LightboxProvider');
  }
  return context;
};

export function LightboxProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const openLightbox = useCallback((options, maybeTitle, maybeSubtitle) => {
    if (!options) return;
    if (typeof options === 'string') {
      setConfig({
        imageUrl: options,
        title: maybeTitle || 'Image Preview',
        subtitle: maybeSubtitle || ''
      });
      setActiveIndex(0);
    } else if (Array.isArray(options)) {
      setConfig({
        images: options,
        title: maybeTitle || 'Image Gallery',
        subtitle: maybeSubtitle || ''
      });
      setActiveIndex(0);
    } else {
      const initialIdx = options.activeIndex ?? options.initialIndex ?? 0;
      setConfig({
        ...options,
        imageUrl: options.imageUrl || options.url || options.src,
        title: options.title || maybeTitle,
        subtitle: options.subtitle || maybeSubtitle
      });
      setActiveIndex(initialIdx);
    }
  }, []);

  const closeLightbox = useCallback(() => {
    setConfig(null);
  }, []);

  const handleNavigate = useCallback((newIndex) => {
    setActiveIndex(newIndex);
    if (config?.onNavigate) {
      config.onNavigate(newIndex);
    }
  }, [config]);

  const value = {
    openLightbox,
    closeLightbox,
    isOpen: Boolean(config)
  };

  return (
    <LightboxContext.Provider value={value}>
      {children}
      {config && (
        <ImageLightbox
          isOpen={Boolean(config)}
          onClose={closeLightbox}
          imageUrl={config.imageUrl || config.url}
          title={config.title}
          subtitle={config.subtitle}
          images={config.images || []}
          activeIndex={activeIndex}
          onNavigate={handleNavigate}
          downloadable={config.downloadable ?? true}
          zoomable={config.zoomable ?? true}
        />
      )}
    </LightboxContext.Provider>
  );
}
