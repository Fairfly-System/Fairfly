import React from 'react';
import './landing.css';
import Services from '../../../components/Shared/Services/Services';
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
        <div className="badge">
          <span className="dot" />
          <span>Trusted Travel Agency</span>
        </div>

        <h1 className="heading">
          Your Journey Starts Here
          <br />
          With<span className="headingGradient"> Fairfly Travel & Tours</span>
        </h1>

        <p className="sub">
          A standardized, cloud-powered travel ecosystem. From passports, PSA documents, and international flight ticketing to franchise operations with zero physical inventory liabilities.
        </p>

        <div className="actions">
          <a href="#franchise-section" className="btnFranchiseHero">
            <i className="fa-solid fa-building-flag"></i> Franchise Inquiries
          </a>

          <a href="#business-system" className="btnSecondary">
            <i className="fa-solid fa-microchip"></i> Explore Business System
          </a>
          <a href="/register" className="btnPrimary">
            Get Started <i className="fa-solid fa-arrow-right"></i>
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

      {/* Core Services Catalog */}
      <Services />

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
