import { useState, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebase';
import TeamChatModal from '../../Shared/TeamChatModal/TeamChatModal';
import { useToast } from '../../UI/toast/ToastProvider';
import BaseModal from '../../UI/ModalBase/BaseModal';
import './operator-navbar.css';

export default function OperatorNavbar({ onMenuToggle }) {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const logoutModalRef = useRef(null);
  const { addToast } = useToast();

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

  return (
    <nav className="op-nav">
      <div className="op-nav-left">
        {/* Hamburger — mobile only */}
        <button
          className="op-hamburger"
          onClick={onMenuToggle}
          aria-label="Toggle navigation menu"
        >
          <i className="fa-solid fa-bars"></i>
        </button>

        <NavLink to="/home" className="op-logoIcon">
          <div className="client-logoIcon">
            <img src="/FairflyLogo.png" alt="Fairfly Logo" />
          </div>
        </NavLink>

        <div className="op-nav-brand-text">
          <p id="top-title">Fairfly Operator</p>
          <p id="down-title">Service Management Portal</p>
        </div>
      </div>

      <div className="op-nav-actions">
        <button className="op-nav-chat" onClick={() => setIsChatOpen(true)}>
          <i className="fa-regular fa-message"></i> Team Chat
        </button>
        <a href="#" className="op-nav-logout" onClick={handleLogoutClick}>
          <i className="fa-solid fa-arrow-right-from-bracket"></i>
          Logout
        </a>
      </div>

      {isChatOpen && <TeamChatModal onClose={() => setIsChatOpen(false)} />}

      <BaseModal ref={logoutModalRef} title="Confirm Logout">
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '2rem', color: '#555', lineHeight: '1.5' }}>
            Are you sure you want to log out of the operator portal?
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button
              className="btn-cancel"
              onClick={() => logoutModalRef.current?.closeModal()}
              style={{
                padding: '0.6rem 1.5rem',
                borderRadius: '6px',
                border: '1px solid #ddd',
                backgroundColor: '#f5f5f5',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              Stay
            </button>
            <button
              className="btn-confirm"
              onClick={() => {
                logoutModalRef.current?.closeModal();
                handleLogoutConfirm();
              }}
              style={{
                padding: '0.6rem 1.5rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#dc3545',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '500',
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
