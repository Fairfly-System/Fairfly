import React from 'react';

export default function AnnouncementPhotoGrid({ photos = [], onPhotoClick }) {
  if (!photos || photos.length === 0) return null;

  const count = Math.min(photos.length, 5);
  const displayPhotos = photos.slice(0, count);

  return (
    <div className={`fb-photo-grid fb-photo-grid--${count}`}>
      {displayPhotos.map((photo, idx) => {
        const url = typeof photo === 'string' ? photo : photo.url;
        const name = typeof photo === 'string' ? `Photo ${idx + 1}` : (photo.name || `Photo ${idx + 1}`);

        return (
          <div
            key={url || idx}
            className={`fb-photo-item fb-photo-item--${idx + 1}`}
            onClick={(e) => {
              e.stopPropagation();
              if (onPhotoClick) onPhotoClick(idx);
            }}
            title="Click to view full photo"
          >
            <img src={url} alt={name} loading="lazy" className="fb-photo-img" />
            <div className="fb-photo-overlay">
              <i className="fa-solid fa-magnifying-glass-plus"></i>
            </div>
          </div>
        );
      })}
    </div>
  );
}
