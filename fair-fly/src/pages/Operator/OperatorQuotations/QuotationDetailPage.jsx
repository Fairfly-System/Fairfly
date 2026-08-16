import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useOperatorContext } from '../../../context/OperatorContext';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import RecordDetailLayout from '../../../components/UI/RecordDetailLayout/RecordDetailLayout';
import ConfirmationModal from '../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal';
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

  // Sync with Firestore context data
  const quotation = useMemo(() => {
    if (!quotations || !id) return null;
    return quotations.find((q) => q.id === id) || null;
  }, [quotations, id]);

  // Form state for inline editing
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    serviceTitle: '',
    tourDates: '',
    inclusions: '',
    exclusions: '',
    rate: '',
    remarks: '',
  });

  // Load quotation data into form fields when entering edit mode or when database updates
  useEffect(() => {
    if (quotation) {
      setFormData({
        clientName: quotation.clientName || '',
        clientEmail: quotation.clientEmail || '',
        clientPhone: quotation.clientPhone || '',
        serviceTitle: quotation.serviceTitle || '',
        tourDates: quotation.tourDates || '',
        inclusions: quotation.inclusions || '',
        exclusions: quotation.exclusions || '',
        rate: quotation.rate || '',
        remarks: quotation.remarks || '',
      });
    }
  }, [quotation, isEditing]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async () => {
    if (!formData.clientName || !formData.serviceTitle || formData.rate === '') {
      addToast('Client name, service title, and rate are required fields', 'error');
      return;
    }

    ApiCaller(
      `${API_BASE_URL}/api/quotations/${quotation.id}`,
      'PATCH',
      formData,
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
          <div className="details-grid-2">
            {/* Client Metadata Section */}
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-user-tag"></i> Client Details
              </h2>
              <div className="panel-details-list">
                <div className="detail-item">
                  <span className="detail-label">Client Name</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="clientName"
                      value={formData.clientName}
                      onChange={handleInputChange}
                      className="form-input inline-edit-input"
                    />
                  ) : (
                    <span className="detail-value">{quotation.clientName || 'N/A'}</span>
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
                  <span className="detail-label">Phone Number</span>
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
                <i className="fa-solid fa-tags"></i> Booking & Rates
              </h2>
              <div className="panel-details-list">
                <div className="detail-item">
                  <span className="detail-label">Service / Tour Subject</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="serviceTitle"
                      value={formData.serviceTitle}
                      onChange={handleInputChange}
                      className="form-input inline-edit-input"
                    />
                  ) : (
                    <span className="detail-value">{quotation.serviceTitle || 'N/A'}</span>
                  )}
                </div>
                <div className="detail-item">
                  <span className="detail-label">Tour Dates</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="tourDates"
                      value={formData.tourDates}
                      onChange={handleInputChange}
                      className="form-input inline-edit-input"
                    />
                  ) : (
                    <span className="detail-value">{quotation.tourDates || 'N/A'}</span>
                  )}
                </div>
                <div className="detail-item">
                  <span className="detail-label">Quotation Rate</span>
                  {isEditing ? (
                    <input
                      type="number"
                      name="rate"
                      value={formData.rate}
                      onChange={handleInputChange}
                      className="form-input inline-edit-input"
                    />
                  ) : (
                    <span className="detail-value text-purple font-large">
                      ₱{Number(quotation.rate || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
              </div>
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
                <p className="description-text">{quotation.inclusions || 'No inclusions specified.'}</p>
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
                <p className="description-text">{quotation.exclusions || 'No exclusions specified.'}</p>
              )}
            </article>
          </div>

          {/* Remarks */}
          <article className="card detail-panel">
            <h2 className="panel-title">
              <i className="fa-regular fa-comment-dots"></i> Internal Remarks & Notes
            </h2>
            {isEditing ? (
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                rows={3}
                className="form-textarea inline-edit-textarea"
              />
            ) : (
              <p className="description-text">{quotation.remarks || 'No internal remarks recorded.'}</p>
            )}
          </article>

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
        </div>
      )}
    </RecordDetailLayout>
  );
}
