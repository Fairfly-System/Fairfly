import React from 'react';
import './skeleton.css';

/**
 * Primitive Skeleton component with shimmer animation.
 */
export default function Skeleton({
  variant = 'rect', // 'text' | 'title' | 'circle' | 'rect' | 'button' | 'badge'
  width,
  height,
  borderRadius,
  count = 1,
  className = '',
  style = {},
  ...props
}) {
  const elements = Array.from({ length: Math.max(1, count) });

  const customStyle = {
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    ...(borderRadius ? { borderRadius } : {}),
    ...style,
  };

  const variantClass = `skeleton-primitive--${variant}`;

  if (count === 1) {
    return (
      <div
        className={`skeleton skeleton-primitive ${variantClass} ${className}`.trim()}
        style={customStyle}
        aria-busy="true"
        aria-live="polite"
        {...props}
      />
    );
  }

  return (
    <>
      {elements.map((_, i) => (
        <div
          key={i}
          className={`skeleton skeleton-primitive ${variantClass} ${className}`.trim()}
          style={customStyle}
          aria-busy="true"
          aria-live="polite"
          {...props}
        />
      ))}
    </>
  );
}

/**
 * Skeleton Table Rows
 */
export function SkeletonTable({ columns = 5, rows = 5, selectable = false }) {
  const colArray = Array.from({ length: columns });
  const rowArray = Array.from({ length: rows });

  // Width variations for natural tabular appearance
  const getWidth = (idx) => {
    const widths = ['75%', '90%', '55%', '80%', '65%', '45%'];
    return widths[idx % widths.length];
  };

  return (
    <>
      {rowArray.map((_, rIdx) => (
        <tr key={`skel-row-${rIdx}`} className="skeleton-table-row">
          {selectable && (
            <td style={{ width: '3rem', textAlign: 'center' }}>
              <div
                className="skeleton skeleton-primitive"
                style={{ width: '1.125rem', height: '1.125rem', borderRadius: 'var(--radius-xs)', margin: '0 auto' }}
              />
            </td>
          )}
          {colArray.map((_, cIdx) => (
            <td key={`skel-cell-${rIdx}-${cIdx}`}>
              <div
                className="skeleton skeleton-primitive skeleton-cell-bar"
                style={{ width: getWidth(cIdx) }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/**
 * Skeleton Card Component (e.g. for grid listings)
 */
export function SkeletonCard({ count = 1, lines = 2, hasAvatar = true, className = '' }) {
  const cards = Array.from({ length: Math.max(1, count) });

  return (
    <>
      {cards.map((_, i) => (
        <article key={`skel-card-${i}`} className={`skeleton-composite-card ${className}`.trim()} aria-busy="true">
          {hasAvatar && (
            <div className="skeleton-card-header">
              <div
                className="skeleton skeleton-circle"
                style={{ width: '2.75rem', height: '2.75rem' }}
              />
              <div className="skeleton-card-header-text">
                <div className="skeleton skeleton-title" style={{ width: '65%', height: '1.125rem', margin: 0 }} />
                <div className="skeleton skeleton-text" style={{ width: '40%', height: '0.75rem', margin: 0 }} />
              </div>
            </div>
          )}

          {!hasAvatar && (
            <div className="skeleton skeleton-title" style={{ width: '55%', height: '1.25rem', marginBottom: '0.5rem' }} />
          )}

          <div className="skeleton-card-body">
            {Array.from({ length: lines }).map((_, lIdx) => (
              <div
                key={lIdx}
                className="skeleton skeleton-text"
                style={{ width: lIdx === lines - 1 ? '70%' : '100%', margin: 0 }}
              />
            ))}
          </div>

          <div className="skeleton-card-footer">
            <div className="skeleton skeleton-badge" style={{ width: '5rem', height: '1.25rem' }} />
            <div className="skeleton skeleton-btn" style={{ width: '4.5rem', height: '1.875rem' }} />
          </div>
        </article>
      ))}
    </>
  );
}

/**
 * Skeleton KPI Card (for dashboard metrics)
 */
export function SkeletonKpi({ count = 1, className = '' }) {
  const cards = Array.from({ length: Math.max(1, count) });

  return (
    <>
      {cards.map((_, i) => (
        <div key={`skel-kpi-${i}`} className={`skeleton-kpi-card ${className}`.trim()} aria-busy="true">
          <div className="skeleton-kpi-top">
            <div className="skeleton skeleton-text" style={{ width: '50%', height: '0.875rem', margin: 0 }} />
            <div className="skeleton skeleton-circle" style={{ width: '2.25rem', height: '2.25rem' }} />
          </div>
          <div className="skeleton skeleton-kpi-value" />
          <div className="skeleton-kpi-footer">
            <div className="skeleton skeleton-text" style={{ width: '60%', height: '0.75rem', margin: 0 }} />
          </div>
        </div>
      ))}
    </>
  );
}

/**
 * Skeleton Announcement Component (Facebook-style post feed card)
 */
export function SkeletonAnnouncement({ count = 3, className = '' }) {
  const items = Array.from({ length: Math.max(1, count) });

  return (
    <>
      {items.map((_, i) => (
        <article
          key={`skel-announcement-${i}`}
          className={`fb-post-card skeleton-announcement-card ${className}`.trim()}
          aria-busy="true"
        >
          {/* Header */}
          <div className="fb-post-header">
            <div className="fb-post-author-row">
              <div
                className="skeleton skeleton-circle"
                style={{ width: '2.75rem', height: '2.75rem', borderRadius: '50%' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div className="skeleton" style={{ width: '8.5rem', height: '1rem', borderRadius: 'var(--radius-xs)' }} />
                <div className="skeleton" style={{ width: '6rem', height: '0.75rem', borderRadius: 'var(--radius-xs)' }} />
              </div>
            </div>
            <div className="skeleton" style={{ width: '4.75rem', height: '1.25rem', borderRadius: 'var(--radius-full)' }} />
          </div>

          {/* Body */}
          <div className="fb-post-body">
            <div className="skeleton" style={{ width: '45%', height: '1.25rem', marginBottom: '0.5rem', borderRadius: 'var(--radius-xs)' }} />
            <div className="skeleton" style={{ width: '100%', height: '0.875rem', marginBottom: '0.35rem', borderRadius: 'var(--radius-xs)' }} />
            <div className="skeleton" style={{ width: '92%', height: '0.875rem', marginBottom: '0.35rem', borderRadius: 'var(--radius-xs)' }} />
            <div className="skeleton" style={{ width: '65%', height: '0.875rem', borderRadius: 'var(--radius-xs)' }} />
          </div>

          {/* Photo placeholder on first card */}
          {i === 0 && (
            <div
              className="skeleton"
              style={{ width: '100%', height: '16rem', borderRadius: 0 }}
            />
          )}

          {/* Footer */}
          <div className="fb-post-footer">
            <div className="skeleton" style={{ width: '5.5rem', height: '0.875rem', borderRadius: 'var(--radius-xs)' }} />
            <div className="skeleton" style={{ width: '6.5rem', height: '1.5rem', borderRadius: 'var(--radius-xs)' }} />
          </div>
        </article>
      ))}
    </>
  );
}
