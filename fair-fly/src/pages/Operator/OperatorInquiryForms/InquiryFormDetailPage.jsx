import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useOperatorContext } from '../../../context/OperatorContext';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import RecordDetailLayout from '../../../components/UI/RecordDetailLayout/RecordDetailLayout';
import ConfirmationModal from '../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';
import './inquiry-form-detail.css';

const TrashIcon = (props) => <i className="fa-solid fa-trash-can" {...props}></i>;

export default function InquiryFormDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: inquiryForms, loading } = useOperatorContext();
  const { userToken } = useAuthContext();
  const { addToast } = useToast();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useMemo(() => {
    if (!inquiryForms || !id) return null;
    return inquiryForms.find((f) => f.id === id) || null;
  }, [inquiryForms, id]);

  const handleDelete = async () => {
    if (!form) return;
    ApiCaller(
      `${API_BASE_URL}/api/inquiries/${form.id}`,
      'DELETE',
      null,
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast('Inquiry form deleted successfully', 'success');
        setShowDeleteConfirm(false);
        navigate('/operator/inquiry-forms');
      },
      (error) => {
        addToast(`Failed to delete inquiry form: ${error.message}`, 'error');
      },
      setIsDeleting
    );
  };

  const breadcrumbs = [
    { label: 'Dashboard', to: '/operator' },
    { label: 'Inquiry Forms', to: '/operator/inquiry-forms' },
    { label: form ? (form.formNo || 'Inquiry Details') : 'Loading...' },
  ];

  const actions = [
    {
      label: 'Delete Inquiry',
      icon: 'fa-solid fa-trash',
      onClick: () => setShowDeleteConfirm(true),
      className: 'btn-danger',
      disabled: isDeleting,
    },
  ];

  return (
    <RecordDetailLayout
      title={form?.fullName || form?.title || 'Client Inquiry Details'}
      subtitle={form?.serviceType || 'General Inquiries'}
      status={form?.status || 'ACTIVE'}
      statusType="info"
      breadcrumbs={breadcrumbs}
      backTo="/operator/inquiry-forms"
      backLabel="Back to Inquiry Forms"
      actions={form ? actions : []}
      isLoading={loading}
      isNotFound={!loading && !form}
      notFoundMessage="The inquiry intake form could not be found."
    >
      {form && (
        <div className="inquiry-detail-wrapper">
          <div className="details-grid-2">
            {/* Client Intake Details */}
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-user-tag"></i> Contact Profile
              </h2>
              <div className="panel-details-list">
                <div className="detail-item">
                  <span className="detail-label">Client Name</span>
                  <span className="detail-value">{form.fullName || form.name || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Email Address</span>
                  <span className="detail-value">{form.email || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Phone Number</span>
                  <span className="detail-value">{form.phoneNumber || 'N/A'}</span>
                </div>
              </div>
            </article>

            {/* Intake Form Specifications */}
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-file-invoice"></i> Intake Form Details
              </h2>
              <div className="panel-details-list">
                <div className="detail-item">
                  <span className="detail-label">Form Reference Number</span>
                  <span className="detail-value text-mono">{form.formNo || 'N/A'}</span>
                </div>
                <span className="detail-item">
                  <span className="detail-label">Service Type Requested</span>
                  <span className="detail-value">{form.serviceType || 'N/A'}</span>
                </span>
                <div className="detail-item">
                  <span className="detail-label">Intake Record Created</span>
                  <span className="detail-value">
                    {form.createdAt ? new Date(form.createdAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            </article>
          </div>

          {/* Details / Message */}
          <article className="card detail-panel">
            <h2 className="panel-title">
              <i className="fa-regular fa-comment-dots"></i> Inquiry Information & Requirements
            </h2>
            <p className="inquiry-text">
              {form.details || 'No specific details or client requests were noted in this inquiry intake form.'}
            </p>
          </article>

          {/* Delete confirmation */}
          <ConfirmationModal
            isOpen={showDeleteConfirm}
            onClose={() => !isDeleting && setShowDeleteConfirm(false)}
            Icon={TrashIcon}
            Title="Delete this inquiry form?"
            Desc={`"${form.formNo || 'Inquiry Form'}" will be permanently deleted. This action cannot be undone.`}
            BtnColor="var(--error-red)"
            confirmText="Delete Inquiry"
            isLoading={isDeleting}
            OnConfirm={handleDelete}
          />
        </div>
      )}
    </RecordDetailLayout>
  );
}
