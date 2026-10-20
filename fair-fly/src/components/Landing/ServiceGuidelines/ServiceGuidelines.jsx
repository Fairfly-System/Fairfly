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
    <section id="service-guidelines" className="sg" aria-labelledby="sg-title">
      <div className="sg-shell">
        <header className="sg-head">
          <div>
            <span className="sg-index">[ 02 ] Standard operating procedure</span>
            <h2 id="sg-title" className="sg-title">
              Every service flies the same route,{' '}
              <span className="sg-title-accent">every single time.</span>
            </h2>
          </div>
          <p className="sg-note">
            Every service in the FairFly ecosystem follows strict, ISO-compliant workflows to guarantee
            error-free execution, predictable turnaround times, and consistent operator profit margins.
          </p>
        </header>

        <div className="sg-layout">
          {/* Service selector, styled as a departure board */}
          <div className="sg-tabs" role="tablist" aria-label="Service processing categories" aria-orientation="vertical">
            {servicesData.map((service, idx) => {
              const isActive = activeTab === service.id;
              return (
                <button
                  key={service.id}
                  id={`sg-tab-${service.id}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="sg-panel"
                  className={`sg-tab ${isActive ? 'is-active' : ''}`}
                  onClick={() => setActiveTab(service.id)}
                >
                  <span className="sg-tab-code">{String(idx + 1).padStart(2, '0')}</span>
                  <span className="sg-tab-name">
                    <i className={service.icon} aria-hidden="true"></i>
                    {service.name}
                  </span>
                  <span className="sg-tab-steps">{service.steps.length} steps</span>
                </button>
              );
            })}
          </div>

          {/* Active service workflow */}
          <div
            id="sg-panel"
            key={activeService.id}
            className="sg-panel"
            role="tabpanel"
            aria-labelledby={`sg-tab-${activeService.id}`}
          >
            <div className="sg-panel-head">
              <span className="sg-panel-cat">[ {activeService.category} ]</span>
              <h3 className="sg-panel-title">{activeService.name}</h3>
              <p className="sg-panel-summary">{activeService.summary}</p>
            </div>

            <dl className="sg-econ">
              <div>
                <dt>Head office cost</dt>
                <dd>{activeService.costOfService}</dd>
              </div>
              <div>
                <dt>Client price</dt>
                <dd>{activeService.customerPrice}</dd>
              </div>
              <div className="sg-econ-margin">
                <dt>Operator margin</dt>
                <dd>{activeService.margin}</dd>
              </div>
            </dl>

            <ol className="sg-steps">
              {activeService.steps.map((step, idx) => (
                <li key={step.num} className="sg-step" style={{ '--i': idx }}>
                  <span className="sg-step-num">{step.num}</span>
                  <div className="sg-step-body">
                    <h4 className="sg-step-title">{step.title}</h4>
                    <p className="sg-step-desc">{step.desc}</p>
                  </div>
                  <i className={`${step.icon} sg-step-icon`} aria-hidden="true"></i>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
