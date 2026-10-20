import React, { useEffect } from 'react';
import { Link } from 'react-router';
import Services from '../../../components/Shared/Services/Services';
import ServiceGuidelines from '../../../components/Landing/ServiceGuidelines/ServiceGuidelines';
import './services-page.css';

export default function ServicesPage() {
  // Set SEO title on mount
  useEffect(() => {
    document.title = 'Available Travel & Document Services | Fairfly';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="services-page-wrapper">
      {/* Main Interactive Services Catalog */}
      <main className="services-page-main">
        <Services />
      </main>

      {/* Standardized Step-by-Step Service Processing Guidelines */}
      <ServiceGuidelines />

      {/* Closing routes: track an existing request, or open a branch */}
      <section className="sp-next" aria-labelledby="sp-next-title">
        <div className="sp-next-shell">
          <span className="sp-next-index">[ 03 ] Next stop</span>
          <h2 id="sp-next-title" className="sp-sr">Next steps</h2>

          <div className="sp-next-grid">
            <Link to="/track" className="sp-next-card">
              <span className="sp-next-code">TRK</span>
              <span className="sp-next-title">Already filed a request?</span>
              <span className="sp-next-desc">
                Look up live milestones with your SRV tracking code. No login required.
              </span>
              <span className="sp-next-link">
                Track a request
                <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
              </span>
            </Link>

            <Link to="/" className="sp-next-card sp-next-card-dark">
              <span className="sp-next-code">FRN</span>
              <span className="sp-next-title">Sell this catalog from your own branch.</span>
              <span className="sp-next-desc">
                Every service above is ready for franchise partners, with zero inventory and 2 months of training.
              </span>
              <span className="sp-next-link">
                See the franchise model
                <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
