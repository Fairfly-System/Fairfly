import React, { useState, useEffect } from 'react';
import './navbar.css';
import { NavLink, useLocation, useNavigate } from 'react-router';
import FranchiseApplicationForm from '../FranchiseApplicationForm/FranchiseApplicationForm.jsx';

export default function Navbar() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

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

  // Track active section on landing page via IntersectionObserver and initial hash
  useEffect(() => {
    if (!isHome) {
      setActiveSection('');
      return;
    }

    if (location.hash) {
      const targetHash = location.hash.replace('#', '');
      setActiveSection(targetHash);
      const targetEl = document.getElementById(targetHash);
      if (targetEl) {
        setTimeout(() => {
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    }

    const sectionIds = ['services', 'business-system', 'service-guidelines', 'business-model'];
    const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        root: null,
        rootMargin: '-20% 0px -55% 0px',
        threshold: 0.1,
      }
    );

    sections.forEach((sec) => observer.observe(sec));

    return () => {
      sections.forEach((sec) => observer.unobserve(sec));
    };
  }, [isHome, location.pathname, location.hash]);

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

  const handleSectionClick = (e, sectionId) => {
    if (isHome) {
      e.preventDefault();
      setActiveSection(sectionId);
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        window.history.replaceState(null, '', `#${sectionId}`);
      }
      setIsMobileMenuOpen(false);
    } else {
      setIsMobileMenuOpen(false);
    }
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

          {/* Center: Navigation buttons between Services and About */}
          <div className="nav-center nav-desktop-links">
            <a
              href="/home#services"
              className={`linkNav ${isHome && activeSection === 'services' ? 'active' : ''}`}
              onClick={(e) => handleSectionClick(e, 'services')}
            >
              Services
            </a>

            <a
              href="/home#business-system"
              className={`linkNav ${isHome && activeSection === 'business-system' ? 'active' : ''}`}
              onClick={(e) => handleSectionClick(e, 'business-system')}
            >
              Business System
            </a>

            <a
              href="/home#service-guidelines"
              className={`linkNav ${isHome && activeSection === 'service-guidelines' ? 'active' : ''}`}
              onClick={(e) => handleSectionClick(e, 'service-guidelines')}
            >
              Guidelines
            </a>

            <a
              href="/home#business-model"
              className={`linkNav ${isHome && activeSection === 'business-model' ? 'active' : ''}`}
              onClick={(e) => handleSectionClick(e, 'business-model')}
            >
              Model
            </a>

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
            <a
              href="/home#services"
              className={`nav-mobile-item ${isHome && activeSection === 'services' ? 'active' : ''}`}
              onClick={(e) => handleSectionClick(e, 'services')}
            >
              <i className="fa-solid fa-plane-up"></i>
              <span>Services</span>
            </a>

            <a
              href="/home#business-system"
              className={`nav-mobile-item ${isHome && activeSection === 'business-system' ? 'active' : ''}`}
              onClick={(e) => handleSectionClick(e, 'business-system')}
            >
              <i className="fa-solid fa-award"></i>
              <span>Business System</span>
            </a>

            <a
              href="/home#service-guidelines"
              className={`nav-mobile-item ${isHome && activeSection === 'service-guidelines' ? 'active' : ''}`}
              onClick={(e) => handleSectionClick(e, 'service-guidelines')}
            >
              <i className="fa-solid fa-diagram-project"></i>
              <span>Guidelines</span>
            </a>

            <a
              href="/home#business-model"
              className={`nav-mobile-item ${isHome && activeSection === 'business-model' ? 'active' : ''}`}
              onClick={(e) => handleSectionClick(e, 'business-model')}
            >
              <i className="fa-solid fa-lightbulb"></i>
              <span>Business Model</span>
            </a>

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