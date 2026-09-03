import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useOperatorContext } from '../../../context/OperatorContext';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import RecordDetailLayout from '../../../components/UI/RecordDetailLayout/RecordDetailLayout';
import ConfirmationModal from '../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal';
import PdfDocumentView from '../../../components/Shared/PdfDocument/PdfDocumentView';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';
import { acceptQuotation } from '../../../services/quotationService';
import './quotation-detail.css';

const TrashIcon = (props) => <i className="fa-solid fa-trash-can" {...props}></i>;

export default function QuotationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: quotations, loading } = useOperatorContext();
  const { userToken } = useAuthContext();
  const { addToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Sync with Firestore context data
  const quotation = useMemo(() => {
    if (!quotations || !id) return null;
    return quotations.find((q) => q.id === id) || null;
  }, [quotations, id]);

  // Form state for inline editing
  const [formData, setFormData] = useState({
    clientName: '',
    contactPerson: '',
    clientEmail: '',
    clientPhone: '',
    serviceTitle: '',
    requirements: '',
    tourDates: '',
    inclusions: '',
    exclusions: '',
    rateBreakdown: '',
    rate: '',
    taxAmount: '',
    totalAmount: '',
    remarks: '',
    preparedByName: '',
    preparedByTitle: '',
    preparedByContact: '',
  });

  // Load quotation data into form fields when entering edit mode or when database updates
  useEffect(() => {
    if (quotation) {
      setFormData({
        clientName: quotation.clientName || '',
        contactPerson: quotation.contactPerson || '',
        clientEmail: quotation.clientEmail || '',
        clientPhone: quotation.clientPhone || '',
        serviceTitle: quotation.serviceTitle || '',
        requirements: quotation.requirements || '',
        tourDates: quotation.tourDates || '',
        inclusions: quotation.inclusions || '',
        exclusions: quotation.exclusions || '',
        rateBreakdown: quotation.rateBreakdown || '',
        rate: quotation.rate !== undefined ? quotation.rate : '',
        taxAmount: quotation.taxAmount !== undefined ? quotation.taxAmount : '',
        totalAmount: quotation.totalAmount !== undefined ? quotation.totalAmount : quotation.rate || '',
        remarks: quotation.remarks || '',
        preparedByName: quotation.preparedByName || quotation.preparedBy || '',
        preparedByTitle: quotation.preparedByTitle || '',
        preparedByContact: quotation.preparedByContact || '',
      });
    }
  }, [quotation, isEditing]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === 'rate' || name === 'taxAmount') {
        const numRate = Number(name === 'rate' ? value : prev.rate) || 0;
        const numTax = Number(name === 'taxAmount' ? value : prev.taxAmount) || 0;
        const total = numRate + numTax;
        updated.totalAmount = total > 0 ? String(total) : '';

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

  const handleSaveChanges = async () => {
    if (!formData.clientName || !formData.serviceTitle || formData.rate === '') {
      addToast('Client name, service title, and rate are required fields', 'error');
      return;
    }

    const payload = {
      ...formData,
      rate: Number(formData.rate) || 0,
      taxAmount: Number(formData.taxAmount) || 0,
      totalAmount: Number(formData.totalAmount || formData.rate) || 0,
    };

    ApiCaller(
      `${API_BASE_URL}/api/quotations/${quotation.id}`,
      'PATCH',
      payload,
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast('Quotation details saved successfully', 'success');
        setIsEditing(false);
      },
      (error) => {
        addToast(`Failed to update quotation: ${error.message}`, 'error');
      },
      setIsSaving
    );
  };

  const handleDelete = async () => {
    if (!quotation) return;
    ApiCaller(
      `${API_BASE_URL}/api/quotations/${quotation.id}`,
      'DELETE',
      null,
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast('Quotation deleted successfully', 'success');
        setShowDeleteConfirm(false);
        navigate('/operator/quotations');
      },
      (error) => {
        addToast(`Failed to delete quotation: ${error.message}`, 'error');
      },
      setIsDeleting
    );
  };

  const handleStatusChange = async (newStatus) => {
    if (!quotation) return;
    ApiCaller(
      `${API_BASE_URL}/api/quotations/${quotation.id}/status`,
      'PATCH',
      { status: newStatus },
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast(`Quotation status updated to ${newStatus}`, 'success');
      },
      (error) => {
        addToast(`Failed to update status: ${error.message}`, 'error');
      }
    );
  };

  const handleAcceptOnBehalf = () => {
    if (!quotation?.id) return;
    if (!window.confirm(`Accept this quotation on behalf of ${quotation.clientName}? This will immediately initialize the Custom Service in activeServices.`)) {
      return;
    }

    setIsAccepting(true);
    acceptQuotation(
      userToken,
      quotation.id,
      () => {
        setIsAccepting(false);
        addToast('Quotation accepted on behalf of client! Custom Service has been created.', 'success');
      },
      (err) => {
        setIsAccepting(false);
        console.error('Error accepting quotation on behalf:', err);
        addToast(err?.message || 'Failed to accept quotation', 'danger');
      }
    );
  };

  const breadcrumbs = [
    { label: 'Dashboard', to: '/operator' },
    { label: 'Quotations', to: '/operator/quotations' },
    { label: quotation ? (quotation.quoteNo || 'Quotation Details') : 'Loading...' },
  ];

  const isAccepted = quotation?.status === 'Accepted';

  const actions = useMemo(() => {
    if (!quotation) return [];
    if (isEditing) {
      return [
        {
          label: 'Save Changes',
          icon: 'fa-solid fa-cloud-arrow-up',
          onClick: handleSaveChanges,
          className: 'btn-primary',
          disabled: isSaving || isDeleting,
        },
        {
          label: 'Cancel',
          icon: 'fa-solid fa-xmark',
          onClick: () => setIsEditing(false),
          className: 'btn-secondary',
          disabled: isSaving || isDeleting,
        },
      ];
    }

    return [
      {
        label: 'Export to PDF (ADF-07-001)',
        icon: 'fa-solid fa-file-pdf',
        onClick: () => setShowPdfModal(true),
        className: 'btn-secondary',
        disabled: isSaving || isDeleting || isAccepting,
      },
      {
        label: 'Edit Fields',
        icon: 'fa-solid fa-pen-to-square',
        onClick: () => setIsEditing(true),
        className: 'btn-secondary',
        disabled: isSaving || isDeleting || isAccepting || isAccepted,
      },
      ...(quotation.status === 'Draft' ? [
        {
          label: 'Send to Client',
          icon: 'fa-solid fa-paper-plane',
          onClick: () => handleStatusChange('Sent'),
          className: 'btn-primary',
          disabled: isSaving || isDeleting || isAccepting,
        }
      ] : []),
      ...(!isAccepted ? [
        {
          label: isAccepting ? 'Accepting...' : 'Accept on Behalf of Client (On-Site)',
          icon: isAccepting ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-handshake',
          onClick: handleAcceptOnBehalf,
          className: 'btn-primary',
          disabled: isSaving || isDeleting || isAccepting,
          style: { background: 'var(--green, #16a34a)' }
        }
      ] : []),
      {
        label: 'Delete Quotation',
        icon: 'fa-solid fa-trash',
        onClick: () => setShowDeleteConfirm(true),
        className: 'btn-danger',
        disabled: isSaving || isDeleting || isAccepting,
      },
    ];
  }, [quotation, isEditing, isSaving, isDeleting, isAccepting, isAccepted, formData]);

  const getStatusType = () => {
    if (!quotation) return 'neutral';
    const status = (quotation.status || '').toLowerCase();
    if (status === 'accepted' || status === 'confirmed') return 'success';
    if (status === 'sent') return 'warning';
    if (status === 'cancelled' || status === 'rejected') return 'danger';
    return 'neutral';
  };


  return (
    <RecordDetailLayout
      title={quotation?.quoteNo || 'Quotation Profile'}
      subtitle={quotation?.serviceTitle || 'Service Booking Tour'}
      status={quotation?.status ? quotation.status.toUpperCase() : 'DRAFT'}
      statusType={getStatusType()}
      breadcrumbs={breadcrumbs}
      backTo="/operator/quotations"
      backLabel="Back to Quotations"
      actions={actions}
      isLoading={loading}
      isNotFound={!loading && !quotation}
      notFoundMessage="The quotation record could not be found."
    >
      {quotation && (
        <div className="quotation-detail-wrapper">
          {/* Active Custom Service / Accepted Banner */}
          {isAccepted && (
            <div className="inquiry-confirmed-banner" style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.75rem', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                  <i className="fa-solid fa-circle-check"></i>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: '#14532d' }}>Quotation Accepted · Custom Service Active</h4>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8125rem', color: '#166534' }}>
                    This quotation has been officially accepted and converted into an active tracking service with sequential milestones.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                {quotation.activeServiceId && (
                  <Link
                    to={`/operator/ongoing-services/${quotation.activeServiceId}`}
                    className="btn btn-primary btn-sm"
                    style={{ background: '#16a34a', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <i className="fa-solid fa-gears"></i>
                    <span>View Ongoing Service</span>
                  </Link>
                )}
                {quotation.inquiryId && (
                  <Link
                    to={`/operator/inquiry-forms/${quotation.inquiryId}`}
                    className="btn btn-secondary btn-sm"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <i className="fa-solid fa-file-signature"></i>
                    <span>Originating Inquiry</span>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Originating Inquiry Reference (if not yet accepted) */}
          {!isAccepted && quotation.inquiryId && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.65rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
              <span style={{ color: '#475569' }}>
                <i className="fa-solid fa-link" style={{ color: 'var(--purple)', marginRight: '0.4rem' }}></i>
                Originating from client inquiry: <strong>{quotation.inquiryId}</strong>
              </span>
              <Link
                to={`/operator/inquiry-forms/${quotation.inquiryId}`}
                style={{ color: 'var(--purple, #7c3aed)', fontWeight: 600, textDecoration: 'underline' }}
              >
                View Inquiry Form (SAF-01-002) →
              </Link>
            </div>
          )}

          {/* Top Client & Service Row */}
          <div className="details-grid-2">
            {/* Client Metadata Section */}
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-building"></i> Client / Company Information
              </h2>

              <div className="panel-details-list">
                <div className="detail-item">
                  <span className="detail-label">Name of Client / Company</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="clientName"
                      value={formData.clientName}
                      onChange={handleInputChange}
                      className="form-input inline-edit-input"
                    />
                  ) : (
                    <span className="detail-value" style={{ fontWeight: 700 }}>{quotation.clientName || 'N/A'}</span>
                  )}
                </div>

                <div className="detail-item">
                  <span className="detail-label">Contact Person</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleInputChange}
                      className="form-input inline-edit-input"
                      placeholder="e.g. Ms. Marichu Kalalang"
                    />
                  ) : (
                    <span className="detail-value">{quotation.contactPerson || 'N/A'}</span>
                  )}
                </div>

                <div className="detail-item">
                  <span className="detail-label">Email Address</span>
                  {isEditing ? (
                    <input
                      type="email"
                      name="clientEmail"
                      value={formData.clientEmail}
                      onChange={handleInputChange}
                      className="form-input inline-edit-input"
                    />
                  ) : (
                    <span className="detail-value">{quotation.clientEmail || 'N/A'}</span>
                  )}
                </div>

                <div className="detail-item">
                  <span className="detail-label">Phone / Mobile</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="clientPhone"
                      value={formData.clientPhone}
                      onChange={handleInputChange}
                      className="form-input inline-edit-input"
                    />
                  ) : (
                    <span className="detail-value">{quotation.clientPhone || 'N/A'}</span>
                  )}
                </div>
              </div>
            </article>

            {/* Price & Tour Config */}
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-money-bill-wave"></i> Rate Breakdown & Totals
              </h2>
              <div className="panel-details-list">
                <div className="detail-item">
                  <span className="detail-label">Service / Tour Title</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="serviceTitle"
                      value={formData.serviceTitle}
                      onChange={handleInputChange}
                      className="form-input inline-edit-input"
                    />
                  ) : (
                    <span className="detail-value font-medium">{quotation.serviceTitle || 'N/A'}</span>
                  )}
                </div>

                <div className="detail-item">
                  <span className="detail-label">Base Rate (PHP)</span>
                  {isEditing ? (
                    <input
                      type="number"
                      name="rate"
                      value={formData.rate}
                      onChange={handleInputChange}
                      className="form-input inline-edit-input"
                    />
                  ) : (
                    <span className="detail-value">
                      ₱{Number(quotation.rate || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </div>

                <div className="detail-item">
                  <span className="detail-label">Tax / Surcharge (PHP)</span>
                  {isEditing ? (
                    <input
                      type="number"
                      name="taxAmount"
                      value={formData.taxAmount}
                      onChange={handleInputChange}
                      className="form-input inline-edit-input"
                    />
                  ) : (
                    <span className="detail-value">
                      ₱{Number(quotation.taxAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </div>

                <div className="detail-item">
                  <span className="detail-label">Total Amount</span>
                  {isEditing ? (
                    <input
                      type="number"
                      name="totalAmount"
                      value={formData.totalAmount}
                      onChange={handleInputChange}
                      className="form-input inline-edit-input"
                      style={{ fontWeight: 700, color: 'var(--purple)' }}
                    />
                  ) : (
                    <span className="detail-value text-purple font-large" style={{ fontWeight: 800 }}>
                      ₱{Number(quotation.totalAmount || quotation.rate || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </div>

                <div className="detail-item">
                  <span className="detail-label">Rate Breakdown Line</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="rateBreakdown"
                      value={formData.rateBreakdown}
                      onChange={handleInputChange}
                      className="form-input inline-edit-input"
                    />
                  ) : (
                    <span className="detail-value" style={{ fontSize: '0.8125rem', color: '#4b5563' }}>
                      {quotation.rateBreakdown || 'N/A'}
                    </span>
                  )}
                </div>
              </div>
            </article>
          </div>

          {/* Requirements & Tour Dates */}
          <div className="details-grid-2">
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-list-check"></i> Requirements / Unit Specs
              </h2>
              {isEditing ? (
                <textarea
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleInputChange}
                  rows={4}
                  className="form-textarea inline-edit-textarea"
                  placeholder="• (1) Unit Tourist Bus&#10;• Equipped with video and audio entertainment system&#10;• 49 Regular seats&#10;• 3D/2N – QC-Bolinao-Alaminos-QC"
                />
              ) : (
                <p className="description-text" style={{ whiteSpace: 'pre-line' }}>
                  {quotation.requirements || 'No specific unit requirements noted.'}
                </p>
              )}
            </article>

            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-regular fa-calendar-days"></i> Tour Date / Itinerary Breakdown
              </h2>
              {isEditing ? (
                <textarea
                  name="tourDates"
                  value={formData.tourDates}
                  onChange={handleInputChange}
                  rows={4}
                  className="form-textarea inline-edit-textarea"
                  placeholder="April 29, 2023: Pick up QC to Bolinao&#10;April 30, 2023: Bolinao to Alaminos&#10;May 1, 2023: Alaminos to QC"
                />
              ) : (
                <p className="description-text" style={{ whiteSpace: 'pre-line' }}>
                  {quotation.tourDates || 'Tour schedule to be arranged upon confirmation.'}
                </p>
              )}
            </article>
          </div>

          {/* Inclusions & Exclusions */}
          <div className="details-grid-2">
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-circle-plus text-success"></i> Inclusions
              </h2>
              {isEditing ? (
                <textarea
                  name="inclusions"
                  value={formData.inclusions}
                  onChange={handleInputChange}
                  rows={4}
                  className="form-textarea inline-edit-textarea"
                />
              ) : (
                <p className="description-text" style={{ whiteSpace: 'pre-line' }}>
                  {quotation.inclusions || 'No inclusions specified.'}
                </p>
              )}
            </article>

            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-circle-minus text-danger"></i> Exclusions
              </h2>
              {isEditing ? (
                <textarea
                  name="exclusions"
                  value={formData.exclusions}
                  onChange={handleInputChange}
                  rows={4}
                  className="form-textarea inline-edit-textarea"
                />
              ) : (
                <p className="description-text" style={{ whiteSpace: 'pre-line' }}>
                  {quotation.exclusions || 'No exclusions specified.'}
                </p>
              )}
            </article>
          </div>

          {/* Remarks & Sign-off */}
          <div className="details-grid-2">
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-regular fa-comment-dots"></i> Remarks & Payment Terms
              </h2>
              {isEditing ? (
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  rows={4}
                  className="form-textarea inline-edit-textarea"
                  placeholder="- Initial payment of Php 10,000.00 for reservation upon confirmation&#10;- Full payment on or before April 29, 2023"
                />
              ) : (
                <p className="description-text" style={{ whiteSpace: 'pre-line' }}>
                  {quotation.remarks || 'Standard terms and conditions apply.'}
                </p>
              )}
            </article>

            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-signature"></i> Sign-off Information
              </h2>
              <div className="panel-details-list">
                <div className="detail-item">
                  <span className="detail-label">Prepared By</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="preparedByName"
                      value={formData.preparedByName}
                      onChange={handleInputChange}
                      className="form-input inline-edit-input"
                    />
                  ) : (
                    <span className="detail-value font-medium">{quotation.preparedByName || quotation.preparedBy || 'Operator'}</span>
                  )}
                </div>

                <div className="detail-item">
                  <span className="detail-label">Designation / Title</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="preparedByTitle"
                      value={formData.preparedByTitle}
                      onChange={handleInputChange}
                      className="form-input inline-edit-input"
                    />
                  ) : (
                    <span className="detail-value">{quotation.preparedByTitle || 'Branch Operator'}</span>
                  )}
                </div>

                <div className="detail-item">
                  <span className="detail-label">Contact Number</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="preparedByContact"
                      value={formData.preparedByContact}
                      onChange={handleInputChange}
                      className="form-input inline-edit-input"
                    />
                  ) : (
                    <span className="detail-value">{quotation.preparedByContact || 'N/A'}</span>
                  )}
                </div>
              </div>
            </article>
          </div>

          {/* Delete confirmation */}
          <ConfirmationModal
            isOpen={showDeleteConfirm}
            onClose={() => !isDeleting && setShowDeleteConfirm(false)}
            Icon={TrashIcon}
            Title="Delete this quotation record?"
            Desc={`"${quotation.quoteNo}" will be permanently removed. This action cannot be undone.`}
            BtnColor="var(--error-red)"
            confirmText="Delete Quotation"
            isLoading={isDeleting}
            OnConfirm={handleDelete}
          />

          {/* PDF Export Preview & Download Modal */}
          <PdfDocumentView
            isOpen={showPdfModal}
            onClose={() => setShowPdfModal(false)}
            type="quotation"
            data={quotation}
          />
        </div>
      )}
    </RecordDetailLayout>
  );
}
