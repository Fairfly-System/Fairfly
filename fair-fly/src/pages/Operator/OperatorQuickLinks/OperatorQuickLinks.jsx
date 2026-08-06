import { useState, useMemo } from 'react';
import OperatorProvider, { useOperatorContext } from '../../../context/OperatorContext';
import Pagination from '../../../components/UI/Pagination/Pagination';
import './operator-quick-links.css';

const DEFAULT_LINKS = {
  Airlines: [
    { label: 'Cebu Pacific', url: 'https://www.cebupacificair.com', color: '#D97706' },
    { label: 'Philippine Airlines', url: 'https://www.philippineairlines.com', color: '#1D4ED8' },
    { label: 'AirAsia', url: 'https://www.airasia.com', color: '#DC2626' },
    { label: 'Singapore Airlines', url: 'https://www.singaporeair.com', color: '#1E3A8A' },
    { label: 'Cathay Pacific', url: 'https://www.cathaypacific.com', color: '#15803D' },
  ],
  Hotels: [
    { label: 'Booking.com', url: 'https://www.booking.com', color: '#1D4ED8' },
    { label: 'Agoda', url: 'https://www.agoda.com', color: '#7C3AED' },
    { label: 'Hotels.com', url: 'https://www.hotels.com', color: '#DC2626' },
    { label: 'Airbnb', url: 'https://www.airbnb.com', color: '#DB2777' },
    { label: 'Expedia', url: 'https://www.expedia.com', color: '#B45309' },
  ],
  Government: [
    { label: 'DFA Passport', url: 'https://www.passport.gov.ph', color: '#1D4ED8' },
    { label: 'PSA Serbilis', url: 'https://serbilis.psa.gov.ph', color: '#15803D' },
    { label: 'BI e-Services', url: 'https://onlineservices.immigration.gov.ph', color: '#DC2626' },
    { label: 'eGov PH', url: 'https://egov.ph', color: '#0369A1' },
  ],
  Visa: [
    { label: 'US Embassy Manila', url: 'https://ph.usembassy.gov', color: '#1D4ED8' },
    { label: 'VFS Global', url: 'https://www.vfsglobal.com', color: '#7C3AED' },
    { label: 'BLS International', url: 'https://www.blsinternational.com', color: '#DC2626' },
    { label: 'Japan Visa', url: 'https://www.ph.emb-japan.go.jp', color: '#B45309' },
  ],
};

const TABS = ['Airlines', 'Hotels', 'Government', 'Visa'];

function QuickLinksContent() {
  const { data: dbQuickLinks, loading } = useOperatorContext();
  const [active, setActive] = useState('Airlines');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const activeCategoryLinks = useMemo(() => {
    if (dbQuickLinks && dbQuickLinks.length > 0) {
      const filtered = dbQuickLinks.filter((l) => {
        const cat = (l.category || '').toLowerCase().replace(/\s+/g, '');
        const activeCat = active.toLowerCase().replace(/\s+/g, '');
        return cat === activeCat || (activeCat === 'visa' && cat.includes('visa'));
      });
      if (filtered.length > 0) {
        return filtered.map((l) => ({
          label: l.title,
          url: l.url,
          color: l.color || '#4f46e5',
        }));
      }
    }
    return DEFAULT_LINKS[active] || [];
  }, [dbQuickLinks, active]);

  const paginatedLinks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return activeCategoryLinks.slice(start, start + pageSize);
  }, [activeCategoryLinks, currentPage, pageSize]);

  return (
    <div className="card op-quicklinks page-fade-in">
      <div className="op-quicklinks-header">
        <div className="op-quicklinks-title">
          <i className="fa-solid fa-globe" style={{ color: 'var(--purple)' }}></i>
          <div>
            <h2>Quick Links - External Resources</h2>
            <p>Fast access to frequently used websites for service fulfillment</p>
          </div>
        </div>
      </div>

      <div className="op-tab-strip">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`op-tab ${active === tab ? 'active' : ''}`}
            onClick={() => {
              setActive(tab);
              setCurrentPage(1);
            }}
          >
            {tab} ({activeCategoryLinks.length})
          </button>
        ))}
      </div>

      <div className="op-links-grid">
        {loading ? (
          <div className="empty-state-box"><p>Loading quick links...</p></div>
        ) : paginatedLinks.length === 0 ? (
          <div className="empty-state-box"><p>No quick links available in this category</p></div>
        ) : (
          paginatedLinks.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="op-link-btn"
              style={{ background: link.color }}
            >
              <span>{link.label}</span>
              <i className="fa-solid fa-arrow-up-right-from-square"></i>
            </a>
          ))
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalItems={activeCategoryLinks.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}

export default function OperatorQuickLinks() {
  return (
    <OperatorProvider targetCollection="quickLinks">
      <QuickLinksContent />
    </OperatorProvider>
  );
}
