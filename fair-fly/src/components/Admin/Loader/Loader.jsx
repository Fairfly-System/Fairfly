import React from 'react';
import './loader.css';

/**
 * Universal Skeleton Loader for Admin Panel components.
 */
export default function Loader({ text }) {
  return (
    <div className="loader-container" aria-busy="true">
      <div
        className="skeleton"
        style={{
          width: '100%',
          minHeight: '14rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
        }}
      />
      {text && (
        <p style={{ color: 'var(--text-mid)', fontSize: '0.875rem', fontWeight: 600, marginTop: '0.5rem' }}>
          {text}
        </p>
      )}
    </div>
  );
}
