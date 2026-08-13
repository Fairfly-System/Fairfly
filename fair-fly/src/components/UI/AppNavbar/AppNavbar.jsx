import React, { useState, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebase';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../toast/ToastProvider';
import BaseModal from '../ModalBase/BaseModal';
import TeamChatModal from '../../Shared/TeamChatModal/TeamChatModal';
import './app-navbar.css';

/**
 * AppNavbar — unified top navbar for Admin, Operator, and Client portals.
 *
 * Props:
 *  portalName      {string}   — "Admin" / "Operator" / "Client"
 *  portalSubtitle  {string}   — Subtitle under the brand header (e.g., "Branch Operations")
 *  onMenuToggle    {Function} — Sidebar hamburger toggle callback
 *  showSidebarOffset {boolean} — Whether to push content to the right to account for fixed sidebar
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
  const [isChatOpen, setIsChatOpen] = useState(false);

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
    <nav className={`app-nav ${showSidebarOffset ? 'app-nav--offset' : ''}`}>
      <div className="app-nav-left">
        {/* Hamburger menu trigger — mobile only, hide on Client portal */}
        {!isClient && (
          <button
            className="app-hamburger"
            onClick={onMenuToggle}
            aria-label="Toggle navigation menu"
          >
            <i className="fa-solid fa-bars"></i>
          </button>
        )}

        <NavLink to="/home" className="app-logoIcon" aria-label="Fairfly Home">
          <img
            src="/FairflyLogo.png"
            alt="Fairfly Logo"
            loading="eager"
            decoding="async"
            width="36"
            height="36"
          />
        </NavLink>

        <div className="app-nav-brand-text">
          <p id="top-title">Fairfly {portalName}</p>
          {portalSubtitle && <p id="down-title">{portalSubtitle}</p>}
        </div>
      </div>

      <div className="app-nav-actions">
        {/* Render team chat for Admin & Operator only */}
        {!isClient && (
          <button className="app-nav-chat btn-ghost" onClick={() => setIsChatOpen(true)}>
            <i className="fa-regular fa-message"></i> Team Chat
          </button>
        )}

        {/* Render welcome text for Client */}
        {isClient && (
          <span className="app-nav-client-welcome">
            Welcome, {userDetails?.name || user?.email || 'Client'}
          </span>
        )}

        <a href="#" className="app-nav-logout" onClick={handleLogoutClick} aria-label="Log out">
          <i className="fa-solid fa-arrow-right-from-bracket"></i>
          <span className="logout-text">Logout</span>
        </a>
      </div>

      {isChatOpen && <TeamChatModal onClose={() => setIsChatOpen(false)} />}

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
  );
}
