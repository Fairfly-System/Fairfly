import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useOperatorContext } from '../../../context/OperatorContext';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import RecordDetailLayout from '../../../components/UI/RecordDetailLayout/RecordDetailLayout';
import ConfirmationModal from '../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal';
import PdfDocumentView from '../../../components/Shared/PdfDocument/PdfDocumentView';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';
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

  const breadcrumbs = [
    { label: 'Dashboard', to: '/operator' },
    { label: 'Quotations', to: '/operator/quotations' },
    { label: quotation ? (quotation.quoteNo || 'Quotation Details') : 'Loading...' },
  ];

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
        label: 'Export to PDF',
        icon: 'fa-solid fa-file-pdf',
        onClick: () => setShowPdfModal(true),
        className: 'btn-primary',
        disabled: isSaving || isDeleting,
      },
      {
        label: 'Edit Fields',
        icon: 'fa-solid fa-pen-to-square',
        onClick: () => setIsEditing(true),
        className: 'btn-secondary',
        disabled: isSaving || isDeleting,
      },
      ...(quotation.status === 'Draft' ? [
        {
          label: 'Mark as Sent',
          icon: 'fa-solid fa-paper-plane',
          onClick: () => handleStatusChange('Sent'),
          className: 'btn-secondary',
          disabled: isSaving || isDeleting,
        }
      ] : []),
      {
        label: 'Delete Quotation',
        icon: 'fa-solid fa-trash',
        onClick: () => setShowDeleteConfirm(true),
        className: 'btn-danger',
        disabled: isSaving || isDeleting,
      },
    ];
  }, [quotation, isEditing, isSaving, isDeleting, formData]);

  const getStatusType = () => {
    if (!quotation) return 'neutral';
    const status = (quotation.status || '').toLowerCase();
    if (status === 'confirmed' || status === 'sent') return 'success';
    if (status === 'cancelled') return 'danger';
    return 'warning';
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
