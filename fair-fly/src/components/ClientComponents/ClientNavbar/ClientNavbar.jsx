import React from 'react';
import './client-navbar.css';
import { NavLink, useNavigate } from 'react-router';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebase';

export default function ClientNavbar({ onNavigate, currentPage }) {
  const navigate = useNavigate();

  const handleLogout = async (e) => {
    e.preventDefault();

    try {
      await signOut(auth);
      console.log('User signed out');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
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
          onClick={handleLogout}
        >
          <p>
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
          </p>
          Logout
        </a>
      </div>
    </nav>
  );
}