import React from 'react';
import './business-model.css';

const fairflyPerks = [
  {
    icon: 'fa-solid fa-boxes-packing',
    title: 'Zero Inventory Needed',
    desc: 'No physical stockrooms, expiring products, or locked-up warehouse capital. Focus 100% on serving clients.'
  },
  {
    icon: 'fa-solid fa-money-bill-transfer',
    title: 'Cash-Basis Upfront Revenue',
    desc: 'Receive client payments before rendering services. Eliminate accounts receivable risks and bad debt.'
  },
  {
    icon: 'fa-solid fa-laptop-file',
    title: 'Modern Counter & Virtual Office',
    desc: 'Operate with a sleek modern front desk or completely online with our cloud-backed documentation system.'
  },
  {
    icon: 'fa-solid fa-globe',
    title: 'Nationwide Distribution',
    desc: 'Distribute tickets, tours, and documents nationwide without factories, assembly lines, or heavy overhead.'
  }
];

const conventionalPitfalls = [
  {
    icon: 'fa-solid fa-triangle-exclamation',
    title: 'Heavy Capital Locked in Stock',
    desc: 'Physical merchandise sitting in storage risking damage, expiration, obsolescence, and depreciation.'
  },
  {
    icon: 'fa-solid fa-warehouse',
    title: 'Expensive Storage & Warehousing',
    desc: 'High recurring rental expenses for stockrooms, physical inventory management, and logistical hassle.'
  },
  {
    icon: 'fa-solid fa-hand-holding-dollar',
    title: 'Credit & Payment Collection Delays',
    desc: 'Delivering goods on credit terms and chasing delayed payments from clients and distributors.'
  }
];

export default function BusinessModel() {
  return (
    <section id="business-model" className="bm-section">
      <div className="bm-container">
        
        <div className="bm-header">
          <div className="bm-badge">
            <i className="fa-solid fa-lightbulb"></i> Asset-Light Business Model
          </div>
          <h2 className="bm-title">
            Re-Defining Travel Products: <br />
            <span className="bm-title-accent">No Inventory, High Value</span>
          </h2>
          <p className="bm-subtitle">
            Traditional businesses require heavy inventory, warehouse space, and high overhead.
            FairFly's model transforms travel expertise into a lean, high-margin, cash-basis operation.
          </p>
        </div>

        {/* Paper to Plane Insight Banner */}
        <div className="bm-insight-banner card">
          <div className="bm-insight-icon">
            <i className="fa-solid fa-paper-plane"></i>
          </div>
          <div className="bm-insight-content">
            <h3 className="bm-insight-title">"Your Product is Your Skill & Knowledge"</h3>
            <p className="bm-insight-desc">
              Travel products are as simple as folding an airplane made of paper. The value is not the paper itself —
              it is the skill, accuracy, and verified service embedded within the document. You create the product,
              fulfill it via FairFly's ISO-ready system, and earn with high profit margins.
            </p>
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="bm-comparison-grid">
          
          {/* FairFly Side */}
          <article className="bm-model-card bm-fairfly-card card">
            <div className="bm-model-header">
              <div className="bm-model-badge bm-badge-fairfly">
                <i className="fa-solid fa-check"></i> FairFly Modern Model
              </div>
              <h3 className="bm-model-title">Lean, Digital & Scalable</h3>
              <p className="bm-model-lead">Where do you want to spend your time? In a clean modern office or a cluttered stockroom?</p>
            </div>

            <div className="bm-feature-list">
              {fairflyPerks.map((item, idx) => (
                <div key={idx} className="bm-feature-item">
                  <div className="bm-feature-icon bm-icon-fairfly">
                    <i className={item.icon}></i>
                  </div>
                  <div>
                    <h4 className="bm-feature-title">{item.title}</h4>
                    <p className="bm-feature-desc">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          {/* Conventional Side */}
          <article className="bm-model-card bm-conventional-card card">
            <div className="bm-model-header">
              <div className="bm-model-badge bm-badge-conventional">
                <i className="fa-solid fa-xmark"></i> Conventional Retail Model
              </div>
              <h3 className="bm-model-title">High Capital & Inventory Burdens</h3>
              <p className="bm-model-lead">Tied up with physical merchandise, depreciating stock, and collection headaches.</p>
            </div>

            <div className="bm-feature-list">
              {conventionalPitfalls.map((item, idx) => (
                <div key={idx} className="bm-feature-item">
                  <div className="bm-feature-icon bm-icon-conventional">
                    <i className={item.icon}></i>
                  </div>
                  <div>
                    <h4 className="bm-feature-title">{item.title}</h4>
                    <p className="bm-feature-desc">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

        </div>

        {/* Bottom Callout: Create Your Own Market */}
        <div className="bm-vision-card card">
          <div className="bm-vision-left">
            <span className="bm-vision-pill">Market Leadership</span>
            <h3 className="bm-vision-title">Create Products & Pioneer Your Market</h3>
            <p className="bm-vision-desc">
              Through the FairFly Travel & Tours business system, you gain the accreditation, digital tools, and operational backing to introduce certified travel agency solutions in your territory and grow independently.
            </p>
          </div>
          <div className="bm-vision-right">
            <a href="#franchise-section" className="btn-primary">
              <i className="fa-solid fa-arrow-trend-up"></i> Explore Franchise Benefits
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
