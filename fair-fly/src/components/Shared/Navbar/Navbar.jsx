import React, { useState, useEffect } from 'react';
import './navbar.css';
import { NavLink, useLocation } from 'react-router';
import FranchiseApplicationForm from '../FranchiseApplicationForm/FranchiseApplicationForm.jsx';

export default function Navbar() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

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

  return (
    <>
      <header className="nav-wrapper">
        <nav className="nav">
          <div className="logoIcon">
            <NavLink to="/home" className="logo" onClick={closeMobileMenu}>
              <img src="/FairflyLogo.png" alt="FairFly Logo" className="nav-logo-img" />
            </NavLink>
          </div>

          {/* Desktop Navigation Links */}
          <div className="right nav-desktop-links">
            <a href="/home#services" className="linkNav">
              Services
            </a>

            <a href="/home#business-system" className="linkNav">
              Business System
            </a>

            <a href="/home#service-guidelines" className="linkNav">
              Guidelines
            </a>

            <a href="/home#business-model" className="linkNav">
              Model
            </a>

            <NavLink to="/about" className="linkAbout">
              About
            </NavLink>

            <NavLink to="/login" className="linkLogin">
              Login
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
            <a href="/home#services" className="nav-mobile-item" onClick={closeMobileMenu}>
              <i className="fa-solid fa-plane-up"></i>
              <span>Services</span>
            </a>

            <a href="/home#business-system" className="nav-mobile-item" onClick={closeMobileMenu}>
              <i className="fa-solid fa-award"></i>
              <span>Business System</span>
            </a>

            <a href="/home#service-guidelines" className="nav-mobile-item" onClick={closeMobileMenu}>
              <i className="fa-solid fa-diagram-project"></i>
              <span>Guidelines</span>
            </a>

            <a href="/home#business-model" className="nav-mobile-item" onClick={closeMobileMenu}>
              <i className="fa-solid fa-lightbulb"></i>
              <span>Business Model</span>
            </a>

            <NavLink to="/about" className="nav-mobile-item" onClick={closeMobileMenu}>
              <i className="fa-solid fa-circle-info"></i>
              <span>About Us</span>
            </NavLink>

            <NavLink to="/login" className="nav-mobile-item" onClick={closeMobileMenu}>
              <i className="fa-solid fa-right-to-bracket"></i>
              <span>Sign In</span>
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