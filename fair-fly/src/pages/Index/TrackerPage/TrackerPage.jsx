import React, { useEffect } from 'react';
import { Link } from 'react-router';
import RequestTracker from '../../../components/Landing/RequestTracker/RequestTracker';
import './tracker-page.css';

export default function TrackerPage() {
  useEffect(() => {
    document.title = 'Track Request | FairFly Travel & Tours';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="tracker-page-root">
      {/* Page Hero Header */}
      <div className="tracker-page-hero">
        <div className="tracker-page-hero-container">
          <div className="tracker-hero-eyebrow">
            <span>CENTRALIZED PUBLIC SERVICE TRACKING SYSTEM</span>
          </div>

          <h1 className="tracker-page-title">
            REAL-TIME <span className="title-brand-fair">SERVICE</span> &{' '}
            <span className="title-brand-fly">TRACKING</span> PORTAL
          </h1>

          <p className="tracker-page-subtitle">
            Verify milestone progress, document processing status, and official payment receipts for your DFA Passport filing, PSA certificates, embassy visas, flights, and holiday tours—instant lookup with zero login required.
          </p>
        </div>
      </div>

      {/* Main Tracker Container */}
      <div className="tracker-page-content-wrapper">
        <RequestTracker hideHeader={true} />
      </div>

      {/* Guidance and Assistance Grid */}
      <div className="tracker-info-section">
        <div className="tracker-info-container">
          <div className="tracker-info-header">
            <span className="info-header-tag">[ TRACKING GUIDELINES & ASSISTANCE ]</span>
            <h3 className="info-header-title">Need help finding your reference code?</h3>
          </div>

          <div className="tracker-guide-grid">
            <div className="tracker-guide-card">
              <div className="guide-card-icon">
                <i className="fa-solid fa-qrcode"></i>
              </div>
              <h4>Official E-Receipt QR Code</h4>
              <p>
                Scan the QR code printed on your official FairFly E-Receipt (Form ADF-07-002) using any smartphone camera to automatically load this tracking page with your status.
              </p>
            </div>

            <div className="tracker-guide-card">
              <div className="guide-card-icon">
                <i className="fa-solid fa-barcode"></i>
              </div>
              <h4>Service Tracking Code (SRV-...)</h4>
              <p>
                Found directly below the QR code on your confirmed payment receipt. Format: <code>SRV-2026-XXXXXX</code>.
              </p>
            </div>

            <div className="tracker-guide-card">
              <div className="guide-card-icon">
                <i className="fa-solid fa-list-check"></i>
              </div>
              <h4>Real-Time Milestone Tracking</h4>
              <p>
                Once payment or booking is confirmed, monitor embassy appointments, document filings, and ticketing step-by-step using your <code>SRV-2026-XXXXXX</code> code.
              </p>
            </div>

            <div className="tracker-guide-card">
              <div className="guide-card-icon">
                <i className="fa-solid fa-phone-volume"></i>
              </div>
              <h4>Direct Branch Support</h4>
              <p>
                Need human assistance with your application? Contact our Baliuag Head Office directly at <strong>+63 (44) 813 3801</strong> or email <strong>fairflytravel19@yahoo.com</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
