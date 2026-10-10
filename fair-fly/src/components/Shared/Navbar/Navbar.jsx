import React, { useState, useEffect } from 'react';
import './navbar.css';
import { NavLink, useLocation, useNavigate } from 'react-router';
import FranchiseApplicationForm from '../FranchiseApplicationForm/FranchiseApplicationForm.jsx';

export default function Navbar() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isHome = location.pathname === '/home' || location.pathname === '/';

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const openModal = (e) => {
    if (e) e.preventDefault();
    setIsMobileMenuOpen(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleHomeClick = (e) => {
    if (isHome) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.history.replaceState(null, '', '/home');
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="nav-wrapper">
        <nav className="nav">
          {/* Left: Brand Logo */}
          <div className="nav-left logoIcon">
            <NavLink to="/home" className="logo" onClick={closeMobileMenu}>
              <img src="/FairflyLogo.png" alt="FairFly Logo" className="nav-logo-img" />
            </NavLink>
          </div>

          {/* Center: Navigation buttons (Home, Services, Track Request, About) */}
          <div className="nav-center nav-desktop-links">
            <NavLink
              to="/home"
              className={({ isActive }) => `linkNav ${isActive ? 'active' : ''}`}
              onClick={handleHomeClick}
            >
              Home
            </NavLink>

            <NavLink
              to="/services"
              className={({ isActive }) => `linkNav ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              Services
            </NavLink>

            <NavLink
              to="/track"
              className={({ isActive }) => `linkNav ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              Track Request
            </NavLink>

            <NavLink
              to="/about"
              className={({ isActive }) => `linkAbout ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              About
            </NavLink>
          </div>

          {/* Right: Login beside Apply for Franchise */}
          <div className="nav-right nav-desktop-actions">
            <NavLink
              to="/login"
              className={({ isActive }) => `linkLogin ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <i className="fa-solid fa-right-to-bracket"></i>
              <span>Login</span>
            </NavLink>

            <a href="#franchise" className="btnFranchise" onClick={openModal}>
              <i className="fa-solid fa-suitcase"></i> Apply for Franchise
            </a>
          </div>

          {/* Mobile Right Controls */}
          <div className="nav-mobile-controls">
            <button
              type="button"
              className="btnFranchiseMobile"
              onClick={openModal}
              title="Apply for Franchise"
            >
              <i className="fa-solid fa-suitcase"></i>
              <span>Apply</span>
            </button>

            <button
              type="button"
              className="nav-hamburger"
              onClick={toggleMobileMenu}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              <i className={isMobileMenuOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'}></i>
            </button>
          </div>
        </nav>

        {/* Mobile Dropdown / Slide Drawer */}
        {isMobileMenuOpen && (
          <div className="nav-mobile-backdrop" onClick={closeMobileMenu} />
        )}

        <div className={`nav-mobile-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
          <div className="nav-mobile-links">
            <NavLink
              to="/home"
              className={({ isActive }) => `nav-mobile-item ${isActive ? 'active' : ''}`}
              onClick={handleHomeClick}
            >
              <i className="fa-solid fa-house"></i>
              <span>Home</span>
            </NavLink>

            <NavLink
              to="/services"
              className={({ isActive }) => `nav-mobile-item ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <i className="fa-solid fa-plane-up"></i>
              <span>Services</span>
            </NavLink>

            <NavLink
              to="/track"
              className={({ isActive }) => `nav-mobile-item ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <i className="fa-solid fa-magnifying-glass-location"></i>
              <span>Track Request</span>
            </NavLink>

            <NavLink
              to="/about"
              className={({ isActive }) => `nav-mobile-item ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <i className="fa-solid fa-circle-info"></i>
              <span>About Us</span>
            </NavLink>

            <NavLink
              to="/login"
              className={({ isActive }) => `nav-mobile-item ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <i className="fa-solid fa-right-to-bracket"></i>
              <span>Sign In / Login</span>
            </NavLink>
          </div>

          <div className="nav-mobile-actions">
            <button
              type="button"
              className="btn-primary full-width nav-mobile-cta"
              onClick={openModal}
            >
              <i className="fa-solid fa-suitcase"></i> Apply for Franchise
            </button>
          </div>
        </div>
      </header>

      <FranchiseApplicationForm isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
}