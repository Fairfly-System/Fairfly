import React from 'react';
import './page-header.css';

/**
 * PageHeader — reusable page header for table/data pages with semantic header & image loading controls.
 *
 * Props:
 *  title             {string}          — Main page title
 *  subtitle          {string}          — Descriptive subtitle text
 *  illustrationSrc   {string}          — Optional image path for travel-themed header artwork
 *  primaryAction     {Object}          — Optional configuration for main action button
 *    label           {string}
 *    icon            {string}          — FontAwesome icon class
 *    onClick         {Function}
 *  children          {React.ReactNode} — Optional inline content (e.g., search bar or filters)
 */
export default function PageHeader({
  title,
  subtitle,
  illustrationSrc,
  primaryAction,
  children,
}) {
  return (
    <header className="page-header card">
      <div className="page-header-content">
        <div className="page-header-text">
          <h1 className="page-header-title">{title}</h1>
          {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
        </div>

        {primaryAction && (
          <div className="page-header-actions">
            <button
              className="btn-primary page-header-btn"
              onClick={primaryAction.onClick}
            >
              {primaryAction.icon && <i className={primaryAction.icon}></i>}
              {primaryAction.label}
            </button>
          </div>
        )}

        {children && <div className="page-header-controls">{children}</div>}
      </div>

      {illustrationSrc && (
        <div className="page-header-illustration">
          <img
            src={illustrationSrc}
            alt=""
            aria-hidden="true"
            loading="eager"
            decoding="async"
          />
        </div>
      )}
    </header>
  );
}
