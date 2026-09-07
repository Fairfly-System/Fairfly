import React from 'react';
import { Link } from 'react-router';
import Breadcrumbs from '../Breadcrumbs/Breadcrumbs';
import './record-detail-layout.css';

/**
 * RecordDetailLayout — reusable page layout for record details.
 * Handles loading state, not found state, action headers, and layouts.
 */
export default function RecordDetailLayout({
  title,
  subtitle,
  status,
  statusType, // 'success', 'warning', 'danger', 'info', 'neutral'
  breadcrumbs = [],
  backTo,
  backLabel = 'Back',
  actions = [], // Array of { label, icon, onClick, className, disabled }
  thumbnail, // Image URL string or React element
  avatarIcon, // Fallback icon class if thumbnail fails to load or is not provided
  isLoading = false,
  isNotFound = false,
  notFoundMessage = 'The requested record could not be found or has been removed.',
  children,
}) {
  if (isLoading) {
    return (
      <main className="record-detail-layout page-fade-in" aria-busy="true">
        {breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}

        <div className="record-detail-nav-back">
          <div className="skeleton skeleton-btn" style={{ width: '5.5rem', height: '2.125rem' }} />
        </div>

        <div className="record-detail-container">
          {/* Header Card Skeleton */}
          <header className="record-detail-header-card card">
            <div className="record-header-left">
              <div
                className="skeleton skeleton-circle"
                style={{ width: '4rem', height: '4rem' }}
              />
              <div className="record-header-titles" style={{ flex: 1 }}>
                <div className="skeleton skeleton-title" style={{ width: '45%', height: '1.5rem', marginBottom: '0.5rem' }} />
                <div className="skeleton skeleton-text" style={{ width: '30%', height: '0.875rem', marginBottom: '0.625rem' }} />
                <div className="skeleton skeleton-badge" style={{ width: '5.5rem', height: '1.25rem' }} />
              </div>
            </div>
            <div className="record-header-actions">
              <div className="skeleton skeleton-btn" style={{ width: '7rem', height: '2.25rem' }} />
            </div>
          </header>

          {/* Content Card Skeleton */}
          <div className="record-detail-card card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <div className="skeleton skeleton-title" style={{ width: '25%', height: '1.25rem', marginBottom: '1rem' }} />
              <div className="skeleton skeleton-text" style={{ width: '100%', height: '1rem' }} />
              <div className="skeleton skeleton-text" style={{ width: '92%', height: '1rem' }} />
              <div className="skeleton skeleton-text" style={{ width: '78%', height: '1rem' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))', gap: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <div>
                <div className="skeleton skeleton-text" style={{ width: '40%', height: '0.75rem', marginBottom: '0.5rem' }} />
                <div className="skeleton skeleton-text" style={{ width: '70%', height: '1.125rem' }} />
              </div>
              <div>
                <div className="skeleton skeleton-text" style={{ width: '40%', height: '0.75rem', marginBottom: '0.5rem' }} />
                <div className="skeleton skeleton-text" style={{ width: '65%', height: '1.125rem' }} />
              </div>
              <div>
                <div className="skeleton skeleton-text" style={{ width: '40%', height: '0.75rem', marginBottom: '0.5rem' }} />
                <div className="skeleton skeleton-text" style={{ width: '80%', height: '1.125rem' }} />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (isNotFound) {
    const notFoundBreadcrumbs = backTo 
      ? [...breadcrumbs.slice(0, -1), { label: 'Not Found' }]
      : breadcrumbs;

    return (
      <main className="record-detail-layout page-fade-in">
        {notFoundBreadcrumbs.length > 0 && <Breadcrumbs items={notFoundBreadcrumbs} />}
        <div className="record-detail-card card not-found-card">
          <div className="not-found-content">
            <i className="fa-solid fa-triangle-exclamation warning-icon"></i>
            <h2>Record Not Found</h2>
            <p>{notFoundMessage}</p>
            {backTo && (
              <Link to={backTo} className="btn-primary back-link-btn">
                <i className="fa-solid fa-arrow-left"></i> {backLabel}
              </Link>
            )}
          </div>
        </div>
      </main>
    );
  }

  const getStatusClass = () => {
    switch (statusType) {
      case 'success':
        return 'status-pill-active';
      case 'warning':
        return 'status-pill-pending';
      case 'danger':
        return 'status-pill-disabled';
      case 'info':
        return 'status-pill-info';
      default:
        return 'status-pill-neutral';
    }
  };

  return (
    <main className="record-detail-layout page-fade-in">
      {breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}

      <div className="record-detail-nav-back">
        {backTo && (
          <Link to={backTo} className="detail-back-btn">
            <i className="fa-solid fa-arrow-left"></i> {backLabel}
          </Link>
        )}
      </div>

      <div className="record-detail-container">
        {/* Record Header Card */}
        <header className="record-detail-header-card card">
          <div className="record-header-left">
            {(thumbnail || avatarIcon) && (
              <div className="record-header-thumbnail-wrapper">
                {typeof thumbnail === 'string' && thumbnail ? (
                  <img
                    src={thumbnail}
                    alt={title || 'Thumbnail'}
                    className="record-header-thumbnail-img"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.nextElementSibling) {
                        e.currentTarget.nextElementSibling.style.display = 'flex';
                      }
                    }}
                  />
                ) : (
                  React.isValidElement(thumbnail) ? thumbnail : null
                )}
                <div
                  className="record-header-thumbnail-fallback"
                  style={{ display: typeof thumbnail === 'string' && thumbnail ? 'none' : 'flex' }}
                >
                  <i className={`${avatarIcon || 'fa-solid fa-layer-group'} record-header-thumbnail-icon`}></i>
                </div>
              </div>
            )}

            <div className="record-header-info">
              <h1>{title}</h1>
              {subtitle && <p className="record-subtitle">{subtitle}</p>}
            </div>
            {status && (
              <span className={`status-pill ${getStatusClass()}`}>
                {status}
              </span>
            )}
          </div>

          {actions.length > 0 && (
            <div className="record-header-actions">
              {actions.map((act, index) => (
                <button
                  key={index}
                  className={`btn ${act.className || 'btn-secondary'}`}
                  onClick={act.onClick}
                  disabled={act.disabled}
                >
                  {act.icon && <i className={`${act.icon} btn-icon`}></i>}
                  {act.label}
                </button>
              ))}
            </div>
          )}
        </header>

        {/* Content Body */}
        <div className="record-detail-content">
          {children}
        </div>
      </div>
    </main>
  );
}
