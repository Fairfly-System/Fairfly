import React from 'react';
import BaseModal from '../../../UI/ModalBase/BaseModal';

export default function IdPreviewModal({
  isOpen,
  onClose,
  imageUrl,
  title = 'Government ID',
  side = 'Front Side',
  idType = 'ID Document'
}) {
  if (!isOpen || !imageUrl) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${idType} — ${side}`}
      subtitle="High-resolution inspection view"
      maxWidth="56rem"
      width="94%"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
        <div
          style={{
            width: '100%',
            maxHeight: '68vh',
            overflow: 'auto',
            background: '#0f172a',
            borderRadius: 'var(--radius-md, 0.5rem)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            border: '1px solid #334155'
          }}
        >
          <img
            src={imageUrl}
            alt={`${title} - ${side}`}
            style={{
              maxWidth: '100%',
              maxHeight: '64vh',
              objectFit: 'contain',
              borderRadius: '0.25rem',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            flexWrap: 'wrap',
            gap: '0.75rem',
            paddingTop: '0.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                background: '#ede9fe',
                color: '#6b21a8',
                padding: '0.25rem 0.6rem',
                borderRadius: '9999px'
              }}
            >
              {side}
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-light, #64748b)' }}>
              {idType}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem' }}
            >
              <i className="fa-solid fa-arrow-up-right-from-square"></i>
              Open Full Size
            </a>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              style={{ fontSize: '0.8125rem' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
