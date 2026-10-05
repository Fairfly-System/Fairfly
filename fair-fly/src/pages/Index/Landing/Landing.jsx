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
import PuzzleHouse from '../../../components/Landing/FranchisePuzzleBanner/PuzzleHouse';

export default function Landing() {
  return (
    <div className="landing-page-root">
      {/* Hero Section (Architectural Swiss / Editorial Sharp Layout) */}
      <section className="hero">

        <div className="hero-main-container">
          {/* Left: Editorial Hero Column */}
          <div className="hero-text-col">
            {/* Background Image scoped strictly to Text Section with fading opacity gradient */}
            <div className="hero-text-bg-container" aria-hidden="true">
              <img
                src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2000&auto=format&fit=crop"
                alt=""
                className="hero-text-bg-img"
              />
              <div className="hero-text-bg-overlay" />
            </div>

            {/* Architectural Eyebrow (Zero roundness / badges) */}
            <div className="hero-eyebrow">
              <span className="eyebrow-accent" />
              <span className="eyebrow-text">STANDARDIZED TRAVEL MANAGEMENT SYSTEM · ISO 9001:2000</span>
            </div>

            <h1 className="hero-heading">
              START YOUR JOURNEY AS A FRANCHISE PARTNER, <br />
              BUILD YOUR TRAVEL BUSINESS WITH{' '}
              <span className="hero-heading-brand">
                <span className="brand-fair">fair</span>
                <span className="brand-fly">fly</span>
              </span>
            </h1>

            <p className="hero-sub">
              An ISO 9001:2000-ready cloud ecosystem. From expedited passport filing, PSA civil documents, and international flight ticketing to asset-light franchise operations with zero physical inventory liability.
            </p>

            {/* Razor-sharp Action Buttons */}
            <div className="hero-actions">
              <Link to="/services" className="btn-hero-primary">
                <span>BROWSE SERVICES</span>
                <i className="fa-solid fa-arrow-right"></i>
              </Link>
              <a href="#business-system" className="btn-hero-secondary">
                <span>BUSINESS SYSTEM</span>
                <i className="fa-solid fa-plus"></i>
              </a>
              <a href="#franchise-section" className="btn-hero-outline">
                <span>FRANCHISE INQUIRIES</span>
                <i className="fa-solid fa-arrow-up-right-from-square"></i>
              </a>
            </div>
          </div>

          {/* Right: 3D Three.js Building Blocks House */}
          <div className="hero-puzzle-col">
            <PuzzleHouse />
          </div>
        </div>

        {/* Razor-Sharp Metric Trust Strip (Hairline Grid System) */}
        <div className="hero-trust-strip">
          <div className="trust-item">
            <div className="trust-index">[ 01 ]</div>
            <div className="trust-text">
              <span className="trust-title">ISO: 9001-2000 READY</span>
              <span className="trust-sub">International QMS Operational Standards</span>
            </div>
          </div>

          <div className="trust-item">
            <div className="trust-index">[ 02 ]</div>
            <div className="trust-text">
              <span className="trust-title">ZERO INVENTORY</span>
              <span className="trust-sub">Asset-Light 100% Cash-Basis Model</span>
            </div>
          </div>

          <div className="trust-item">
            <div className="trust-index">[ 03 ]</div>
            <div className="trust-text">
              <span className="trust-title">100% ONLINE CLOUD</span>
              <span className="trust-sub">Real-Time Centralized Virtual Office</span>
            </div>
          </div>

          <div className="trust-item">
            <div className="trust-index">[ 04 ]</div>
            <div className="trust-text">
              <span className="trust-title">2-MONTH FAST TRACK</span>
              <span className="trust-sub">29 Years Experience Transfer Academy</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Services Teaser Strip (Sharp Architectural Banner) */}
      <section className="landing-services-teaser">
        <div className="teaser-container">
          <div className="teaser-left">
            <div className="teaser-eyebrow">
              <span className="teaser-eyebrow-dot" />
              <span>CATALOG & ACCREDITED SOLUTIONS</span>
            </div>
            <h2 className="teaser-title">LOOKING FOR TRAVEL & DOCUMENT ASSISTANCE?</h2>
            <p className="teaser-desc">
              Explore our full catalog of certified DFA passport expediting, PSA civil registry document retrieval, embassy tourist visa filings, flight bookings, and holiday tour packages.
            </p>
            <div className="teaser-tags">
              <span className="teaser-tag">[ PASSPORT FILING ]</span>
              <span className="teaser-tag">[ PSA CERTIFICATES ]</span>
              <span className="teaser-tag">[ VISA ASSISTANCE ]</span>
              <span className="teaser-tag">[ FLIGHT TICKETING ]</span>
              <span className="teaser-tag">[ TOUR PACKAGES ]</span>
            </div>
          </div>
          <div className="teaser-right">
            <Link to="/services" className="btn-teaser-cta">
              <span>VIEW SERVICES CATALOG</span>
              <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* ISO 9001-2000 Quality Management System Section */}
      <BusinessSystem />

      {/* Standardized Step-by-Step Service Processing Guidelines */}
      <ServiceGuidelines />

      {/* Asset-Light & Zero Inventory Business Model Section */}
      <BusinessModel />

      {/* 29 Years Experience in 2 Months Training Academy */}
      <TrainingComparison />

      {/* Explore Destination Gallery */}
      <Explore />

      {/* Franchise Opportunity Section */}
      <FranchiseSection />

      {/* Call to Action Card */}
      <FooterCard />
    </div>
  );
}
