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
      <main className="record-detail-layout page-fade-in">
        {breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
        <div className="record-detail-card card loading-card">
          <div className="spinner-box">
            <i className="fa-solid fa-circle-notch fa-spin spinner-icon"></i>
            <p>Loading details...</p>
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
