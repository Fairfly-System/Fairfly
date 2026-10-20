import { useState, useMemo } from 'react';
import OperatorProvider, { useOperatorContext } from '../../../context/OperatorContext';
import Pagination from '../../../components/UI/Pagination/Pagination';
import Breadcrumbs from '../../../components/UI/Breadcrumbs/Breadcrumbs';
import PageHeader from '../../../components/UI/PageHeader/PageHeader';
import './operator-quick-links.css';

const TABS = [
  { key: 'airlines', label: 'Airlines' },
  { key: 'hotels', label: 'Hotels' },
  { key: 'government', label: 'Government' },
  { key: 'visaAndEmbassy', label: 'Visa & Embassy' },
  { key: 'other', label: 'Other' },
];

const LINK_PALETTE = [
  '#1D4ED8', // Primary Blue
  '#7C3AED', // Vivid Purple
  '#DC2626', // Warm Red
  '#B45309', // Amber Brown
  '#15803D', // Emerald Green
  '#0284C7', // Sky Blue
  '#D97706', // Ochre Amber
  '#BE185D', // Rose Pink
];

const normalizeCategoryKey = (cat) => {
  if (!cat) return 'other';
  const clean = String(cat).toLowerCase().replace(/[^a-z]/g, '');
  if (clean.includes('airline')) return 'airlines';
  if (clean.includes('hotel')) return 'hotels';
  if (clean.includes('gov')) return 'government';
  if (clean.includes('visa') || clean.includes('embassy')) return 'visaAndEmbassy';
  return 'other';
};

function QuickLinksContent() {
  const { data: dbQuickLinks, loading } = useOperatorContext();
  const [active, setActive] = useState('airlines');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Compute individual link counts per category tab from real-time database records
  const categoryCounts = useMemo(() => {
    const counts = {
      airlines: 0,
      hotels: 0,
      government: 0,
      visaAndEmbassy: 0,
      other: 0,
    };

    if (Array.isArray(dbQuickLinks)) {
      dbQuickLinks.forEach((link) => {
        const catKey = normalizeCategoryKey(link.category);
        if (counts[catKey] !== undefined) {
          counts[catKey] += 1;
        } else {
          counts.other += 1;
        }
      });
    }

    return counts;
  }, [dbQuickLinks]);

  // Filter links for the active tab strictly from Firestore records without hardcoded fallbacks
  const activeCategoryLinks = useMemo(() => {
    if (!Array.isArray(dbQuickLinks) || dbQuickLinks.length === 0) return [];

    return dbQuickLinks
      .filter((link) => normalizeCategoryKey(link.category) === active)
      .map((link, idx) => ({
        id: link.id,
        label: link.title || 'Quick Link',
        url: link.url || '#',
        color: link.color || LINK_PALETTE[idx % LINK_PALETTE.length],
      }));
  }, [dbQuickLinks, active]);

  const paginatedLinks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return activeCategoryLinks.slice(start, start + pageSize);
  }, [activeCategoryLinks, currentPage, pageSize]);

  const breadcrumbItems = [
    { label: 'Dashboard', to: '/operator' },
    { label: 'Quick Links' },
  ];

  return (
    <main className="operator-quick-links-page page-fade-in">
      <Breadcrumbs items={breadcrumbItems} />

      <PageHeader
        title="Quick Links - External Resources"
        subtitle="Fast access to frequently used websites for service fulfillment"
        illustrationSrc="/pageImages/operator/quick-links.png"
      />

      <section className="card op-quicklinks">
        <div className="op-tab-strip">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`op-tab ${active === tab.key ? 'active' : ''}`}
              onClick={() => {
                setActive(tab.key);
                setCurrentPage(1);
              }}
            >
              {tab.label} ({categoryCounts[tab.key] || 0})
            </button>
          ))}
        </div>

        <div className="op-links-grid">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`skel-link-${i}`}
                className="op-link-btn skeleton"
                style={{ height: '3.25rem', opacity: 0.85 }}
                aria-busy="true"
              />
            ))
          ) : paginatedLinks.length === 0 ? (
            <div className="empty-state-box">
              <p>No quick links available in this category</p>
            </div>
          ) : (
            paginatedLinks.map((link) => (
              <a
                key={link.id || link.label}
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
      </section>
    </main>
  );
}

export default function OperatorQuickLinks() {
  return (
    <OperatorProvider targetCollection="quickLinks">
      <QuickLinksContent />
    </OperatorProvider>
  );
}
