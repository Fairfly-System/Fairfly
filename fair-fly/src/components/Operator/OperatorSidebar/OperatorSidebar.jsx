import React from 'react';
import './operator-sidebar.css';
import { NavLink } from 'react-router';
import { useAuthContext } from '../../../context/AuthContext';

export default function OperatorSidebar({ isOpen, onClose }) {
  const { user, userDetails } = useAuthContext();

  /** Derive initials for avatar fallback */
  const getInitials = () => {
    if (userDetails?.name) {
      return userDetails.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) return user.email[0].toUpperCase();
    return 'OP';
  };

  /** Humanize branch name or role for display */
  const displayRole = () => {
    if (userDetails?.branchName) return userDetails.branchName;
    const role = userDetails?.role || 'operator';
    return role.charAt(0).toUpperCase() + role.slice(1) + ' Account';
  };

  return (
    <>
      {/* Backdrop overlay — mobile only */}
      <div
        className={`sidebar-backdrop ${isOpen ? 'sidebar-backdrop--visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`op-sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        {/* Close button — mobile only */}
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Brand Header */}
        <div className="sidebar-brand">
          <img src="/FairflyLogo.png" alt="Fairfly Logo" />
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-title">Fairfly Operator</span>
            <span className="sidebar-brand-subtitle">Branch Operations</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-links">
          <NavLink to="/operator" end onClick={onClose}>
            <i className="fa-solid fa-table-cells-large"></i>
            Dashboard
          </NavLink>

          <NavLink to="/operator/appointments" onClick={onClose}>
            <i className="fa-regular fa-calendar"></i>
            Appointments
          </NavLink>

          <NavLink to="/operator/inquiry-forms" onClick={onClose}>
            <i className="fa-solid fa-file-pen"></i>
            Inquiry Forms
          </NavLink>

          <NavLink to="/operator/quotations" onClick={onClose}>
            <i className="fa-solid fa-file-invoice-dollar"></i>
            Quotations
          </NavLink>

          <NavLink to="/operator/tickets" onClick={onClose}>
            <i className="fa-solid fa-ticket"></i>
            Tickets
          </NavLink>

          <NavLink to="/operator/quick-links" onClick={onClose}>
            <i className="fa-solid fa-globe"></i>
            Quick Links
          </NavLink>

          <NavLink to="/operator/history" onClick={onClose}>
            <i className="fa-solid fa-clock-rotate-left"></i>
            History
          </NavLink>
        </nav>

        {/* Operator Profile Box at bottom */}
        <div className="sidebar-profile">
          <div className="sidebar-profile-avatar">{getInitials()}</div>
          <div className="sidebar-profile-info">
            <span className="sidebar-profile-name">
              {userDetails?.name || userDetails?.branchName || user?.email || 'Operator User'}
            </span>
            <span className="sidebar-profile-role">{displayRole()}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
