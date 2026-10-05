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
        num: '01',
        title: 'Requirements Verification',
        desc: 'Receive identity and documentary requirements from the client and verify against DFA regulatory checklists.',
        icon: 'fa-solid fa-list-check'
      },
      {
        num: '02',
        title: 'Main Office Submission',
        desc: 'Submit verified requirements to head office with fee transfer and courier dispatch.',
        icon: 'fa-solid fa-paper-plane'
      },
      {
        num: '03',
        title: 'DFA Appearance Schedule',
        desc: 'Receive confirmed DFA appointment slot for client personal appearance and biometric capture.',
        icon: 'fa-solid fa-calendar-check'
      },
      {
        num: '04',
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
        num: '01',
        title: 'Inquiry Intake',
        desc: 'Capture complete certificate details and authorization from client at the branch or online portal.',
        icon: 'fa-solid fa-file-pen'
      },
      {
        num: '02',
        title: 'Data & Bank Transfer',
        desc: 'Transmit certificate data electronically to head office and remit payment via dedicated bank channel.',
        icon: 'fa-solid fa-building-columns'
      },
      {
        num: '03',
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
        num: '01',
        title: 'Flight Inquiry & Routing',
        desc: 'Input desired travel dates, destination routing, and passenger preferences into the ticketing desk.',
        icon: 'fa-solid fa-magnifying-glass-location'
      },
      {
        num: '02',
        title: 'Instant Fare Resolution',
        desc: 'Receive real-time flight options, seat allocations, and verified GDS/IATA pricing.',
        icon: 'fa-solid fa-tags'
      },
      {
        num: '03',
        title: 'Payment Settlement',
        desc: 'Client pays upfront; branch transfers payment directly to the head office ticketing account.',
        icon: 'fa-solid fa-receipt'
      },
      {
        num: '04',
        title: 'Ticket Issuance & Delivery',
        desc: 'Receive official e-ticket within minutes; transmit instantly via email or branch printout.',
        icon: 'fa-solid fa-ticket'
      }
    ]
  },
  {
    id: 'tour',
    name: 'Tour Packages & Visa',
    icon: 'fa-solid fa-map-location-dot',
    category: 'Leisure & Visas',
    summary: 'Comprehensive domestic/international tour packages and embassy visa assistance.',
    costOfService: 'Operator Net Cost',
    customerPrice: 'Net + 15% - 25% Markup',
    margin: 'P1,500 - P5,000 / booking',
    steps: [
      {
        num: '01',
        title: 'Client Profiling & Itinerary',
        desc: 'Collect passenger details, travel dates, hotel grade preferences, and visa requirements.',
        icon: 'fa-solid fa-clipboard-user'
      },
      {
        num: '02',
        title: 'Quotation Generation',
        desc: 'Generate comprehensive itemized quotation with clear inclusions, exclusions, and payment schedule.',
        icon: 'fa-solid fa-calculator'
      },
      {
        num: '03',
        title: 'Confirmation & Vouchers',
        desc: 'Issue official hotel vouchers, tour itineraries, flight confirmations, and emergency travel insurance.',
        icon: 'fa-solid fa-file-shield'
      }
    ]
  }
];

export default function ServiceGuidelines() {
  const [activeTab, setActiveTab] = useState(servicesData[0].id);
  const activeService = servicesData.find((s) => s.id === activeTab) || servicesData[0];

  return (
    <section id="service-guidelines" className="sg-section">
      <div className="sg-container">
        
        <div className="sg-header">
          <div className="sg-eyebrow">
            <span className="sg-eyebrow-accent" />
            <span>OPERATIONAL SOP MANUAL · SLIDES 14-17</span>
          </div>
          <h2 className="sg-title">
            STANDARDIZED STEP-BY-STEP <br />
            <span className="sg-title-accent">SERVICE PROCESSING GUIDELINES.</span>
          </h2>
          <p className="sg-subtitle">
            Every service in the FairFly ecosystem follows strict, ISO-compliant workflows to guarantee error-free
            execution, predictable turnaround times, and consistent operator profit margins.
          </p>
        </div>

        {/* Sharp Rectangular Service Tabs */}
        <div className="sg-tabs" role="tablist" aria-label="Service Processing Categories">
          {servicesData.map((service) => (
            <button
              key={service.id}
              role="tab"
              aria-selected={activeTab === service.id}
              className={`sg-tab-btn ${activeTab === service.id ? 'active' : ''}`}
              onClick={() => setActiveTab(service.id)}
            >
              <i className={service.icon}></i>
              <span>{service.name}</span>
            </button>
          ))}
        </div>

        {/* Active Service Workflow Display */}
        <div className="sg-workflow-panel">
          <div className="sg-workflow-header">
            <div className="sg-header-meta">
              <span className="sg-category-tag">[ {activeService.category} ]</span>
              <h3 className="sg-workflow-title">{activeService.name}</h3>
              <p className="sg-workflow-summary">{activeService.summary}</p>
            </div>
            
            {/* Financial Economics Strip */}
            <div className="sg-economics-strip">
              <div className="sg-econ-item">
                <span className="sg-econ-label">HEAD OFFICE COST</span>
                <span className="sg-econ-val">{activeService.costOfService}</span>
              </div>
              <div className="sg-econ-item">
                <span className="sg-econ-label">CLIENT PRICE</span>
                <span className="sg-econ-val">{activeService.customerPrice}</span>
              </div>
              <div className="sg-econ-item highlight">
                <span className="sg-econ-label">OPERATOR PROFIT MARGIN</span>
                <span className="sg-econ-val margin-val">{activeService.margin}</span>
              </div>
            </div>
          </div>

          {/* Sequential Process Steps Grid */}
          <div className="sg-steps-grid">
            {activeService.steps.map((step, idx) => (
              <div key={idx} className="sg-step-card">
                <div className="sg-step-top">
                  <span className="sg-step-num">[ STEP {step.num} ]</span>
                  <div className="sg-step-icon">
                    <i className={step.icon}></i>
                  </div>
                </div>
                <h4 className="sg-step-title">{step.title}</h4>
                <p className="sg-step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
