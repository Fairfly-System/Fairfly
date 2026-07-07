import React, { useRef } from 'react';
import './client-navbar.css';
import { NavLink, useNavigate } from 'react-router';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebase';
import BaseModal from '../../ModalBase/BaseModal';

export default function ClientNavbar({ onNavigate, currentPage }) {
  const navigate = useNavigate();
  const logoutModalRef = useRef(null);

  const handleLogoutConfirm = async () => {
    try {
      await signOut(auth);
      console.log('User signed out');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleLogoutClick = (e) => {
    e.preventDefault();
    logoutModalRef.current?.openModal();
  };

  return (
    <nav className="client-nav">
      <NavLink to="/home">
        <div className="client-logoIcon">
          <img src="/FairflyLogo.png" alt="Fairfly Logo" />
        </div>
      </NavLink>

      <div className="client-navRight">
        <span className="client-welcome">
          Welcome, client@email.com
        </span>

        <a
          href="#"
          className="client-logout"
          onClick={handleLogoutClick}
        >
          <p>
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
          </p>
          Logout
        </a>
      </div>

      <BaseModal
        ref={logoutModalRef}
        title="Confirm Logout"
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '2rem', color: '#555', lineHeight: '1.5' }}>
            Are you sure you want to log out of your account?
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