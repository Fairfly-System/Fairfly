import React, { useEffect } from 'react';
import Services from '../../../components/Shared/Services/Services';
import FooterCard from '../../../components/UI/FooterCard/FooterCard';
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

      {/* Footer Call to Action */}
      <FooterCard />
    </div>
  );
}
