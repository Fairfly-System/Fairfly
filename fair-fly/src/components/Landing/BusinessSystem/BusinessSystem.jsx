import React from 'react';
import './business-system.css';

const systemPillars = [
  {
    icon: 'fa-solid fa-book-bookmark',
    iconColor: '#6B6FF5',
    iconBg: 'rgba(107, 111, 245, 0.1)',
    title: 'Procedure Manuals & Standard Forms',
    desc: 'Pre-formatted digital forms and rigorous SOPs standardize every operation, eliminating guesswork and ensuring consistent, ISO-level execution across all branches.',
    badge: 'Standardized SOPs'
  },
  {
    icon: 'fa-solid fa-cloud-arrow-up',
    iconColor: '#F97316',
    iconBg: 'rgba(249, 115, 22, 0.1)',
    title: '100% Online Cloud & Virtual Office',
    desc: 'Real-time database accessibility anytime, anywhere. Manage document requests, appointments, transactions, and client communications seamlessly from any device.',
    badge: 'Cloud Powered'
  },
  {
    icon: 'fa-solid fa-users-gear',
    iconColor: '#2EBB4C',
    iconBg: 'rgba(46, 187, 76, 0.1)',
    title: 'Scalable High-Volume Inquiry Intake',
    desc: 'Engineered to effortlessly handle continuous client traffic and large inquiry volumes with lean staffing, maximizing operational throughput and revenue.',
    badge: 'Lean & Scalable'
  },
  {
    icon: 'fa-solid fa-chart-line',
    iconColor: '#3B82F6',
    iconBg: 'rgba(59, 130, 246, 0.1)',
    title: 'Quality Criteria & Predictive Analytics',
    desc: 'Continuous performance monitoring, SLA tracking, and business condition forecasting empower operators to make data-driven management decisions.',
    badge: 'Performance Driven'
  }
];

const highlights = [
  { icon: 'fa-solid fa-certificate', text: 'ISO: 9001-2000 Ready Standards' },
  { icon: 'fa-solid fa-network-wired', text: 'Real-Time Online Central Database' },
  { icon: 'fa-solid fa-handshake-angle', text: 'Supported by Leading Travel Partners' },
  { icon: 'fa-solid fa-shield-halved', text: 'Zero Compromise Operational Security' }
];

export default function BusinessSystem() {
  return (
    <section id="business-system" className="bs-section">
      <div className="bs-container">
        
        <div className="bs-header">
          <div className="bs-badge">
            <i className="fa-solid fa-award"></i> Quality Management System • DO-52-000
          </div>
          <h2 className="bs-title">
            Engineered on International <br />
            <span className="bs-title-accent">ISO: 9001-2000 Standards</span>
          </h2>
          <p className="bs-subtitle">
            FairFly's proprietary business architecture transforms travel management through standardized procedures,
            cloud infrastructure, and lean operational workflows designed for predictable growth.
          </p>
        </div>

        <div className="bs-grid">
          {systemPillars.map((pillar, idx) => (
            <article key={idx} className="bs-card card">
              <div className="bs-card-top">
                <div 
                  className="bs-card-icon" 
                  style={{ backgroundColor: pillar.iconBg, color: pillar.iconColor }}
                >
                  <i className={pillar.icon}></i>
                </div>
                <span className="bs-card-pill">{pillar.badge}</span>
              </div>
              
              <h3 className="bs-card-title">{pillar.title}</h3>
              <p className="bs-card-desc">{pillar.desc}</p>
            </article>
          ))}
        </div>

        <div className="bs-highlights-bar card">
          <div className="bs-highlights-grid">
            {highlights.map((item, idx) => (
              <div key={idx} className="bs-highlight-item">
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
