import { useState, useMemo, useRef } from 'react';
import OperatorProvider, { useOperatorContext } from '../../../context/OperatorContext';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import FilterChipGroup from '../../../components/UI/FilterChipGroup/FilterChipGroup';
import Pagination from '../../../components/UI/Pagination/Pagination';
import BaseModal from '../../../components/UI/ModalBase/BaseModal';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';
import './operator-quotations.css';

function CreateQuotationModal({ isOpen, onClose }) {
  const { userToken } = useAuthContext();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    serviceTitle: '',
    tourDates: '',
    inclusions: '',
    exclusions: '',
    rate: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.clientName || !formData.serviceTitle || !formData.rate) {
      addToast('Client name, service title, and rate are required', 'error');
      return;
    }

    ApiCaller(
      `${API_BASE_URL}/api/quotations`,
      'POST',
      formData,
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast('Quotation form created successfully', 'success');
        onClose();
      },
      (error) => {
        addToast(`Failed to create quotation: ${error.message}`, 'error');
      },
      setIsSubmitting
    );
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="580px"
      title="Create Service Quotation Form"
      subtitle="Generate a detailed quotation breakdown for a client"
      isLoading={isSubmitting}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Client Name *
            </label>
            <input
              type="text"
              name="clientName"
              placeholder="e.g. Reimier Reyes"
              value={formData.clientName}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Client Email
            </label>
            <input
              type="email"
              name="clientEmail"
              placeholder="client@email.com"
              value={formData.clientEmail}
              onChange={handleChange}
              disabled={isSubmitting}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Service Title *
            </label>
            <input
              type="text"
              name="serviceTitle"
              placeholder="e.g. Boracay Package Tour"
              value={formData.serviceTitle}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Rate per Person (PHP) *
            </label>
            <input
              type="number"
              name="rate"
              placeholder="e.g. 12000"
              value={formData.rate}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
            Inclusions
          </label>
          <input
            type="text"
            name="inclusions"
            placeholder="e.g. Flight, 3D2N Hotel, Daily Breakfast, Island Transfer"
            value={formData.inclusions}
            onChange={handleChange}
            disabled={isSubmitting}
            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
            Exclusions
          </label>
          <input
            type="text"
            name="exclusions"
            placeholder="e.g. Personal expenses, insurance"
            value={formData.exclusions}
            onChange={handleChange}
            disabled={isSubmitting}
            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="button" className="btn-cancel" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="op-quotation-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Quotation'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

function QuotationsContent() {
  const { data: quotations, loading } = useOperatorContext();
  const { userToken } = useAuthContext();
  const { addToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const filteredQuotations = useMemo(() => {
    if (!quotations) return [];
    return quotations.filter((q) => {
      const clientStr = (q.clientName || '').toLowerCase();
      const serviceStr = (q.serviceTitle || '').toLowerCase();
      const quoteNoStr = (q.quoteNo || '').toLowerCase();
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        clientStr.includes(search) ||
        serviceStr.includes(search) ||
        quoteNoStr.includes(search);

      const statusStr = (q.status || 'Draft').toLowerCase();
      const matchesStatus =
        statusFilter === 'all' || statusStr === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [quotations, searchTerm, statusFilter]);

  const paginatedQuotations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuotations.slice(start, start + pageSize);
  }, [filteredQuotations, currentPage, pageSize]);

  const handleStatusChange = (id, newStatus) => {
    ApiCaller(
      `${API_BASE_URL}/api/quotations/${id}/status`,
      'PATCH',
      { status: newStatus },
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast(`Quotation marked as ${newStatus}`, 'success');
      },
      (error) => {
        addToast(`Failed to update quotation: ${error.message}`, 'error');
      }
    );
  };

  return (
    <div className="card op-quotations-page page-fade-in">
      <div className="op-quotations-header">
        <div className="op-quotations-title">
          <i className="fa-solid fa-file-invoice-dollar" style={{ color: 'var(--purple)', fontSize: '1.5rem' }}></i>
          <div>
            <h2>Quotation Forms Management</h2>
            <p>Create and manage client service quotations with rates, inclusions, and terms</p>
          </div>
        </div>

        <button className="op-quotation-btn" onClick={() => setShowModal(true)}>
          <i className="fa-solid fa-plus"></i> Create Quotation
        </button>
      </div>

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
            <div key={q.id} className="op-quotation-card">
              <div className="op-quotation-top">
                <div>
                  <span className="op-quotation-client-name">{q.clientName}</span>
                  <span className="op-quotation-number" style={{ marginLeft: '0.75rem' }}>{q.quoteNo || 'QT-001'}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
            </div>
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

      <CreateQuotationModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}

export default function OperatorQuotations() {
  return (
    <OperatorProvider targetCollection="quotations">
      <QuotationsContent />
    </OperatorProvider>
  );
}
