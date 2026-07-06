import React, { useState, useRef } from 'react';
import './admin-navbar.css';
import { NavLink, useNavigate } from 'react-router';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebase';
import TeamChatModal from '../TeamChatModal/TeamChatModal';
import { useToast } from '../../toast/ToastProvider';
import BaseModal from '../../ModalBase/BaseModal';


export default function AdminNavbar({ onNavigate, currentPage }) {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const logoutModalRef = useRef(null);
  const { addToast } = useToast();

  const handleLogoutConfirm = async () => {
    try {
      await signOut(auth);
      addToast("Logged out successfully!", "success");
      navigate('/');
    } catch (error) {
      addToast("Logout failed: " + error.message, "error");
    }
  };

  const handleLogoutClick = (e) => {
    e.preventDefault();
    logoutModalRef.current?.openModal();
  };

  return (
    <nav className="admin-nav">
      
        <div className="admin-logoIcon">

                <NavLink to="/home">
                  <div className="client-logoIcon">
                    <img src="/FairflyLogo.png" alt="Fairfly Logo" />
                  </div>
                </NavLink>

            <div className='admin-right'>
            <p id='top-title'>Fairfly Admin</p>
            <p id='down-title'>Management Portal</p>
            </div>

        </div>

      <div className="admin-navRight">
          <button className="admin-welcome" onClick={() => setIsChatOpen(true)}>
          <i class="fa-regular fa-message"></i> Team Chat
          </button>

        <a
          href="#"
          className="admin-logout"
          onClick={handleLogoutClick}
        >
          <p>
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
          </p>
          Logout
        </a>
      </div>

      {isChatOpen && <TeamChatModal onClose={() => setIsChatOpen(false)} />}

      <BaseModal
        ref={logoutModalRef}
        title="Confirm Logout"
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '2rem', color: '#555', lineHeight: '1.5' }}>
            Are you sure you want to log out of the management portal?
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
                fontWeight: '500'
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
                fontWeight: '500'
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