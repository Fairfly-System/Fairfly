import React from 'react';
import './business-system.css';

const systemPillars = [
  {
    code: '[ SOP-01 ]',
    icon: 'fa-solid fa-book-bookmark',
    iconColor: '#5558E3',
    iconBg: '#EEF2FF',
    title: 'Procedure Manuals & Standard Forms',
    desc: 'Pre-formatted digital forms and rigorous SOPs standardize every operation, eliminating guesswork and ensuring consistent, ISO-level execution across all branches.',
    badge: 'STANDARDIZED SOPS'
  },
  {
    code: '[ CLOUD-02 ]',
    icon: 'fa-solid fa-cloud-arrow-up',
    iconColor: '#F97316',
    iconBg: '#FFF7ED',
    title: '100% Online Cloud & Virtual Office',
    desc: 'Real-time database accessibility anytime, anywhere. Manage document requests, appointments, transactions, and client communications seamlessly from any device.',
    badge: 'CLOUD POWERED'
  },
  {
    code: '[ SCALE-03 ]',
    icon: 'fa-solid fa-users-gear',
    iconColor: '#16A34A',
    iconBg: '#F0FDF4',
    title: 'Scalable High-Volume Inquiry Intake',
    desc: 'Engineered to effortlessly handle continuous client traffic and large inquiry volumes with lean staffing, maximizing operational throughput and revenue.',
    badge: 'LEAN & SCALABLE'
  },
  {
    code: '[ DATA-04 ]',
    icon: 'fa-solid fa-chart-line',
    iconColor: '#0284C7',
    iconBg: '#F0F9FF',
    title: 'Quality Criteria & Predictive Analytics',
    desc: 'Continuous performance monitoring, SLA tracking, and business condition forecasting empower operators to make data-driven management decisions.',
    badge: 'PERFORMANCE DRIVEN'
  }
];

const highlights = [
  { index: '01', icon: 'fa-solid fa-certificate', text: 'ISO: 9001-2000 READY STANDARDS' },
  { index: '02', icon: 'fa-solid fa-network-wired', text: 'REAL-TIME ONLINE CENTRAL DATABASE' },
  { index: '03', icon: 'fa-solid fa-handshake-angle', text: 'SUPPORTED BY LEADING TRAVEL PARTNERS' },
  { index: '04', icon: 'fa-solid fa-shield-halved', text: 'ZERO COMPROMISE OPERATIONAL SECURITY' }
];

export default function BusinessSystem() {
  return (
    <section id="business-system" className="bs-section">
      {/* Travel Background Layer with High-Contrast Legibility Overlay */}
      <div className="bs-bg-container" aria-hidden="true">
        <img
          src="/business_system_bg.jpg"
          alt=""
          className="bs-bg-img"
        />
        <div className="bs-bg-overlay" />
      </div>

      <div className="bs-container">
        
        <div className="bs-header">
          <div className="bs-eyebrow">
            <span className="bs-eyebrow-accent" />
            <span>QUALITY MANAGEMENT SYSTEM · DO-52-000 ARCHITECTURE</span>
          </div>
          <h2 className="bs-title">
            ENGINEERED ON INTERNATIONAL <br />
            <span className="bs-title-accent">ISO: 9001-2000 STANDARDS.</span>
          </h2>
          <p className="bs-subtitle">
            FairFly's proprietary business architecture transforms travel management through standardized procedures,
            cloud infrastructure, and lean operational workflows designed for predictable growth.
          </p>
        </div>

        <div className="bs-grid">
          {systemPillars.map((pillar, idx) => (
            <article key={idx} className="bs-card">
              <div className="bs-card-top">
                <div 
                  className="bs-card-icon" 
                  style={{ backgroundColor: pillar.iconBg, color: pillar.iconColor }}
                >
                  <i className={pillar.icon}></i>
                </div>
                <div className="bs-card-meta">
                  <span className="bs-card-code">{pillar.code}</span>
                  <span className="bs-card-pill">{pillar.badge}</span>
                </div>
              </div>
              
              <h3 className="bs-card-title">{pillar.title}</h3>
              <p className="bs-card-desc">{pillar.desc}</p>
            </article>
          ))}
        </div>

        {/* Sharp Highlights Grid */}
        <div className="bs-highlights-bar">
          <div className="bs-highlights-grid">
            {highlights.map((item, idx) => (
              <div key={idx} className="bs-highlight-item">
                <span className="bs-highlight-index">[{item.index}]</span>
                <div className="bs-highlight-icon">
                  <i className={item.icon}></i>
                </div>
                <span className="bs-highlight-text">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
