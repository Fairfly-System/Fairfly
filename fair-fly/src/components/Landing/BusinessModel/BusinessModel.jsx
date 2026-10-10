import React from 'react';
import './business-model.css';

const fairflyPerks = [
  {
    code: '[ ASSET-01 ]',
    icon: 'fa-solid fa-boxes-packing',
    title: 'Zero Inventory Needed',
    desc: 'No physical stockrooms, expiring products, or locked-up warehouse capital. Focus 100% on serving clients.'
  },
  {
    code: '[ CASH-02 ]',
    icon: 'fa-solid fa-money-bill-transfer',
    title: 'Cash-Basis Upfront Revenue',
    desc: 'Receive client payments before rendering services. Eliminate accounts receivable risks and bad debt.'
  },
  {
    code: '[ CLOUD-03 ]',
    icon: 'fa-solid fa-laptop-file',
    title: 'Modern Counter & Virtual Office',
    desc: 'Operate with a sleek modern front desk or completely online with our cloud-backed documentation system.'
  },
  {
    code: '[ DIST-04 ]',
    icon: 'fa-solid fa-globe',
    title: 'Nationwide Distribution',
    desc: 'Distribute tickets, tours, and documents nationwide without factories, assembly lines, or heavy overhead.'
  }
];

const conventionalPitfalls = [
  {
    code: '[ TRAD-01 ]',
    icon: 'fa-solid fa-triangle-exclamation',
    title: 'Heavy Capital Locked in Stock',
    desc: 'Physical merchandise sitting in storage risking damage, expiration, obsolescence, and depreciation.'
  },
  {
    code: '[ TRAD-02 ]',
    icon: 'fa-solid fa-warehouse',
    title: 'Expensive Storage & Warehousing',
    desc: 'High recurring rental expenses for stockrooms, physical inventory management, and logistical hassle.'
  },
  {
    code: '[ TRAD-03 ]',
    icon: 'fa-solid fa-hand-holding-dollar',
    title: 'Credit & Payment Collection Delays',
    desc: 'Delivering goods on credit terms and chasing delayed payments from clients and distributors.'
  }
];

export default function BusinessModel() {
  return (
    <section id="business-model" className="bm-section">
      {/* Travel Background Layer with Opacity 0.12 */}
      <div className="bm-bg-container" aria-hidden="true">
        <img
          src="/business_model_bg.jpg"
          alt=""
          className="bm-bg-img"
        />
        <div className="bm-bg-overlay" />
      </div>

      <div className="bm-container">
        
        <div className="bm-header">
          <div className="bm-eyebrow">
            <span className="bm-eyebrow-accent" />
            <span>Asset-light business architecture · Slides 07, 09-13</span>
          </div>
          <h2 className="bm-title">
            Re-defining travel products: <br />
            <span className="bm-title-accent">No inventory, high value.</span>
          </h2>
          <p className="bm-subtitle">
            Traditional businesses require heavy inventory, warehouse space, and high overhead.
            FairFly's model transforms travel expertise into a lean, high-margin, cash-basis operation.
          </p>
        </div>

        {/* Paper to Plane Insight Banner (Razor-Sharp) */}
        <div className="bm-insight-banner">
          <div className="bm-insight-icon">
            <i className="fa-solid fa-paper-plane"></i>
          </div>
          <div className="bm-insight-content">
            <span className="bm-insight-tag">[ Core paradigm ]</span>
            <h3 className="bm-insight-title">"Your product is your skill & knowledge."</h3>
            <p className="bm-insight-desc">
              Travel products are as simple as folding an airplane made of paper. The value is not the paper itself —
              it is the skill, accuracy, and verified service embedded within the document. You create the product,
              fulfill it via FairFly's ISO-ready system, and earn with high profit margins.
            </p>
          </div>
        </div>

        {/* Comparison Grid (Razor-Sharp Hairline Architecture) */}
        <div className="bm-comparison-grid">
          
          {/* FairFly Side */}
          <article className="bm-model-card bm-fairfly-card">
            <div className="bm-model-header">
              <span className="bm-model-tag tag-fairfly">[ Fairfly modern model ]</span>
              <h3 className="bm-model-title">Lean, digital & scalable</h3>
              <p className="bm-model-lead">Where do you want to spend your time? In a clean modern office or a cluttered stockroom?</p>
            </div>

            <div className="bm-feature-list">
              {fairflyPerks.map((item, idx) => (
                <div key={idx} className="bm-feature-item">
                  <span className="bm-feature-code">{item.code}</span>
                  <div className="bm-feature-icon bm-icon-fairfly">
                    <i className={item.icon}></i>
                  </div>
                  <div className="bm-feature-body">
                    <h4 className="bm-feature-title">{item.title}</h4>
                    <p className="bm-feature-desc">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          {/* Conventional Side */}
          <article className="bm-model-card bm-conventional-card">
            <div className="bm-model-header">
              <span className="bm-model-tag tag-conventional">[ Conventional retailing ]</span>
              <h3 className="bm-model-title">High-risk inventory trap</h3>
              <p className="bm-model-lead">Trapped by physical goods, fixed leases, cash flow delays, and depreciating assets.</p>
            </div>

            <div className="bm-feature-list">
              {conventionalPitfalls.map((item, idx) => (
                <div key={idx} className="bm-feature-item">
                  <span className="bm-feature-code">{item.code}</span>
                  <div className="bm-feature-icon bm-icon-conventional">
                    <i className={item.icon}></i>
                  </div>
                  <div className="bm-feature-body">
                    <h4 className="bm-feature-title">{item.title}</h4>
                    <p className="bm-feature-desc">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

        </div>

      </div>
    </section>
  );
}
