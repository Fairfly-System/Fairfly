import { useState, useMemo } from 'react';
import { Outlet, Link } from 'react-router';
import OperatorProvider, { useOperatorContext } from '../../../context/OperatorContext';
import CreateInquiryFormModal from '../../../components/Operator/CreateInquiryFormModal/CreateInquiryFormModal';
import Pagination from '../../../components/UI/Pagination/Pagination';
import Breadcrumbs from '../../../components/UI/Breadcrumbs/Breadcrumbs';
import PageHeader from '../../../components/UI/PageHeader/PageHeader';
import './operator-inquiry-forms.css';

export function InquiryContent() {
  const { data: inquiryForms, loading } = useOperatorContext();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const filteredForms = useMemo(() => {
    if (!inquiryForms) return [];
    return inquiryForms.filter((f) =>
      (f.fullName || f.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.formNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.serviceType || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inquiryForms, searchTerm]);

  const paginatedForms = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredForms.slice(start, start + pageSize);
  }, [filteredForms, currentPage, pageSize]);

  const breadcrumbItems = [
    { label: 'Dashboard', to: '/operator' },
    { label: 'Inquiry Forms' },
  ];

  return (
    <main className="operator-inquiries-page page-fade-in">
      <Breadcrumbs items={breadcrumbItems} />

      <PageHeader
        title="Inquiry Forms"
        subtitle="Record, track, and process prospective client inquiries"
        illustrationSrc="/pageImages/operator/inquiry-forms.png"
        primaryAction={{
          label: 'Create Inquiry Form',
          icon: 'fa-solid fa-plus',
          onClick: () => setShowModal(true),
        }}
      />

      <section className="card op-inquiry">

      {/* Toolbar Search */}
      <div className="table-toolbar">
        <div className="search-box">
          <i className="fa-solid fa-magnifying-glass search-icon"></i>
          <input
            type="text"
            placeholder="Search by client name, Form No, or service..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          {searchTerm && (
            <button
              className="clear-search-btn"
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>
      </div>

      {/* Forms List Container */}
      <div className="op-inquiry-list">
        {loading ? (
          <div className="op-inquiry-empty">
            <p>Loading inquiry forms...</p>
          </div>
        ) : paginatedForms.length === 0 ? (
          <div className="op-inquiry-empty">
            <i className="fa-regular fa-folder-open"></i>
            <h3>No inquiry forms found</h3>
            <p>Create your first client inquiry intake form</p>
          </div>
        ) : (
          paginatedForms.map((form) => (
            <article key={form.id} className="op-inquiry-card">
              <div className="op-inquiry-card-main">
                <div className="op-inquiry-icon">
                  <i className="fa-solid fa-file-lines"></i>
                </div>
                <div>
                  <p className="op-inquiry-card-title">{form.fullName || form.title || 'Client Inquiry'}</p>
                  <p className="op-inquiry-card-meta">
                    Form No: <strong>{form.formNo || 'SAF-01'}</strong> · Service: {form.serviceType || 'General'} · Phone: {form.phoneNumber || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="op-inquiry-card-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Link
                  to={`/operator/inquiry-forms/${form.id}`}
                  className="ticket-action-btn view-thread-btn"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem', textDecoration: 'none', background: 'var(--purple-light-2)', color: 'var(--purple-dark)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <i className="fa-solid fa-eye"></i> View
                </Link>
                <span className="status-pill status-pill-active">{form.status || 'Active'}</span>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredForms.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      </section>

      {showModal && <CreateInquiryFormModal onClose={() => setShowModal(false)} />}
    </main>
  );
}

export default function OperatorInquiryForms() {
  return (
    <OperatorProvider targetCollection="inquiries">
      <Outlet />
    </OperatorProvider>
  );
}
