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
            <div className="inquiry-confirmed-banner quote-accepted-banner">
              <div className="quote-accepted-info">
                <div className="quote-accepted-icon">
                  <i className="fa-solid fa-circle-check"></i>
                </div>
                <div>
                  <h4 className="quote-accepted-title">Quotation Accepted · Custom Service Active</h4>
                  <p className="quote-accepted-sub">
                    This quotation has been officially accepted and converted into an active tracking service with sequential milestones.
                  </p>
                </div>
              </div>

              <div className="quote-accepted-actions">
                {quotation.activeServiceId && (
                  <Link
                    to={`/operator/ongoing-services/${quotation.activeServiceId}`}
                    className="btn btn-primary btn-sm quote-link-btn ongoing"
                  >
                    <i className="fa-solid fa-gears"></i>
                    <span>View Ongoing Service</span>
                  </Link>
                )}
                {quotation.inquiryId && (
                  <Link
                    to={`/operator/inquiry-forms/${quotation.inquiryId}`}
                    className="btn btn-secondary btn-sm quote-link-btn"
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
            <div className="quote-inquiry-bar">
              <span className="quote-inquiry-bar-label">
                <i className="fa-solid fa-link quote-inquiry-bar-icon"></i>
                Originating from client inquiry: <strong>{quotation.inquiryId}</strong>
              </span>
              <Link
                to={`/operator/inquiry-forms/${quotation.inquiryId}`}
                className="quote-inquiry-bar-link"
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
                  <span className="detail-label">Client / Company Name</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="clientName"
                      value={formData.clientName}
                      onChange={handleInputChange}
                      className="form-input inline-edit-input"
                    />
                  ) : (
                    <span className="detail-value font-bold">{quotation.clientName || 'N/A'}</span>
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
                    />
                  ) : (
                    <span className="detail-value">{quotation.contactPerson || quotation.clientName || 'N/A'}</span>
                  )}
                </div>

                <div className="detail-item">
                  <span className="detail-label">Telephone / Cellphone</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleInputChange}
                      className="form-input inline-edit-input"
                    />
                  ) : (
                    <span className="detail-value">{quotation.contactNumber || quotation.cellphone || quotation.telNo || 'N/A'}</span>
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
                    <span className="detail-value">{quotation.clientEmail || quotation.email || 'N/A'}</span>
                  )}
                </div>

                <div className="detail-item">
                  <span className="detail-label">Complete Address</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="clientAddress"
                      value={formData.clientAddress}
                      onChange={handleInputChange}
                      className="form-input inline-edit-input"
                    />
                  ) : (
                    <span className="detail-value">{quotation.clientAddress || quotation.address || 'N/A'}</span>
                  )}
                </div>
              </div>
            </article>

            {/* Quotation Metadata Section */}
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-file-invoice"></i> Quotation Specifications
              </h2>

              <div className="panel-details-list">
                <div className="detail-item">
                  <span className="detail-label">Document Code</span>
                  <span className="detail-value text-mono font-bold text-purple">{quotation.code || 'ADF-07-001'}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Branch Office</span>
                  <span className="detail-value font-medium">{quotation.branchName || 'FairFly Travel'}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Quotation Date</span>
                  {isEditing ? (
                    <input
                      type="date"
                      name="quotationDate"
                      value={formData.quotationDate}
                      onChange={handleInputChange}
                      className="form-input inline-edit-input"
                    />
                  ) : (
                    <span className="detail-value">{quotation.quotationDate || (quotation.createdAt ? new Date(quotation.createdAt).toLocaleDateString() : 'N/A')}</span>
                  )}
                </div>

                <div className="detail-item">
                  <span className="detail-label">Service Title / Package</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="serviceTitle"
                      value={formData.serviceTitle}
                      onChange={handleInputChange}
                      className="form-input inline-edit-input"
                    />
                  ) : (
                    <span className="detail-value font-bold">{quotation.serviceTitle || quotation.serviceName || 'Custom Service'}</span>
                  )}
                </div>

                <div className="detail-item">
                  <span className="detail-label">Rate / Bus / Base Price</span>
                  {isEditing ? (
                    <input
                      type="number"
                      name="rate"
                      value={formData.rate}
                      onChange={handleInputChange}
                      className="form-input inline-edit-input"
                    />
                  ) : (
                    <span className="detail-value font-bold text-mono">
                      ₱{Number(quotation.rate || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                      className="form-input inline-edit-input quote-total-input"
                    />
                  ) : (
                    <span className="detail-value text-purple font-large quote-total-display">
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
                    <span className="detail-value quote-rate-note">
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
                <p className="description-text quote-preline-text">
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
                <p className="description-text quote-preline-text">
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
                <p className="description-text quote-preline-text">
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
                <p className="description-text quote-preline-text">
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
                <p className="description-text quote-preline-text">
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
