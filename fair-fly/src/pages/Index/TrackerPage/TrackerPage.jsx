import React, { useEffect } from 'react';
import { Link } from 'react-router';
import RequestTracker from '../../../components/Landing/RequestTracker/RequestTracker';
import './tracker-page.css';

const codeParts = [
  { seg: 'SRV', label: 'Service prefix', desc: 'Issued once payment or booking is confirmed.' },
  { seg: '2026', label: 'Filing year', desc: 'The year your request was opened.' },
  { seg: '000123', label: 'Your sequence', desc: 'Unique to your request at the branch.' },
];

const guides = [
  {
    code: 'QR',
    icon: 'fa-solid fa-qrcode',
    title: 'Official E-Receipt QR Code',
    body: (
      <>
        Scan the QR code printed on your official FairFly E-Receipt using any smartphone camera to automatically load
        this tracking page with your status.
      </>
    ),
  },
  {
    code: 'SRV',
    icon: 'fa-solid fa-barcode',
    title: 'Service Tracking Code',
    body: (
      <>
        Found directly below the QR code on your confirmed payment receipt. Format: <code>SRV-2026-XXXXXX</code>.
      </>
    ),
  },
  {
    code: 'LIVE',
    icon: 'fa-solid fa-list-check',
    title: 'Real-Time Milestone Tracking',
    body: (
      <>
        Once payment or booking is confirmed, monitor embassy appointments, document filings, and ticketing
        step-by-step using your <code>SRV-2026-XXXXXX</code> code.
      </>
    ),
  },
  {
    code: 'HELP',
    icon: 'fa-solid fa-phone-volume',
    title: 'Direct Branch Support',
    body: (
      <>
        Need human assistance with your application? Contact our Baliuag Head Office directly at{' '}
        <a href="tel:+63448133801">+63 (44) 813 3801</a> or email{' '}
        <a href="mailto:fairflytravel19@yahoo.com">fairflytravel19@yahoo.com</a>.
      </>
    ),
  },
];

export default function TrackerPage() {
  useEffect(() => {
    document.title = 'Track Request | FairFly Travel & Tours';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="tracker-page-root">
      {/* Page hero */}
      <header className="tp-hero">
        <div className="tp-shell tp-hero-grid">
          <div className="tp-hero-copy">
            <span className="tp-index">[ 01 ] Public service tracker</span>
            <h1 className="tp-title">
              Where is your request <span className="tp-title-accent">right now?</span>
            </h1>
            <p className="tp-lede">
              Verify milestone progress, document processing status, and official payment receipts for your DFA
              Passport filing, PSA certificates, embassy visas, flights, and holiday tours. Instant lookup, zero
              login required.
            </p>
          </div>

          {/* Anatomy of a tracking code */}
          <aside className="tp-anatomy" aria-label="How to read your tracking code">
            <div className="tp-anatomy-head">
              <span>
                <i className="fa-solid fa-barcode" aria-hidden="true"></i> Reading your code
              </span>
              <span className="tp-anatomy-sub">E-Receipt &middot; below QR</span>
            </div>
            <p className="tp-anatomy-code" aria-hidden="true">
              {codeParts.map((part, i) => (
                <React.Fragment key={part.seg}>
                  {i > 0 && <span className="tp-anatomy-dash">-</span>}
                  <span className={`tp-anatomy-seg tp-anatomy-seg-${i + 1}`}>{part.seg}</span>
                </React.Fragment>
              ))}
            </p>
            <ol className="tp-anatomy-list">
              {codeParts.map((part, i) => (
                <li key={part.seg} className={`tp-anatomy-item tp-anatomy-item-${i + 1}`}>
                  <span className="tp-anatomy-key">{part.seg}</span>
                  <span className="tp-anatomy-label">{part.label}</span>
                  <span className="tp-anatomy-desc">{part.desc}</span>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </header>

      {/* Main tracker */}
      <main className="tp-shell tp-main">
        <RequestTracker hideHeader={true} />
      </main>

      {/* Guidance and assistance */}
      <section className="tp-guide" aria-labelledby="tp-guide-title">
        <div className="tp-shell">
          <header className="tp-guide-head">
            <div>
              <span className="tp-index">[ 02 ] Tracking guidelines &amp; assistance</span>
              <h2 id="tp-guide-title" className="tp-guide-title">Need help finding your reference code?</h2>
            </div>
            <Link to="/services" className="tp-textlink">
              Browse the services catalog
              <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
            </Link>
          </header>

          <ol className="tp-guide-grid">
            {guides.map((guide, i) => (
              <li key={guide.code} className="tp-guide-item">
                <div className="tp-guide-top">
                  <span className="tp-guide-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="tp-guide-code">{guide.code}</span>
                </div>
                <i className={`${guide.icon} tp-guide-icon`} aria-hidden="true"></i>
                <h3 className="tp-guide-item-title">{guide.title}</h3>
                <p className="tp-guide-body">{guide.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
