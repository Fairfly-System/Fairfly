import { useState } from 'react';
import './operator-quick-links.css';

const LINKS = {
  Airlines: [
    { label: 'Cebu Pacific', url: 'https://www.cebupacificair.com', color: '#d97706' },
    { label: 'Philippine Airlines', url: 'https://www.philippineairlines.com', color: '#1d4ed8' },
    { label: 'AirAsia', url: 'https://www.airasia.com', color: '#dc2626' },
    { label: 'Singapore Airlines', url: 'https://www.singaporeair.com', color: '#1e3a8a' },
    { label: 'Cathay Pacific', url: 'https://www.cathaypacific.com', color: '#15803d' },
  ],
  Hotels: [
    { label: 'Booking.com', url: 'https://www.booking.com', color: '#1d4ed8' },
    { label: 'Agoda', url: 'https://www.agoda.com', color: '#7c3aed' },
    { label: 'Hotels.com', url: 'https://www.hotels.com', color: '#dc2626' },
    { label: 'Airbnb', url: 'https://www.airbnb.com', color: '#db2777' },
    { label: 'Expedia', url: 'https://www.expedia.com', color: '#b45309' },
  ],
  Government: [
    { label: 'DFA Passport', url: 'https://www.passport.gov.ph', color: '#1d4ed8' },
    { label: 'PSA Serbilis', url: 'https://serbilis.psa.gov.ph', color: '#15803d' },
    { label: 'BI e-Services', url: 'https://onlineservices.immigration.gov.ph', color: '#dc2626' },
    { label: 'eGov PH', url: 'https://egov.ph', color: '#0369a1' },
  ],
  Visa: [
    { label: 'US Embassy Manila', url: 'https://ph.usembassy.gov', color: '#1d4ed8' },
    { label: 'VFS Global', url: 'https://www.vfsglobal.com', color: '#7c3aed' },
    { label: 'BLS International', url: 'https://www.blsinternational.com', color: '#dc2626' },
    { label: 'Japan Visa', url: 'https://www.ph.emb-japan.go.jp', color: '#b45309' },
  ],
  'Admin Links': [
    { label: 'Fairfly Admin Portal', url: '/admin', color: '#5b63ff' },
    { label: 'Training Materials', url: '#', color: '#0369a1' },
    { label: 'Support Desk', url: '#', color: '#15803d' },
    { label: 'Internal Reports', url: '#', color: '#374151' },
  ],
};

const TABS = Object.keys(LINKS);

export default function OperatorQuickLinks() {
  const [active, setActive] = useState('Airlines');

  return (
    <div className="card op-quicklinks">
      <div className="op-quicklinks-header">
        <div className="op-quicklinks-title">
          <i className="fa-solid fa-globe" style={{ color: '#5b63ff' }}></i>
          <div>
            <h2>Quick Links - External Resources</h2>
            <p>Fast access to frequently used websites for service processing</p>
          </div>
        </div>
      </div>

      <div className="op-tab-strip">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`op-tab ${active === tab ? 'active' : ''}`}
            onClick={() => setActive(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="op-links-grid">
        {LINKS[active].map((link) => (
          <a
            key={link.label}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="op-link-btn"
            style={{ background: link.color }}
          >
            <span>{link.label}</span>
            <i className="fa-solid fa-arrow-up-right-from-square"></i>
          </a>
        ))}
      </div>
    </div>
  );
}
