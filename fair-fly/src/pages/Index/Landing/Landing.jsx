import React from 'react';
import { Link } from 'react-router';
import './landing.css';
import FooterCard from '../../../components/UI/FooterCard/FooterCard';
import FranchiseSection from '../../../components/FranchiseSection/FranchiseSection';
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
              <span className="eyebrow-text">Standardized travel management system · ISO 9001:2000</span>
            </div>

            <h1 className="hero-heading">
              Start your journey as a franchise partner, <br />
              build your travel business with{' '}
              <span className="hero-heading-brand">
                <span className="brand-fair">Fair</span>
                <span className="brand-fly">Fly</span>
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
              <Link to="/about" className="btn-hero-secondary">
                <span>ABOUT FAIRFLY</span>
                <i className="fa-solid fa-arrow-right"></i>
              </Link>
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
              <span className="trust-title">ISO: 9001-2000 Ready</span>
              <span className="trust-sub">International QMS Operational Standards</span>
            </div>
          </div>

          <div className="trust-item">
            <div className="trust-index">[ 02 ]</div>
            <div className="trust-text">
              <span className="trust-title">Zero inventory</span>
              <span className="trust-sub">Asset-Light 100% Cash-Basis Model</span>
            </div>
          </div>

          <div className="trust-item">
            <div className="trust-index">[ 03 ]</div>
            <div className="trust-text">
              <span className="trust-title">100% Online cloud</span>
              <span className="trust-sub">Real-Time Centralized Virtual Office</span>
            </div>
          </div>

          <div className="trust-item">
            <div className="trust-index">[ 04 ]</div>
            <div className="trust-text">
              <span className="trust-title">2-Month fast track</span>
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
              <span>Catalog & accredited solutions</span>
            </div>
            <h2 className="teaser-title">Looking for travel & document assistance?</h2>
            <p className="teaser-desc">
              Explore our full catalog of certified DFA passport expediting, PSA civil registry document retrieval, embassy tourist visa filings, flight bookings, and holiday tour packages.
            </p>
            <div className="teaser-tags">
              <span className="teaser-tag">[ Passport filing ]</span>
              <span className="teaser-tag">[ PSA certificates ]</span>
              <span className="teaser-tag">[ Visa assistance ]</span>
              <span className="teaser-tag">[ Flight ticketing ]</span>
              <span className="teaser-tag">[ Tour packages ]</span>
            </div>
          </div>
          <div className="teaser-right">
            <Link to="/services" className="btn-teaser-cta">
              <span>View services catalog</span>
              <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* Franchise Opportunity Section */}
      <FranchiseSection />

      {/* Call to Action Card */}
      <FooterCard />
    </div>
  );
}
