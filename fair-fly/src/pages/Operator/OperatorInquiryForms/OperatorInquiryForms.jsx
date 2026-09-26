import { useState, useMemo } from 'react';
import { Outlet, Link } from 'react-router';
import OperatorProvider, { useOperatorContext } from '../../../context/OperatorContext';
import { useAuthContext } from '../../../context/AuthContext';
import CreateInquiryFormModal from '../../../components/Operator/CreateInquiryFormModal/CreateInquiryFormModal';
import Pagination from '../../../components/UI/Pagination/Pagination';
import Breadcrumbs from '../../../components/UI/Breadcrumbs/Breadcrumbs';
import PageHeader from '../../../components/UI/PageHeader/PageHeader';
import useDebounce from '../../../hooks/useDebounce';
import './operator-inquiry-forms.css';

export function InquiryContent() {
  const { data: inquiryForms, loading } = useOperatorContext();
  const { user, userDetails } = useAuthContext();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const operatorForms = useMemo(() => {
    if (!inquiryForms) return [];
    if (user?.uid && (userDetails?.role === 'operator' || userDetails?.role === 'branch_operator')) {
      return inquiryForms.filter((f) => f.branchUid === user.uid || f.operatorId === user.uid);
    }
    return inquiryForms;
  }, [inquiryForms, user, userDetails]);

  const filteredForms = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return operatorForms.filter((f) =>
      (f.fullName || f.clientName || f.title || '').toLowerCase().includes(q) ||
      (f.formNo || '').toLowerCase().includes(q) ||
      (f.serviceType || '').toLowerCase().includes(q)
    );
  }, [operatorForms, debouncedSearch]);

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
          Array.from({ length: 4 }).map((_, i) => (
            <article key={`skel-inq-${i}`} className="op-inquiry-card" aria-busy="true">
              <div className="op-inquiry-card-main">
                <div className="skeleton skeleton-circle" style={{ width: '2.5rem', height: '2.5rem', minWidth: '2.5rem' }} />
                <div style={{ width: '100%', maxWidth: '380px' }}>
                  <div className="skeleton skeleton-title" style={{ width: '60%', height: '1.125rem', marginBottom: '0.35rem' }} />
                  <div className="skeleton skeleton-text" style={{ width: '90%', height: '0.8rem', margin: 0 }} />
                </div>
              </div>
              <div className="op-inquiry-card-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div className="skeleton skeleton-btn" style={{ width: '4.5rem', height: '1.875rem' }} />
                <div className="skeleton skeleton-badge" style={{ width: '4rem', height: '1.5rem' }} />
              </div>
            </article>
          ))
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
