import React from 'react';
import { Link } from 'react-router';
import './breadcrumbs.css';

/**
 * Breadcrumbs — reusable breadcrumb navigation.
 *
 * Props:
 *  items {Array<{ label: string, to?: string }>} — breadcrumb trail
 */
export default function Breadcrumbs({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol className="breadcrumbs-list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="breadcrumbs-item">
              {!isLast && item.to ? (
                <Link to={item.to} className="breadcrumbs-link">
                  {item.label}
                </Link>
              ) : (
                <span className="breadcrumbs-current" aria-current="page">
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span className="breadcrumbs-separator" aria-hidden="true">
                  <i className="fa-solid fa-chevron-right"></i>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
