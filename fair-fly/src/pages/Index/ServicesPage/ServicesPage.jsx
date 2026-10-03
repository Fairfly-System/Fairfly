import React, { useEffect } from 'react';
import { Link } from 'react-router';
import Services from '../../../components/Shared/Services/Services';
import FooterCard from '../../../components/UI/FooterCard/FooterCard';
import './services-page.css';

export default function ServicesPage() {
  // Set SEO title on mount
  useEffect(() => {
    document.title = 'Available Travel & Document Services | Fairfly';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="services-page-wrapper">
      {/* Services Page Hero Header */}
      <section className="services-hero-header">
        <div className="services-hero-container">
          <nav className="services-breadcrumb" aria-label="Breadcrumb">
            <Link to="/home" className="breadcrumb-link">
              <i className="fa-solid fa-house"></i> Home
            </Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Services Catalog</span>
          </nav>

          <div className="services-hero-badge">
            <span className="hero-badge-dot" />
            <span>Certified Operator Catalog</span>
          </div>

          <h1 className="services-hero-title">
            Standardized Travel & Document Processing
          </h1>

          <p className="services-hero-sub">
            From expedited DFA passport filing, PSA civil documents retrieval, and embassy visa consultations to international flight bookings and curated vacation tour packages.
          </p>

          <div className="services-trust-badges">
            <div className="services-trust-pill">
              <i className="fa-solid fa-shield-check"></i>
              <span>ISO 9001:2000 QMS Compliance</span>
            </div>
            <div className="services-trust-pill">
              <i className="fa-solid fa-users-gear"></i>
              <span>Certified Branch Operators</span>
            </div>
            <div className="services-trust-pill">
              <i className="fa-solid fa-clock-rotate-left"></i>
              <span>Real-Time Status Tracking</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Interactive Services Catalog */}
      <main className="services-page-main">
        <Services />
      </main>

      {/* Footer Call to Action */}
      <FooterCard />
    </div>
  );
}
