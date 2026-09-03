import { useState, useMemo, useEffect } from 'react';
import { Outlet, Link } from 'react-router';
import OperatorProvider, { useOperatorContext } from '../../../context/OperatorContext';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import FilterChipGroup from '../../../components/UI/FilterChipGroup/FilterChipGroup';
import Pagination from '../../../components/UI/Pagination/Pagination';
import BaseModal from '../../../components/UI/ModalBase/BaseModal';
import Breadcrumbs from '../../../components/UI/Breadcrumbs/Breadcrumbs';
import PageHeader from '../../../components/UI/PageHeader/PageHeader';
import { createQuotation, updateQuotationStatus } from '../../../services/quotationService';
import useDebounce from '../../../hooks/useDebounce';
import toFriendlyMessage from '../../../utils/friendlyErrors';
import './operator-quotations.css';

import CreateQuotationModal from '../../../components/Operator/CreateQuotationModal/CreateQuotationModal';

import { fetchServices } from '../../../services/serviceService';

export function QuotationsContent() {
  const { data: quotations, loading } = useOperatorContext();
  const { userToken } = useAuthContext();
  const { addToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState('all');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const filteredQuotations = useMemo(() => {
    if (!quotations) return [];
    return quotations.filter((q) => {
      const clientStr = (q.clientName || '').toLowerCase();
      const serviceStr = (q.serviceTitle || '').toLowerCase();
      const quoteNoStr = (q.quoteNo || '').toLowerCase();
      const search = debouncedSearch.toLowerCase();

      const matchesSearch =
        clientStr.includes(search) ||
        serviceStr.includes(search) ||
        quoteNoStr.includes(search);

      const statusStr = (q.status || 'Draft').toLowerCase();
      const matchesStatus =
        statusFilter === 'all' || statusStr === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [quotations, debouncedSearch, statusFilter]);

  const paginatedQuotations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuotations.slice(start, start + pageSize);
  }, [filteredQuotations, currentPage, pageSize]);

  const handleStatusChange = (id, newStatus) => {
    updateQuotationStatus(
      userToken,
      id,
      newStatus,
      () => {
        addToast(`Quotation marked as ${newStatus}`, 'success');
      },
      (error) => {
        addToast(toFriendlyMessage(error, 'Could not update quotation status. Please try again.'), 'error');
      }
    );
  };

  const breadcrumbItems = [
    { label: 'Dashboard', to: '/operator' },
    { label: 'Quotations' },
  ];

  return (
    <main className="operator-quotations-page page-fade-in">
      <Breadcrumbs items={breadcrumbItems} />

      <PageHeader
        title="Quotation Forms Management"
        subtitle="Create and manage client service quotations with rates, inclusions, and terms"
        illustrationSrc="/pageImages/operator/quotations.png"
        primaryAction={{
          label: 'Create Quotation',
          icon: 'fa-solid fa-plus',
          onClick: () => setShowModal(true),
        }}
      />

      <section className="card op-quotations-page">

        <div className="table-toolbar">
          <div className="search-box">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              placeholder="Search by client name, quote number, or service..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchTerm && (
              <button className="clear-search-btn" onClick={() => setSearchTerm('')}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>

          <FilterChipGroup
            chips={[
              { value: 'all', label: `All (${(quotations || []).length})` },
              { value: 'draft', label: 'Draft' },
              { value: 'sent', label: 'Sent' },
              { value: 'confirmed', label: 'Confirmed' },
            ]}
            activeChip={statusFilter}
            onChipChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="op-quotations-list">
          {loading ? (
            <div className="empty-state-box"><p>Loading quotations...</p></div>
          ) : paginatedQuotations.length === 0 ? (
            <div className="empty-state-box">
              <i className="fa-regular fa-folder-open empty-icon"></i>
              <p>No quotation forms match your criteria</p>
            </div>
          ) : (
            paginatedQuotations.map((q) => (
              <article key={q.id} className="op-quotation-card">
                <div className="op-quotation-top">
                  <div>
                    <span className="op-quotation-client-name">{q.clientName}</span>
                    <span className="op-quotation-number" style={{ marginLeft: '0.75rem' }}>{q.quoteNo || 'QT-001'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Link
                      to={`/operator/quotations/${q.id}`}
                      className="ticket-action-btn view-thread-btn"
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.775rem', textDecoration: 'none', background: 'var(--purple-light-2)', color: 'var(--purple-dark)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <i className="fa-solid fa-eye"></i> View
                    </Link>
                    <span className="status-pill status-pill-active">{q.status || 'Draft'}</span>
                    {q.status !== 'Sent' && (
                      <button
                        className="ticket-action-btn view-thread-btn"
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.775rem' }}
                        onClick={() => handleStatusChange(q.id, 'Sent')}
                      >
                        Mark as Sent
                      </button>
                    )}
                  </div>
                </div>

                <div className="op-quotation-details-grid">
                  <div className="op-quotation-meta-item">
                    <label>Service Title</label>
                    <span>{q.serviceTitle}</span>
                  </div>
                  <div className="op-quotation-meta-item">
                    <label>Rate (PHP)</label>
                    <span style={{ color: '#16a34a' }}>₱{(q.rate || 0).toLocaleString()}</span>
                  </div>
                  <div className="op-quotation-meta-item">
                    <label>Inclusions</label>
                    <span>{q.inclusions || 'Standard Package'}</span>
                  </div>
                  <div className="op-quotation-meta-item">
                    <label>Prepared By</label>
                    <span>{q.preparedBy || 'Operator'}</span>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalItems={filteredQuotations.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </section>

      <CreateQuotationModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </main>
  );
}

export default function OperatorQuotations() {
  return (
    <OperatorProvider targetCollection="quotations">
      <Outlet />
    </OperatorProvider>
  );
}
