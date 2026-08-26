import React, { useState, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebase';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../toast/ToastProvider';
import BaseModal from '../ModalBase/BaseModal';
import AnnouncementsModal from '../../Shared/AnnouncementsModal/AnnouncementsModal';
import NotificationBell from '../NotificationBell/NotificationBell';
import './app-navbar.css';

/**
 * AppNavbar — unified top navbar for Admin, Operator, and Client portals.
 */
export default function AppNavbar({
  portalName,
  portalSubtitle,
  onMenuToggle,
  showSidebarOffset = true,
}) {
  const navigate = useNavigate();
  const { user, userDetails } = useAuthContext();
  const { addToast } = useToast();
  const logoutModalRef = useRef(null);
  const [isAnnouncementsOpen, setIsAnnouncementsOpen] = useState(false);
  const [isClientMobileMenuOpen, setIsClientMobileMenuOpen] = useState(false);

  const handleLogoutConfirm = async () => {
    try {
      await signOut(auth);
      addToast('Logged out successfully!', 'success');
      navigate('/');
    } catch (error) {
      addToast('Logout failed: ' + error.message, 'error');
    }
  };

  const handleLogoutClick = (e) => {
    e.preventDefault();
    logoutModalRef.current?.openModal();
  };

  const isClient = portalName === 'Client';

  return (
    <header className="app-navbar-wrapper">
      <nav className={`app-nav ${showSidebarOffset ? 'app-nav--offset' : ''}`}>
        <div className="app-nav-left">
          {/* Hamburger menu trigger — for Admin & Operator */}
          {!isClient && (
            <button
              className="app-hamburger"
              onClick={onMenuToggle}
              aria-label="Toggle navigation menu"
            >
              <i className="fa-solid fa-bars"></i>
            </button>
          )}

          {/* Client Mobile Menu Toggle */}
          {isClient && (
            <button
              className="app-hamburger client-mobile-toggle"
              onClick={() => setIsClientMobileMenuOpen(!isClientMobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              <i className={isClientMobileMenuOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'}></i>
            </button>
          )}

          {/* Render Brand Logo & Title on Client portal only */}
          {isClient && (
            <>
              <NavLink to="/client" className="app-nav-brand" aria-label="Fairfly Client Home">
                <img
                  src="/fairfly_logo.png"
                  alt="FairFly Logo"
                  className="app-nav-logo"
                  width="42"
                  height="42"
                  loading="eager"
                />
              </NavLink>

              <div className="app-nav-brand-text">
                <p id="top-title">Fairfly {portalName}</p>
                {portalSubtitle && <p id="down-title">{portalSubtitle}</p>}
              </div>
            </>
          )}
        </div>

        {/* Client Portal Navigation Links (Desktop) */}
        {isClient && (
          <div className="client-nav-links-desktop">
            <NavLink
              to="/client"
              end
              className={({ isActive }) => `client-nav-link ${isActive ? 'active' : ''}`}
            >
              <i className="fa-solid fa-store"></i>
              <span>Services Store</span>
            </NavLink>

            <NavLink
              to="/client/tracking"
              className={({ isActive }) => `client-nav-link ${isActive ? 'active' : ''}`}
            >
              <i className="fa-solid fa-list-check"></i>
              <span>Track Requests</span>
            </NavLink>

            <NavLink
              to="/client/appointments"
              className={({ isActive }) => `client-nav-link ${isActive ? 'active' : ''}`}
            >
              <i className="fa-solid fa-calendar-check"></i>
              <span>Appointments</span>
            </NavLink>

            <NavLink
              to="/client/messages"
              className={({ isActive }) => `client-nav-link ${isActive ? 'active' : ''}`}
            >
              <i className="fa-solid fa-comments"></i>
              <span>Messages</span>
            </NavLink>
          </div>
        )}

        <div className="app-nav-actions">
          {/* Notification Bell */}
          <NotificationBell />

          {/* Render Announcements for Admin & Operator only */}
          {!isClient && (
            <button className="app-nav-chat btn-ghost" onClick={() => setIsAnnouncementsOpen(true)} title="Head Office Announcements">
              <i className="fa-solid fa-bullhorn"></i> Announcements
            </button>
          )}

          {/* Render welcome text for Client */}
          {isClient && (
            <span className="app-nav-client-welcome">
              Welcome, <strong>{userDetails?.name || user?.displayName || user?.email?.split('@')[0] || 'Client'}</strong>
            </span>
          )}

          <a href="#" className="app-nav-logout" onClick={handleLogoutClick} aria-label="Log out">
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
            <span className="logout-text">Logout</span>
          </a>
        </div>

        {/* Announcements Modal */}
        <AnnouncementsModal isOpen={isAnnouncementsOpen} onClose={() => setIsAnnouncementsOpen(false)} />

        <BaseModal ref={logoutModalRef} title="Confirm Logout" maxWidth="26.25rem">
          <div className="logout-confirm-content">
            <p className="logout-confirm-message">
              Are you sure you want to log out of the {portalName.toLowerCase()} portal?
            </p>
            <div className="logout-confirm-actions">
              <button
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => logoutModalRef.current?.closeModal()}
              >
                Stay
              </button>
              <button
                className="btn-danger"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => {
                  logoutModalRef.current?.closeModal();
                  handleLogoutConfirm();
                }}
              >
                Log Out
              </button>
            </div>
          </div>
        </BaseModal>
      </nav>

      {/* Client Mobile Sub-Navigation Bar */}
      {isClient && isClientMobileMenuOpen && (
        <div className="client-nav-mobile-drawer">
          <NavLink
            to="/client"
            end
            onClick={() => setIsClientMobileMenuOpen(false)}
            className={({ isActive }) => `client-mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <i className="fa-solid fa-store"></i>
            <span>Services Store</span>
          </NavLink>

          <NavLink
            to="/client/tracking"
            onClick={() => setIsClientMobileMenuOpen(false)}
            className={({ isActive }) => `client-mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <i className="fa-solid fa-list-check"></i>
            <span>Track Service Requests</span>
          </NavLink>

          <NavLink
            to="/client/appointments"
            onClick={() => setIsClientMobileMenuOpen(false)}
            className={({ isActive }) => `client-mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <i className="fa-solid fa-calendar-check"></i>
            <span>Book Appointments</span>
          </NavLink>

          <NavLink
            to="/client/messages"
            onClick={() => setIsClientMobileMenuOpen(false)}
            className={({ isActive }) => `client-mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <i className="fa-solid fa-comments"></i>
            <span>Direct Messages</span>
          </NavLink>
        </div>
      )}
    </header>
  );
}
