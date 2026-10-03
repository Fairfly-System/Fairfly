import React from 'react';
import { Link } from 'react-router';
import './landing.css';
import FooterCard from '../../../components/UI/FooterCard/FooterCard';
import FranchiseSection from '../../../components/FranchiseSection/FranchiseSection';
import Explore from '../../../components/Explore/Explore';
import BusinessSystem from '../../../components/Landing/BusinessSystem/BusinessSystem';
import ServiceGuidelines from '../../../components/Landing/ServiceGuidelines/ServiceGuidelines';
import BusinessModel from '../../../components/Landing/BusinessModel/BusinessModel';
import TrainingComparison from '../../../components/Landing/TrainingComparison/TrainingComparison';

export default function Landing() {
  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg-container">
          <img
            src="/hero-bg.jpg"
            alt="Fairfly Travel Background"
            className="hero-bg-img"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2000&auto=format&fit=crop";
            }}
          />
          <div className="hero-bg-overlay" />
        </div>

        <div className="hero-badge">
          <span className="hero-badge-dot" />
          <span>Standardized Travel Management System</span>
        </div>

        <h1 className="hero-heading">
          Standardized Travel & Document Processing
          <br />
          Across the Philippines with{' '}
          <span className="hero-heading-brand">
            <span className="brand-fair">fair</span>
            <span className="brand-fly">fly</span>
          </span>
        </h1>

        <p className="hero-sub">
          An ISO 9001:2000-ready cloud ecosystem. From expedited passport filing, PSA civil documents, and international flight ticketing to asset-light franchise operations with zero physical inventory liability.
        </p>

        <div className="hero-actions">
          <Link to="/services" className="btn-hero-primary">
            <span>Browse Services</span>
            <i className="fa-solid fa-arrow-right"></i>
          </Link>
          <a href="#business-system" className="btn-hero-secondary">
            <i className="fa-solid fa-microchip"></i>
            <span>Explore Business System</span>
          </a>
          <a href="#franchise-section" className="btn-hero-outline">
            <i className="fa-solid fa-building-flag"></i>
            <span>Franchise Inquiries</span>
          </a>
        </div>

        {/* Metric Trust Strip */}
        <div className="hero-trust-strip">
          <div className="trust-item">
            <div className="trust-icon">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <div className="trust-text">
              <span className="trust-title">ISO: 9001-2000 Ready</span>
              <span className="trust-sub">International QMS Standards</span>
            </div>
          </div>

          <div className="trust-item">
            <div className="trust-icon">
              <i className="fa-solid fa-box-open"></i>
            </div>
            <div className="trust-text">
              <span className="trust-title">Zero Inventory</span>
              <span className="trust-sub">Asset-Light Cash-Basis Model</span>
            </div>
          </div>

          <div className="trust-item">
            <div className="trust-icon">
              <i className="fa-solid fa-cloud"></i>
            </div>
            <div className="trust-text">
              <span className="trust-title">100% Online Cloud</span>
              <span className="trust-sub">Anytime Virtual Office Access</span>
            </div>
          </div>

          <div className="trust-item">
            <div className="trust-icon">
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
            <div className="trust-text">
              <span className="trust-title">2-Month Fast Track</span>
              <span className="trust-sub">29 Yrs Experience Transfer</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Services Teaser Strip */}
      <section className="landing-services-teaser">
        <div className="teaser-container">
          <div className="teaser-left">
            <div className="teaser-badge">
              <i className="fa-solid fa-briefcase"></i>
              <span>Available Services</span>
            </div>
            <h2 className="teaser-title">Looking for Travel & Document Assistance?</h2>
            <p className="teaser-desc">
              Explore our full catalog of certified DFA passport expediting, PSA civil registry document retrieval, embassy tourist visa filings, flight bookings, and holiday tour packages.
            </p>
            <div className="teaser-pills">
              <span className="teaser-pill"><i className="fa-solid fa-id-card"></i> Passport Filing</span>
              <span className="teaser-pill"><i className="fa-regular fa-file-lines"></i> PSA Certificates</span>
              <span className="teaser-pill"><i className="fa-solid fa-passport"></i> Visa Assistance</span>
              <span className="teaser-pill"><i className="fa-solid fa-plane-departure"></i> Flight Ticketing</span>
              <span className="teaser-pill"><i className="fa-solid fa-map-location-dot"></i> Tour Packages</span>
            </div>
          </div>
          <div className="teaser-right">
            <Link to="/services" className="btn-teaser-cta">
              <span>View All Services Catalog</span>
              <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* ISO 9001-2000 Quality Management System Section (Slides 2-6) */}
      <BusinessSystem />

      {/* Standardized Step-by-Step Service Processing Guidelines (Slides 14-17) */}
      <ServiceGuidelines />

      {/* Asset-Light & Zero Inventory Business Model Section (Slides 7, 9-13) */}
      <BusinessModel />

      {/* 29 Years Experience in 2 Months Training Academy (Slide 8) */}
      <TrainingComparison />

      {/* Explore Destination Gallery */}
      <Explore />

      {/* Franchise Opportunity Section */}
      <FranchiseSection />

      {/* Call to Action Card */}
      <FooterCard />
    </>
  );
}
