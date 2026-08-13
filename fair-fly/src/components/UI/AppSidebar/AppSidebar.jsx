import React from 'react';
import { NavLink } from 'react-router';
import { useAuthContext } from '../../../context/AuthContext';
import './app-sidebar.css';

/**
 * AppSidebar — unified sidebar navigation for all portals.
 *
 * Props:
 *  portalName      {string}  — "Admin" / "Operator" / "Client"
 *  portalSubtitle  {string}  — Subtitle text under brand name
 *  navLinks        {Array<{ to: string, icon: string, label: string, end?: boolean }>}
 *  isOpen          {boolean} — mobile sidebar visibility
 *  onClose         {Function} — close sidebar callback
 */
export default function AppSidebar({
  portalName,
  portalSubtitle,
  navLinks = [],
  isOpen,
  onClose,
}) {
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
    return portalName === 'Admin' ? 'A' : 'OP';
  };

  /** Humanize branch name or role for display */
  const displayRole = () => {
    if (portalName === 'Operator' && userDetails?.branchName) {
      return userDetails.branchName;
    }
    const role = userDetails?.role || (portalName === 'Admin' ? 'admin' : 'operator');
    if (role === 'admin') return 'Super Administrator';
    if (role === 'operator') return 'Operator Account';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const profileName =
    userDetails?.name ||
    (portalName === 'Operator' && userDetails?.branchName) ||
    user?.email ||
    `${portalName} User`;

  return (
    <>
      {/* Backdrop overlay — mobile only */}
      <div
        className={`sidebar-backdrop ${isOpen ? 'sidebar-backdrop--visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`app-sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        {/* Close button — mobile only */}
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Brand Header */}
        <div className="sidebar-brand">
          <img
            src="/FairflyLogo.png"
            alt="Fairfly Logo"
            loading="eager"
            decoding="async"
            width="32"
            height="32"
          />
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-title">Fairfly {portalName}</span>
            <span className="sidebar-brand-subtitle">{portalSubtitle}</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-links">
          {navLinks.map((link, index) => (
            <NavLink
              key={index}
              to={link.to}
              end={link.end}
              onClick={onClose}
            >
              <i className={link.icon}></i>
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Profile Box at bottom */}
        <div className="sidebar-profile">
          <div className="sidebar-profile-avatar">{getInitials()}</div>
          <div className="sidebar-profile-info">
            <span className="sidebar-profile-name">{profileName}</span>
            <span className="sidebar-profile-role">{displayRole()}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
