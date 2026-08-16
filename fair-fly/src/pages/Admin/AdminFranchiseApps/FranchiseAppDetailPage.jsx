import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAdminContext } from '../../../context/AdminContext';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import RecordDetailLayout from '../../../components/UI/RecordDetailLayout/RecordDetailLayout';
import ConfirmationModal from '../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';
import './franchise-app-detail.css';

const ApproveIcon = (props) => <i className="fa-solid fa-circle-check" {...props}></i>;
const RejectIcon = (props) => <i className="fa-solid fa-circle-xmark" {...props}></i>;

export default function FranchiseAppDetailPage({ isHistoryMode = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: applications, loading } = useAdminContext();
  const { userToken } = useAuthContext();
  const { addToast } = useToast();

  const [confirmState, setConfirmState] = useState(null); // 'approve' | 'reject'
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  const application = useMemo(() => {
    if (!applications || !id) return null;
    return applications.find((app) => app.id === id) || null;
  }, [applications, id]);

  const handleStatusChange = async (isApproved) => {
    if (!application) return;
    ApiCaller(
      `${API_BASE_URL}/api/franchise/applications/${application.id}/status`,
      'PATCH',
      { status: isApproved ? 'approved' : 'rejected' },
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast(`Application ${isApproved ? 'approved' : 'rejected'} successfully`, 'success');
        setConfirmState(null);
        navigate(isHistoryMode ? '/admin/inquiry-history' : '/admin/franchise-apps');
      },
      (error) => {
        addToast(`Failed to update application: ${error.message}`, 'error');
      },
      setIsConfirmLoading
    );
  };

  const breadcrumbs = [
    { label: 'Dashboard', to: '/admin' },
    isHistoryMode 
      ? { label: 'Inquiry History', to: '/admin/inquiry-history' }
      : { label: 'Franchise Applications', to: '/admin/franchise-apps' },
    { label: application ? application.fullName : 'Loading...' },
  ];

  const actions = useMemo(() => {
    if (!application || application.status !== 'pending') return [];
    return [
      {
        label: 'Approve Application',
        icon: 'fa-solid fa-check',
        onClick: () => setConfirmState('approve'),
        className: 'btn-primary',
        disabled: isConfirmLoading,
      },
      {
        label: 'Reject Application',
        icon: 'fa-solid fa-xmark',
        onClick: () => setConfirmState('reject'),
        className: 'btn-danger',
        disabled: isConfirmLoading,
      },
    ];
  }, [application, isConfirmLoading]);

  const getStatusType = () => {
    if (!application) return 'neutral';
    switch (application.status) {
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      case 'pending': return 'warning';
      default: return 'neutral';
    }
  };

  return (
    <RecordDetailLayout
      title={application?.fullName || 'Application Details'}
      subtitle={application?.email || 'applicant@email.com'}
      status={application?.status ? application.status.toUpperCase() : 'PENDING'}
      statusType={getStatusType()}
      breadcrumbs={breadcrumbs}
      backTo={isHistoryMode ? '/admin/inquiry-history' : '/admin/franchise-apps'}
      backLabel={isHistoryMode ? 'Back to History' : 'Back to Applications'}
      actions={actions}
      isLoading={loading}
      isNotFound={!loading && !application}
      notFoundMessage="The franchise application could not be found."
    >
      {application && (
        <div className="franchise-detail-wrapper">
          <div className="details-grid-2">
            {/* Applicant Profile */}
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-user-tie"></i> Applicant Profile
              </h2>
              <div className="panel-details-list">
                <div className="detail-item">
                  <span className="detail-label">Full Name</span>
                  <span className="detail-value">{application.fullName || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Email Address</span>
                  <span className="detail-value">{application.email || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Contact Phone</span>
                  <span className="detail-value">{application.phone || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Preferred Location</span>
                  <span className="detail-value">{application.preferredBranchLocation || 'N/A'}</span>
                </div>
              </div>
            </article>

            {/* Application Meta */}
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-circle-info"></i> Application Submission Details
              </h2>
              <div className="panel-details-list">
                <div className="detail-item">
                  <span className="detail-label">Application ID</span>
                  <span className="detail-value text-mono">{application.id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Submission Date</span>
                  <span className="detail-value">
                    {application.createdAt ? new Date(application.createdAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Current Status</span>
                  <span className={`status-pill ${getStatusType() === 'success' ? 'status-pill-active' : getStatusType() === 'danger' ? 'status-pill-disabled' : 'status-pill-pending'}`}>
                    {application.status || 'Pending'}
                  </span>
                </div>
              </div>
            </article>
          </div>

          {/* Form Detailed Responses */}
          <div className="details-grid-2">
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-briefcase"></i> Business & Franchise Experience
              </h2>
              <p className="response-text-block">
                {application.businessExperience || 'No previous business experience description was provided.'}
              </p>
            </article>

            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-comment-dots"></i> Motivation & Goals
              </h2>
              <p className="response-text-block">
                {application.motivation || 'No motivation statement was provided.'}
              </p>
            </article>
          </div>

          {/* Confirmations */}
          <ConfirmationModal
            isOpen={confirmState === 'approve'}
            onClose={() => !isConfirmLoading && setConfirmState(null)}
            Icon={ApproveIcon}
            Title="Approve this franchise application?"
            Desc={`"${application.fullName}" will be notified of approval and a new operator partner profile can be initialized.`}
            BtnColor="var(--complete-green-dark)"
            confirmText="Approve Application"
            isLoading={isConfirmLoading}
            OnConfirm={() => handleStatusChange(true)}
          />

          <ConfirmationModal
            isOpen={confirmState === 'reject'}
            onClose={() => !isConfirmLoading && setConfirmState(null)}
            Icon={RejectIcon}
            Title="Reject this franchise application?"
            Desc={`"${application.fullName}" application will be marked as rejected. This action can be reversed in history.`}
            BtnColor="var(--error-red)"
            confirmText="Reject Application"
            isLoading={isConfirmLoading}
            OnConfirm={() => handleStatusChange(false)}
          />
        </div>
      )}
    </RecordDetailLayout>
  );
}
