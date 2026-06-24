import React from 'react';
import './admin-navbar.css';
import { NavLink, useNavigate } from 'react-router';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';


export default function AdminNavbar({ onNavigate, currentPage }) {
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
    <nav className="admin-nav">
      
        <div className="admin-logoIcon">
            <NavLink to="/home">
            <img src="/FairflyLogo.png" alt="Fairfly Logo" />
            </NavLink>

            <div className='admin-right'>
            <p id='top-title'>Fairfly Admin</p>
            <p id='down-title'>Management Portal</p>
            </div>

        </div>

      <div className="admin-navRight">
        <button className="admin-welcome">
          <i class="fa-regular fa-message"></i> Team Chat
        </button>

        <a
          href="#"
          className="admin-logout"
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