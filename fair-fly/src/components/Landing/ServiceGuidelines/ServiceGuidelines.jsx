import React, { useState } from 'react';
import './service-guidelines.css';

const servicesData = [
  {
    id: 'passport',
    name: 'Passport Processing',
    icon: 'fa-solid fa-passport',
    category: 'Government Documentation',
    summary: 'Standardized 4-step pipeline for DFA new applications and renewals.',
    costOfService: 'P1,350.00',
    customerPrice: 'P1,600.00',
    margin: 'P250.00 / applicant',
    steps: [
      {
        num: 1,
        title: 'Requirements Verification',
        desc: 'Receive identity and documentary requirements from the client and verify against DFA regulatory checklists.',
        icon: 'fa-solid fa-list-check'
      },
      {
        num: 2,
        title: 'Main Office Submission',
        desc: 'Submit verified requirements to head office with fee transfer and courier dispatch.',
        icon: 'fa-solid fa-paper-plane'
      },
      {
        num: 3,
        title: 'DFA Appearance Schedule',
        desc: 'Receive confirmed DFA appointment slot for client personal appearance and biometric capture.',
        icon: 'fa-solid fa-calendar-check'
      },
      {
        num: 4,
        title: 'Courier Dispatch & Release',
        desc: 'Receive the released passport via secure courier delivery (LBC) and release to client.',
        icon: 'fa-solid fa-box-open'
      }
    ]
  },
  {
    id: 'psa',
    name: 'PSA / NSO Certificates',
    icon: 'fa-regular fa-file-lines',
    category: 'Civil Registry',
    summary: 'Express processing for Birth, Marriage, Death certificates & CENOMAR.',
    costOfService: 'P400.00',
    customerPrice: 'P550.00',
    margin: 'P150.00 / certificate',
    steps: [
      {
        num: 1,
        title: 'Inquiry Intake',
        desc: 'Capture complete certificate details and authorization from client at the branch or online portal.',
        icon: 'fa-solid fa-file-pen'
      },
      {
        num: 2,
        title: 'Data & Bank Transfer',
        desc: 'Transmit certificate data electronically to head office and remit payment via dedicated bank channel.',
        icon: 'fa-solid fa-building-columns'
      },
      {
        num: 3,
        title: 'Secure Delivery via LBC',
        desc: 'Official certified PSA copy processed, received via courier, and made ready for client pickup or dispatch.',
        icon: 'fa-solid fa-truck-fast'
      }
    ]
  },
  {
    id: 'airline',
    name: 'Airline Ticketing',
    icon: 'fa-solid fa-plane-departure',
    category: 'Flight Bookings',
    summary: 'Direct IATA & airline rate ticketing for domestic and international flights.',
    costOfService: 'IATA Rate + P100 (Local) / P200 (Intl)',
    customerPrice: '+ P500 (Local) / + P1,000 (Intl)',
    margin: 'P500 - P1,000 / ticket',
    steps: [
      {
        num: 1,
        title: 'Flight Inquiry & Routing',
        desc: 'Input desired travel dates, destination routing, and passenger preferences into the ticketing desk.',
        icon: 'fa-solid fa-magnifying-glass-location'
      },
      {
        num: 2,
        title: 'Instant Fare Resolution',
        desc: 'Receive real-time flight options, seat allocations, and verified GDS/IATA pricing.',
        icon: 'fa-solid fa-tags'
      },
      {
        num: 3,
        title: 'Payment Settlement',
        desc: 'Client pays upfront; branch transfers payment directly to the head office ticketing account.',
        icon: 'fa-solid fa-receipt'
      },
      {
        num: 4,
        title: 'Instant E-Ticket Issuance',
        desc: 'Official electronic ticket with PNR confirmation issued instantly and delivered via email/SMS.',
        icon: 'fa-solid fa-envelope-circle-check'
      }
    ]
  },
  {
    id: 'tours',
    name: 'Tour Packages & Charters',
    icon: 'fa-solid fa-map-location-dot',
    category: 'Group Travel & Holidays',
    summary: 'Custom domestic and international tour packages and chartered bus coordination.',
    costOfService: 'P2,000 / Txn + 10% Royalty',
    customerPrice: '+ P5,000 - P12,000 / Bus',
    margin: 'P5,000 - P12,000 / charter',
    steps: [
      {
        num: 1,
        title: 'Tour Consultation',
        desc: 'Consult client on group size, destination, accommodation tier, and custom excursion itineraries.',
        icon: 'fa-solid fa-comments'
      },
      {
        num: 2,
        title: 'Head Office Coordination',
        desc: 'Align with main tour coordinator, confirm hotel/transport bookings, and remit transaction fee.',
        icon: 'fa-solid fa-handshake'
      },
      {
        num: 3,
        title: 'Service Delivery & Tour Execution',
        desc: 'Render seamless travel experience with certified tour coordinators, guides, and dedicated support.',
        icon: 'fa-solid fa-route'
      }
    ]
  }
];

export default function ServiceGuidelines() {
  const [activeTab, setActiveTab] = useState(servicesData[0].id);

  const currentService = servicesData.find((s) => s.id === activeTab) || servicesData[0];

  return (
    <section id="service-guidelines" className="sg-section">
      <div className="sg-container">
        
        <div className="sg-header">
          <div className="sg-badge">
            <i className="fa-solid fa-diagram-project"></i> Standardized Fulfillment Pipelines
          </div>
          <h2 className="sg-title">
            Step-by-Step <span className="sg-title-accent">Service Processing Guidelines</span>
          </h2>
          <p className="sg-subtitle">
            Every core travel transaction is governed by structured, verified workflow pipelines connecting
            clients, branch operators, and head office coordinators with total transparency.
          </p>
        </div>

        {/* Interactive Tab Selectors */}
        <div className="sg-tabs">
          {servicesData.map((svc) => (
            <button
              key={svc.id}
              className={`sg-tab-btn ${activeTab === svc.id ? 'active' : ''}`}
              onClick={() => setActiveTab(svc.id)}
              type="button"
            >
              <i className={svc.icon}></i>
              <span>{svc.name}</span>
            </button>
          ))}
        </div>

        {/* Active Workflow Showcase Card */}
        <article className="sg-showcase-card card">
          <div className="sg-showcase-header">
            <div className="sg-showcase-meta">
              <span className="sg-category-badge">{currentService.category}</span>
              <h3 className="sg-showcase-title">{currentService.name} Workflow</h3>
              <p className="sg-showcase-desc">{currentService.summary}</p>
            </div>
            
            <div className="sg-pricing-card">
              <div className="sg-pricing-row">
                <span className="sg-pricing-label">Standard Cost of Service</span>
                <span className="sg-pricing-val">{currentService.costOfService}</span>
              </div>
              <div className="sg-pricing-row">
                <span className="sg-pricing-label">Customer Pricing Guideline</span>
                <span className="sg-pricing-val">{currentService.customerPrice}</span>
              </div>
              <div className="sg-pricing-row sg-pricing-highlight">
                <span className="sg-pricing-label">Operator Margin Potential</span>
                <span className="sg-pricing-val-margin">{currentService.margin}</span>
              </div>
            </div>
          </div>

          {/* Workflow Steps Pipeline */}
          <div className="sg-pipeline">
            {currentService.steps.map((step, idx) => (
              <div key={idx} className="sg-step-wrapper">
                <div className="sg-step-card">
                  <div className="sg-step-header">
                    <div className="sg-step-num-badge">Step {step.num}</div>
                    <div className="sg-step-icon">
                      <i className={step.icon}></i>
                    </div>
                  </div>
                  <h4 className="sg-step-title">{step.title}</h4>
                  <p className="sg-step-desc">{step.desc}</p>
                </div>
                {idx < currentService.steps.length - 1 && (
                  <div className="sg-step-connector">
                    <i className="fa-solid fa-arrow-right"></i>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="sg-footer-note">
            <i className="fa-solid fa-circle-check"></i>
            <span>
              All transactions strictly adhere to FairFly DO-52-000 quality standards with recorded tracking numbers and real-time head office validation.
            </span>
          </div>
        </article>

      </div>
    </section>
  );
}
