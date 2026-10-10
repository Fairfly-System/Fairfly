import React, { useEffect } from 'react';
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
    </div>
  );
}
