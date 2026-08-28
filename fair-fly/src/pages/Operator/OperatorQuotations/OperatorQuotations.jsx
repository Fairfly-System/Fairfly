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

import { fetchServices } from '../../../services/serviceService';

function CreateQuotationModal({ isOpen, onClose }) {
  const { user, userDetails, userToken } = useAuthContext();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeServices, setActiveServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);

  const [formData, setFormData] = useState({
    clientName: '',
    contactPerson: '',
    clientEmail: '',
    clientPhone: '',
    serviceId: '',
    serviceTitle: '',
    requirements: '',
    tourDates: '',
    inclusions: '',
    exclusions: '',
    rate: '',
    taxAmount: '',
    rateBreakdown: '',
    totalAmount: '',
    remarks: '',
    preparedByName: userDetails?.name || userDetails?.fullName || 'Emmanuel Manlapig',
    preparedByTitle: userDetails?.role === 'admin' ? 'Business Head' : 'Branch Operator',
    preparedByContact: userDetails?.phone || userDetails?.phoneNumber || '0997 4763844',
  });

  // Fetch active services (including branch exclusives)
  useEffect(() => {
    if (!isOpen) return;
    setLoadingServices(true);
    const branchUid = userDetails?.role === 'operator' ? user?.uid : null;
    fetchServices(
      branchUid,
      (services) => {
        const activeOnly = Array.isArray(services) ? services.filter(s => s.status === 'Active') : [];
        setActiveServices(activeOnly);
        setLoadingServices(false);
      },
      (err) => {
        console.error('Error loading active services for quotation modal:', err);
        setLoadingServices(false);
      }
    );
  }, [isOpen, user?.uid, userDetails?.role]);

  const extractServiceRate = (service) => {
    if (!service) return 0;
    if (typeof service.price === 'number') return service.price;
    if (typeof service.baseFee === 'number') return service.baseFee;
    const rawStr = String(service.price || service.baseFee || '0');
    const sanitized = rawStr.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(sanitized);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      // Auto-calculate Total Amount and Rate Breakdown when Rate or Tax changes
      if (name === 'rate' || name === 'taxAmount') {
        const numRate = Number(name === 'rate' ? value : prev.rate) || 0;
        const numTax = Number(name === 'taxAmount' ? value : prev.taxAmount) || 0;
        const total = numRate + numTax;
        updated.totalAmount = total > 0 ? String(total) : (numRate > 0 ? String(numRate) : '');

        if (numRate > 0) {
          if (numTax > 0) {
            updated.rateBreakdown = `Php ${numRate.toLocaleString('en-US', { minimumFractionDigits: 2 })} + Php ${numTax.toLocaleString('en-US', { minimumFractionDigits: 2 })} (Tax/Surcharge)`;
          } else {
            updated.rateBreakdown = `Php ${numRate.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
          }
        }
      }
      return updated;
    });
  };

  const handleServiceSelect = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setFormData(prev => ({
        ...prev,
        serviceId: '',
        serviceTitle: '',
        rate: '',
        totalAmount: prev.taxAmount ? String(prev.taxAmount) : '',
        rateBreakdown: ''
      }));
      return;
    }

    const matched = activeServices.find(s => s.id === selectedId);
    if (matched) {
      const reqsText = Array.isArray(matched.requirements) && matched.requirements.length > 0
        ? matched.requirements.map(r => `• ${typeof r === 'string' ? r : r.name || r.title}`).join('\n')
        : (matched.description || '');

      const baseRateNum = extractServiceRate(matched);
      const taxNum = Number(formData.taxAmount) || 0;
      const totalNum = baseRateNum + taxNum;

      let breakdownStr = '';
      if (baseRateNum > 0) {
        if (taxNum > 0) {
          breakdownStr = `Php ${baseRateNum.toLocaleString('en-US', { minimumFractionDigits: 2 })} + Php ${taxNum.toLocaleString('en-US', { minimumFractionDigits: 2 })} (Tax/Surcharge)`;
        } else {
          breakdownStr = `Php ${baseRateNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        }
      }

      setFormData(prev => ({
        ...prev,
        serviceId: matched.id,
        serviceTitle: matched.name,
        requirements: prev.requirements || reqsText,
        inclusions: prev.inclusions || (matched.description ? `- Standard ${matched.name} package` : ''),
        rate: baseRateNum > 0 ? String(baseRateNum) : (prev.rate || ''),
        totalAmount: totalNum > 0 ? String(totalNum) : (prev.totalAmount || ''),
        rateBreakdown: breakdownStr || prev.rateBreakdown
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.clientName || (!formData.serviceTitle && !formData.serviceId)) {
      addToast('Client name and service title are required', 'error');
      return;
    }

    const payload = {
      ...formData,
      rate: Number(formData.rate) || 0,
      taxAmount: Number(formData.taxAmount) || 0,
      totalAmount: Number(formData.totalAmount || formData.rate) || 0,
      branchUid: userDetails?.role === 'operator' ? user?.uid : null,
      branchName: userDetails?.branchName || userDetails?.name || 'Branch Office',
    };

    createQuotation(
      userToken,
      payload,
      () => {
        addToast('Quotation form created successfully', 'success');
        onClose();
      },
      (error) => {
        addToast(toFriendlyMessage(error, 'Could not create quotation. Please check your inputs.'), 'error');
      },
      setIsSubmitting
    );
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="680px"
      title="Create Service Quotation Form"
      subtitle="Generate a structured quotation matching official FairFly format"
      isLoading={isSubmitting}
    >
      <form onSubmit={handleSubmit} className="form-column" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>

        {/* Section 1: Client & Contact */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <i className="fa-solid fa-building" style={{ marginRight: '0.4rem' }}></i> Client Information
          </h4>

          <div className="form-grid-2">
            <div className="form-column">
              <label className="form-label">Name of Client / Company *</label>
              <input
                type="text"
                name="clientName"
                placeholder="e.g. COSMETIQUE ASIA CORP."
                value={formData.clientName}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className="form-input"
              />
            </div>

            <div className="form-column">
              <label className="form-label">Contact Person</label>
              <input
                type="text"
                name="contactPerson"
                placeholder="e.g. Ms. Marichu Kalalang"
                value={formData.contactPerson}
                onChange={handleChange}
                disabled={isSubmitting}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-column">
              <label className="form-label">Contact Phone / Mobile</label>
              <input
                type="text"
                name="clientPhone"
                placeholder="e.g. 0917 123 4567"
                value={formData.clientPhone}
                onChange={handleChange}
                disabled={isSubmitting}
                className="form-input"
              />
            </div>

            <div className="form-column">
              <label className="form-label">Client Email</label>
              <input
                type="email"
                name="clientEmail"
                placeholder="client@company.com"
                value={formData.clientEmail}
                onChange={handleChange}
                disabled={isSubmitting}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Service & Requirements */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <i className="fa-solid fa-layer-group" style={{ marginRight: '0.4rem' }}></i> Service & Requirements
          </h4>

          <div className="form-grid-2">
            <div className="form-column">
              <label className="form-label">Select Active Service *</label>
              <select
                name="serviceId"
                value={formData.serviceId}
                onChange={handleServiceSelect}
                disabled={isSubmitting || loadingServices}
                className="form-input"
              >
                <option value="">-- Choose Active Catalog Service --</option>
                {activeServices.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.isBranchExclusive ? `(Branch: ${s.branchName || 'Exclusive'})` : ''} - {s.price || 'PHP ' + (s.baseFee || '')}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-column">
              <label className="form-label">Service / Tour Subject Title *</label>
              <input
                type="text"
                name="serviceTitle"
                placeholder="e.g. 3D/2N Bolinao-Alaminos Tourist Bus Package"
                value={formData.serviceTitle}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-column">
            <label className="form-label">Requirements / Unit Specifications</label>
            <textarea
              name="requirements"
              placeholder="• (1) Unit Tourist Bus&#10;• Equipped with video and audio entertainment system&#10;• 49 Regular seats&#10;• 3D/2N – QC-Bolinao-Alaminos-QC"
              value={formData.requirements}
              onChange={handleChange}
              rows={3}
              disabled={isSubmitting}
              className="form-input"
            />
          </div>

          <div className="form-column">
            <label className="form-label">Tour Dates / Itinerary Breakdown</label>
            <textarea
              name="tourDates"
              placeholder="April 29, 2023: Pick up QC to Bolinao&#10;April 30, 2023: Bolinao to Alaminos&#10;May 1, 2023: Alaminos to QC"
              value={formData.tourDates}
              onChange={handleChange}
              rows={3}
              disabled={isSubmitting}
              className="form-input"
            />
          </div>
        </div>

        {/* Section 3: Inclusions & Exclusions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <i className="fa-solid fa-list-check" style={{ marginRight: '0.4rem' }}></i> Inclusions & Exclusions
          </h4>

          <div className="form-grid-2">
            <div className="form-column">
              <label className="form-label">Inclusions</label>
              <textarea
                name="inclusions"
                placeholder="- Withholding tax of 2%&#10;- Driver's Fee, food and lodging"
                value={formData.inclusions}
                onChange={handleChange}
                rows={3}
                disabled={isSubmitting}
                className="form-input"
              />
            </div>

            <div className="form-column">
              <label className="form-label">Exclusions</label>
              <textarea
                name="exclusions"
                placeholder="- Toll Fee (NLEX/TFLEX) Estimated amount Php2,000-Php2,500"
                value={formData.exclusions}
                onChange={handleChange}
                rows={3}
                disabled={isSubmitting}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Rates & Payment Terms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <i className="fa-solid fa-money-bill-wave" style={{ marginRight: '0.4rem' }}></i> Rates & Remarks
          </h4>

          <div className="form-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div className="form-column">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Base Rate (PHP) *</span>
                {formData.serviceId && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--purple)', fontWeight: 600 }}>
                    <i className="fa-solid fa-lock" style={{ marginRight: '0.2rem' }}></i> From Service
                  </span>
                )}
              </label>
              <input
                type="number"
                name="rate"
                placeholder={formData.serviceId ? "Auto-retrieved" : "e.g. 55000"}
                value={formData.rate}
                onChange={handleChange}
                required
                readOnly={Boolean(formData.serviceId)}
                disabled={isSubmitting}
                className="form-input"
                style={formData.serviceId ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#1e293b', fontWeight: 600 } : {}}
              />
            </div>

            <div className="form-column">
              <label className="form-label">Tax / Surcharge (PHP)</label>
              <input
                type="number"
                name="taxAmount"
                placeholder="1100"
                value={formData.taxAmount}
                onChange={handleChange}
                disabled={isSubmitting}
                className="form-input"
              />
            </div>

            <div className="form-column">
              <label className="form-label">Total Amount (PHP) *</label>
              <input
                type="number"
                name="totalAmount"
                placeholder="56100"
                value={formData.totalAmount}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className="form-input"
                style={{ fontWeight: 700, color: 'var(--purple)' }}
              />
            </div>
          </div>

          <div className="form-column">
            <label className="form-label">Rate Breakdown Summary Line</label>
            <input
              type="text"
              name="rateBreakdown"
              placeholder="e.g. Php 55,000.00/bus + Php1,100.00 / 2% Withholding tax"
              value={formData.rateBreakdown}
              onChange={handleChange}
              disabled={isSubmitting}
              className="form-input"
            />
          </div>

          <div className="form-column">
            <label className="form-label">Remarks & Payment Terms</label>
            <textarea
              name="remarks"
              placeholder="- Initial payment of Php 10,000.00 for reservation upon confirmation&#10;- Full payment should be made on or before departure date&#10;- Cash Basis if on the day of tour"
              value={formData.remarks}
              onChange={handleChange}
              rows={3}
              disabled={isSubmitting}
              className="form-input"
            />
          </div>
        </div>

        {/* Section 5: Prepared By */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <i className="fa-solid fa-signature" style={{ marginRight: '0.4rem' }}></i> Sign-off Information
          </h4>

          <div className="form-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div className="form-column">
              <label className="form-label">Prepared By Name</label>
              <input
                type="text"
                name="preparedByName"
                placeholder="Emmanuel Manlapig"
                value={formData.preparedByName}
                onChange={handleChange}
                disabled={isSubmitting}
                className="form-input"
              />
            </div>

            <div className="form-column">
              <label className="form-label">Designation / Title</label>
              <input
                type="text"
                name="preparedByTitle"
                placeholder="Business Head"
                value={formData.preparedByTitle}
                onChange={handleChange}
                disabled={isSubmitting}
                className="form-input"
              />
            </div>

            <div className="form-column">
              <label className="form-label">Contact Number</label>
              <input
                type="text"
                name="preparedByContact"
                placeholder="0997 4763844"
                value={formData.preparedByContact}
                onChange={handleChange}
                disabled={isSubmitting}
                className="form-input"
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ background: 'var(--purple)' }}>
            {isSubmitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.35rem' }}></i>
                <span>Creating Quotation...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-file-invoice-dollar" style={{ marginRight: '0.35rem' }}></i>
                <span>Create Quotation</span>
              </>
            )}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

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
