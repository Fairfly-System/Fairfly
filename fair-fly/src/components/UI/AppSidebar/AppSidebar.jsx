import React from 'react';
import { NavLink } from 'react-router';
import { useAuthContext } from '../../../context/AuthContext';
import { useNotifications } from '../../../context/NotificationContext';
import './app-sidebar.css';

/**
 * AppSidebar — unified clean SaaS sidebar navigation with per-tab notification badges.
 *
 * Props:
 *  portalName        {string}  — "Admin" / "Operator" / "Client"
 *  portalSubtitle    {string}  — Subtitle text under brand name
 *  navLinks          {Array<{ to: string, icon: string, label: string, end?: boolean, notificationCount?: number }>}
 *  tabNotifications  {Object}  — Optional dictionary mapping path or label to notification count
 *  isOpen            {boolean} — mobile sidebar visibility
 *  onClose           {Function} — close sidebar callback
 */
export default function AppSidebar({
  portalName,
  portalSubtitle,
  navLinks = [],
  tabNotifications,
  isOpen,
  onClose,
}) {
  const { user, userDetails } = useAuthContext();
  const { notifications, clearNotificationsForTab } = useNotifications();

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
    if (role === 'admin') {
      const isSuper =
        userDetails?.isSuperAdmin === true ||
        userDetails?.email === 'admin@gmail.com' ||
        user?.email === 'admin@gmail.com';
      return isSuper ? 'Super Administrator' : 'Support Administrator';
    }
    if (role === 'operator') return 'Operator Account';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const profileName =
    userDetails?.name ||
    (portalName === 'Operator' && userDetails?.branchName) ||
    user?.email ||
    `${portalName} User`;

  /**
   * Resolve notification count for a tab:
   * 1. Direct link prop (`link.notificationCount`, `link.notifCount`, `link.badge`, `link.notifications`)
   * 2. `tabNotifications` map prop by route path or slug
   * 3. Fallback to automated count from NotificationContext unread items
   */
  const getTabNotificationCount = (link) => {
    // 1. Direct link prop
    if (typeof link.notificationCount === 'number') return link.notificationCount;
    if (typeof link.notifCount === 'number') return link.notifCount;
    if (typeof link.notifications === 'number') return link.notifications;
    if (typeof link.badge === 'number') return link.badge;

    // 2. tabNotifications map prop (if explicitly provided and > 0)
    if (tabNotifications) {
      if (typeof tabNotifications[link.to] === 'number' && tabNotifications[link.to] > 0) return tabNotifications[link.to];
      const slug = link.to.split('/').filter(Boolean).pop();
      if (slug && typeof tabNotifications[slug] === 'number' && tabNotifications[slug] > 0) return tabNotifications[slug];
      if (typeof tabNotifications[link.label] === 'number' && tabNotifications[link.label] > 0) return tabNotifications[link.label];
    }

    // 3. Automated count from NotificationContext unread items
    if (Array.isArray(notifications) && notifications.length > 0) {
      const unreadList = notifications.filter((n) => !n.read);
      const linkPath = link.to.toLowerCase();
      const tabSlug = linkPath.split('/').filter(Boolean).pop() || '';
      const isPortalRoot = link.end === true || linkPath === '/operator' || linkPath === '/admin' || linkPath === '/client';

      const matchedCount = unreadList.filter((notif) => {
        const notifLink = (notif.link || '').toLowerCase();
        const notifType = (notif.type || '').toLowerCase();

        // Portal Root / Dashboard: Never greedily capture subroute notifications
        if (isPortalRoot) {
          return notifLink === linkPath && (notifType === 'system' || notifType === 'dashboard');
        }

        // Subroute tab: match if link explicitly targets this tab or subpath
        if (notifLink && (notifLink === linkPath || notifLink.startsWith(linkPath + '/') || notifLink.startsWith(linkPath + '?'))) {
          return true;
        }

        // Match by notification type to tab slug
        if (notifType) {
          if (tabSlug.includes(notifType) || (notifType === 'service' && tabSlug.includes('workflow'))) return true;
          if (notifType === 'franchise' && tabSlug.includes('franchise')) return true;
          if (notifType === 'appointment' && tabSlug.includes('appointment')) return true;
          if (notifType === 'ticket' && tabSlug.includes('ticket')) return true;
          if (notifType === 'message' && tabSlug.includes('message')) return true;
          if (notifType === 'resource' && tabSlug.includes('resource')) return true;
          if (notifType === 'inquiry' && (tabSlug.includes('inquir') || tabSlug.includes('inquiry-forms'))) return true;
          if (notifType === 'quotation' && tabSlug.includes('quotation')) return true;
        }
        return false;
      }).length;

      if (matchedCount > 0) return matchedCount;
    }

    return 0;
  };

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
            src="/favicon1.png"
            alt="Fairfly Logo"
            loading="eager"
            decoding="async"
            width="28"
            height="28"
          />
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-title">Fairfly {portalName}</span>
            <span className="sidebar-brand-subtitle">{portalSubtitle}</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-links">
          {navLinks.map((link, index) => {
            const notifCount = getTabNotificationCount(link);
            const badgeDisplay = notifCount > 9 ? '9+' : notifCount;

            return (
              <NavLink
                key={index}
                to={link.to}
                end={link.end}
                onClick={() => {
                  if (clearNotificationsForTab) {
                    clearNotificationsForTab(link.to);
                  }
                  if (onClose) onClose();
                }}
                className={({ isActive }) => `sidebar-link-item ${isActive ? 'active' : ''}`}
              >
                <i className={link.icon}></i>
                <span className="sidebar-link-label">{link.label}</span>
                {notifCount > 0 && (
                  <span
                    className="sidebar-tab-badge"
                    aria-label={`${notifCount} unread notifications`}
                    title={`${notifCount} unread notifications`}
                  >
                    {badgeDisplay}
                  </span>
                )}
              </NavLink>
            );
          })}
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
