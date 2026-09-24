import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import RecordDetailLayout from '../../../components/UI/RecordDetailLayout/RecordDetailLayout';
import AlertBar from '../../../components/UI/AlertBar/AlertBar';
import KpiCard from '../../../components/UI/KpiCard/KpiCard';
import ClientEditModal from '../../../components/Admin/Modals/ClientEditModal/ClientEditModal';
import ConfirmationModal from '../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal';
import RejectClientModal from '../../../components/Admin/Modals/RejectClientModal/RejectClientModal';
import IdPreviewModal from '../../../components/Admin/Modals/IdPreviewModal/IdPreviewModal';
import {
  fetchClientById,
  updateClient,
  deleteClient,
  approveClient,
  rejectClient
} from '../../../services/adminService';
import './admin-clients.css';

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userToken } = useAuthContext();
  const { addToast } = useToast();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rejection modal
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isRejectLoading, setIsRejectLoading] = useState(false);

  // Fullscreen ID preview lightbox
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    imageUrl: '',
    title: '',
    side: '',
    idType: ''
  });

  // Generic Confirmation modal
  const [confirmState, setConfirmState] = useState(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  const loadClientDetails = useCallback(() => {
    if (!userToken || !id) return;
    setLoading(true);
    fetchClientById(
      userToken,
      id,
      (data) => {
        setClient(data || null);
        if (data && (data.status === 'Pending' || data.approvalStatus === 'Pending')) {
          setActiveTab('verification');
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching client details:', error);
        addToast(error?.message || 'Failed to load client details', 'error');
        setLoading(false);
      },
      setLoading
    );
  }, [userToken, id, addToast]);

  useEffect(() => {
    loadClientDetails();
  }, [loadClientDetails]);

  const isPending = client?.status === 'Pending' || client?.approvalStatus === 'Pending';
  const isRejected = client?.status === 'Rejected' || client?.approvalStatus === 'Rejected';
  const isDeactivated = client?.status === 'Deactivated';

  // Edit Submission
  const handleEditSubmit = async (formData) => {
    if (!client) return;

    updateClient(
      userToken,
      client.id,
      formData,
      () => {
        addToast('Client profile updated successfully', 'success');
        setIsEditModalOpen(false);
        loadClientDetails();
      },
      (error) => {
        console.error('Error updating client:', error);
        addToast(error?.message || 'Failed to update client profile', 'error');
      },
      setIsSubmitting
    );
  };

  // Status Toggle (Activate / Deactivate)
  const handleToggleStatus = () => {
    if (!client) return;
    const isCurrentlyActive = client.status === 'Active';
    const newStatus = isCurrentlyActive ? 'Deactivated' : 'Active';

    setConfirmState({
      type: 'status',
      newStatus,
      title: isCurrentlyActive ? 'Deactivate Client Account?' : 'Reactivate Client Account?',
      message: isCurrentlyActive
        ? `Are you sure you want to deactivate ${client.fullName || client.name || 'this client'}? They will be unable to book services or make appointments.`
        : `Are you sure you want to reactivate ${client.fullName || client.name || 'this client'}? Their account privileges will be restored.`,
      confirmLabel: isCurrentlyActive ? 'Deactivate Account' : 'Activate Account',
      confirmIcon: isCurrentlyActive ? 'fa-solid fa-ban' : 'fa-solid fa-check',
      isDanger: isCurrentlyActive
    });
  };

  // Approve Account Action
  const handleApprovePrompt = () => {
    if (!client) return;
    setConfirmState({
      type: 'approve',
      title: 'Approve Client & Government ID?',
      message: `Are you sure you want to approve ${client.fullName || client.name || 'this client'}? Their account status will become Active, and an official confirmation email will be sent to ${client.email} notifying them that their account is ready to use.`,
      confirmLabel: 'Approve & Activate Account',
      confirmIcon: 'fa-solid fa-user-check',
      isDanger: false
    });
  };

  // Reject Action Handler
  const handleOpenRejectModal = () => {
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = (reason) => {
    if (!client) return;
    setIsRejectLoading(true);

    rejectClient(
      userToken,
      client.id,
      reason,
      () => {
        setIsRejectLoading(false);
        setIsRejectModalOpen(false);
        addToast('Application rejected. Re-upload instructions sent to client email.', 'success');
        loadClientDetails();
      },
      (error) => {
        setIsRejectLoading(false);
        console.error('Error rejecting client:', error);
        addToast(error?.message || 'Failed to reject client application', 'error');
      },
      setIsRejectLoading
    );
  };

  // Delete / Spam Prompt
  const handleDeletePrompt = () => {
    if (!client) return;
    setConfirmState({
      type: 'delete',
      title: isPending ? 'Delete Spam / Pending Registration?' : 'Delete Client Account?',
      message: isPending
        ? `Are you sure you want to permanently delete this registration for ${client.fullName || client.name || 'this applicant'} (${client.email})? This will purge both authentication credentials and database records to completely remove spam. This action cannot be undone.`
        : `Are you sure you want to permanently delete ${client.fullName || client.name || 'this client'} (${client.email})? This action cannot be undone.`,
      confirmLabel: isPending ? 'Delete Spam Account' : 'Delete Permanently',
      confirmIcon: 'fa-solid fa-trash-can',
      isDanger: true
    });
  };

  const handleConfirmAction = () => {
    if (!confirmState) return;

    if (confirmState.type === 'approve') {
      approveClient(
        userToken,
        client.id,
        () => {
          addToast('Client approved successfully! Email notification dispatched.', 'success');
          setConfirmState(null);
          loadClientDetails();
        },
        (error) => {
          console.error('Error approving client:', error);
          addToast(error?.message || 'Failed to approve client', 'error');
        },
        setIsConfirmLoading
      );
    } else if (confirmState.type === 'status') {
      updateClient(
        userToken,
        client.id,
        { status: confirmState.newStatus },
        () => {
          addToast(`Client marked as ${confirmState.newStatus}`, 'success');
          setConfirmState(null);
          loadClientDetails();
        },
        (error) => {
          console.error('Error toggling client status:', error);
          addToast(error?.message || 'Failed to update client status', 'error');
        },
        setIsConfirmLoading
      );
    } else if (confirmState.type === 'delete') {
      deleteClient(
        userToken,
        client.id,
        () => {
          addToast('Client account deleted permanently from auth and database', 'success');
          setConfirmState(null);
          navigate('/admin/clients');
        },
        (error) => {
          console.error('Error deleting client:', error);
          addToast(error?.message || 'Failed to delete client account', 'error');
        },
        setIsConfirmLoading
      );
    }
  };

  const displayName = client?.fullName || client?.name || 'Client Profile';

  const breadcrumbs = [
    { label: 'Admin Portal', to: '/admin' },
    { label: 'Client Accounts', to: '/admin/clients' },
    { label: loading ? 'Loading...' : displayName, active: true }
  ];

  // Actions in the top Header card
  const actions = useMemo(() => {
    if (!client) return [];

    if (isPending) {
      return [
        {
          label: 'Approve Account',
          icon: 'fa-solid fa-user-check',
          onClick: handleApprovePrompt,
          className: 'btn-primary',
          disabled: isSubmitting || isConfirmLoading
        },
        {
          label: 'Reject Application',
          icon: 'fa-solid fa-user-xmark',
          onClick: handleOpenRejectModal,
          className: 'btn-secondary',
          disabled: isSubmitting || isConfirmLoading
        },
        {
          label: 'Delete Spam',
          icon: 'fa-solid fa-trash',
          onClick: handleDeletePrompt,
          className: 'btn-danger',
          disabled: isSubmitting || isConfirmLoading
        },
        {
          label: 'Edit Info',
          icon: 'fa-solid fa-pen-to-square',
          onClick: () => setIsEditModalOpen(true),
          className: 'btn-secondary',
          disabled: isSubmitting || isConfirmLoading
        }
      ];
    }

    if (isRejected) {
      return [
        {
          label: 'Override & Approve',
          icon: 'fa-solid fa-user-check',
          onClick: handleApprovePrompt,
          className: 'btn-primary',
          disabled: isSubmitting || isConfirmLoading
        },
        {
          label: 'Edit Info',
          icon: 'fa-solid fa-pen-to-square',
          onClick: () => setIsEditModalOpen(true),
          className: 'btn-secondary',
          disabled: isSubmitting || isConfirmLoading
        },
        {
          label: 'Delete Account',
          icon: 'fa-solid fa-trash',
          onClick: handleDeletePrompt,
          className: 'btn-danger',
          disabled: isSubmitting || isConfirmLoading
        }
      ];
    }

    return [
      {
        label: 'Edit Info',
        icon: 'fa-solid fa-pen-to-square',
        onClick: () => setIsEditModalOpen(true),
        className: 'btn-secondary',
        disabled: isSubmitting || isConfirmLoading
      },
      {
        label: isDeactivated ? 'Activate Account' : 'Deactivate Account',
        icon: isDeactivated ? 'fa-solid fa-circle-check' : 'fa-solid fa-ban',
        onClick: handleToggleStatus,
        className: 'btn-secondary',
        disabled: isSubmitting || isConfirmLoading
      },
      {
        label: 'Delete Account',
        icon: 'fa-solid fa-trash',
        onClick: handleDeletePrompt,
        className: 'btn-danger',
        disabled: isSubmitting || isConfirmLoading
      }
    ];
  }, [client, isPending, isRejected, isDeactivated, isSubmitting, isConfirmLoading]);

  // Overall AlertBar
  const alertBarProps = useMemo(() => {
    if (!client) return null;
    if (isPending) {
      return {
        message: 'This registration is currently pending ID verification. Review the submitted Government ID below and either approve the account or reject with feedback for resubmission.',
        type: 'warning'
      };
    }
    if (isRejected) {
      return {
        message: `This account registration was rejected (${client.rejectionReason || 'Invalid ID'}). The applicant has been sent an email with a secure link to re-upload their ID.`,
        type: 'warning'
      };
    }
    if (isDeactivated) {
      return {
        message: 'This client account is currently deactivated. The customer cannot book new services or schedule branch appointments.',
        type: 'warning'
      };
    }
    return {
      message: 'This client account is active and in good standing. Identity verified.',
      type: 'success'
    };
  }, [client, isPending, isRejected, isDeactivated]);

  const hasIdData = Boolean(client?.idFrontUrl || client?.idType);

  return (
    <RecordDetailLayout
      title={client?.fullName || client?.name || 'Client Profile'}
      subtitle={client?.email || 'client@email.com'}
      status={
        isPending
          ? 'Pending Verification'
          : isRejected
          ? 'Rejected'
          : client?.status || 'Active'
      }
      statusType={
        isPending
          ? 'warning'
          : isRejected
          ? 'danger'
          : client?.status === 'Active'
          ? 'success'
          : 'neutral'
      }
      breadcrumbs={breadcrumbs}
      backTo="/admin/clients"
      backLabel="Back to Clients"
      actions={actions}
      avatarIcon="fa-solid fa-user"
      isLoading={loading}
      isNotFound={!loading && !client}
      notFoundMessage="The client record could not be found."
    >
      {client && (
        <div className="client-detail-wrapper">
          {alertBarProps && (
            <AlertBar message={alertBarProps.message} type={alertBarProps.type} />
          )}

          {/* Navigation Tabs */}
          <div className="client-tabs-bar">
            <button
              type="button"
              className={`client-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <i className="fa-solid fa-address-card"></i>
              Account Overview
            </button>
            <button
              type="button"
              className={`client-tab-btn ${activeTab === 'verification' ? 'active' : ''}`}
              onClick={() => setActiveTab('verification')}
            >
              <i className="fa-solid fa-id-card"></i>
              Identity Verification
              {isPending && <span className="tab-badge-pending">Needs Review</span>}
              {isRejected && <span className="tab-badge-rejected">Rejected</span>}
              {!isPending && !isRejected && client.status === 'Active' && hasIdData && (
                <span className="tab-badge-verified">Verified</span>
              )}
            </button>
          </div>

          {/* TAB 1: Account Overview */}
          {activeTab === 'overview' && (
            <>
              {/* Activity KPIs */}
              <section className="details-grid-3">
                <KpiCard
                  title="Active Service Bookings"
                  value={client.activeServices?.length || 0}
                  icon="fa-solid fa-plane-departure"
                  iconColor="var(--purple)"
                  detail="Ongoing processing requests"
                />
                <KpiCard
                  title="Branch Appointments"
                  value={client.appointments?.length || 0}
                  icon="fa-solid fa-calendar-check"
                  iconColor="#16a34a"
                  detail="Scheduled branch visits"
                />
                <KpiCard
                  title="Support Tickets"
                  value={client.tickets?.length || 0}
                  icon="fa-solid fa-headset"
                  iconColor="#3b82f6"
                  detail="Customer support inquiries"
                />
              </section>

              {/* Main Info Columns */}
              <div className="details-grid-2">
                {/* Account Profile Box */}
                <article className="card detail-panel">
                  <h2 className="panel-title">
                    <i className="fa-solid fa-user-gear text-purple"></i> Customer Profile
                  </h2>
                  <div className="panel-details-list">
                    <div className="detail-item">
                      <span className="detail-label">Full Name</span>
                      <span className="detail-value">{displayName}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Email Address</span>
                      <span className="detail-value">{client.email || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Contact Phone</span>
                      <span className="detail-value">{client.phone || 'Not provided'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Account Status</span>
                      <span
                        className={`status-pill ${
                          isPending
                            ? 'status-pill-pending'
                            : isRejected
                            ? 'status-pill-disabled'
                            : client.status === 'Active'
                            ? 'status-pill-active'
                            : 'status-pill-disabled'
                        }`}
                      >
                        {isPending ? 'Pending Review' : isRejected ? 'Rejected' : client.status || 'Active'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Address / Location</span>
                      <span className="detail-value">{client.address || 'No address provided'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Registered Date</span>
                      <span className="detail-value">
                        {client.createdAt
                          ? new Date(client.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : '—'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Client User ID</span>
                      <span className="detail-value text-mono">{client.id}</span>
                    </div>
                  </div>
                </article>

                {/* Recent Activity Panel */}
                <article className="card detail-panel">
                  <h2 className="panel-title">
                    <i className="fa-solid fa-clock-rotate-left text-purple"></i> Activity Overview
                  </h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginTop: '0.5rem' }}>
                    <div className="client-activity-item">
                      <div className="client-activity-info">
                        <div className="client-activity-icon">
                          <i className="fa-solid fa-plane-departure"></i>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>Service Bookings</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                            {client.activeServices?.length || 0} active processing request(s)
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="client-activity-item">
                      <div className="client-activity-info">
                        <div className="client-activity-icon">
                          <i className="fa-solid fa-calendar-check"></i>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>Appointments</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                            {client.appointments?.length || 0} scheduled appointment(s)
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="client-activity-item">
                      <div className="client-activity-info">
                        <div className="client-activity-icon">
                          <i className="fa-solid fa-headset"></i>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>Support Tickets</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                            {client.tickets?.length || 0} support inquiry ticket(s)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </>
          )}

          {/* TAB 2: Identity Verification */}
          {activeTab === 'verification' && (
            <div className="id-verification-wrapper">
              {/* Document Meta Summary Card */}
              <div className="id-meta-card">
                <div className="id-meta-header">
                  <div className="id-type-badge-large">
                    <i className="fa-solid fa-id-card-clip text-purple" style={{ fontSize: '1.25rem' }}></i>
                    <span>{client.idType || 'Government Issued Identification'}</span>
                  </div>
                  <div>
                    <span
                      className={`status-pill ${
                        isPending
                          ? 'status-pill-pending'
                          : isRejected
                          ? 'status-pill-disabled'
                          : 'status-pill-active'
                      }`}
                    >
                      {isPending
                        ? 'Pending Administrator Review'
                        : isRejected
                        ? 'Application Rejected'
                        : 'Approved & Verified'}
                    </span>
                  </div>
                </div>

                {isRejected && client.rejectionReason && (
                  <div className="id-rejection-banner">
                    <div className="id-rejection-title">
                      <i className="fa-solid fa-circle-exclamation"></i>
                      Rejection Reason Provided to Client:
                    </div>
                    <p className="id-rejection-text">{client.rejectionReason}</p>
                  </div>
                )}

                <div className="id-meta-grid">
                  <div className="id-meta-item">
                    <span className="id-meta-label">ID Category</span>
                    <span className="id-meta-val">{client.idType || 'Not specified'}</span>
                  </div>
                  <div className="id-meta-item">
                    <span className="id-meta-label">Submission Date</span>
                    <span className="id-meta-val">
                      {client.idSubmittedAt
                        ? new Date(client.idSubmittedAt).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })
                        : client.createdAt
                        ? new Date(client.createdAt).toLocaleDateString()
                        : '—'}
                    </span>
                  </div>
                  <div className="id-meta-item">
                    <span className="id-meta-label">Applicant Name</span>
                    <span className="id-meta-val">{displayName}</span>
                  </div>
                  <div className="id-meta-item">
                    <span className="id-meta-label">Email Address</span>
                    <span className="id-meta-val">{client.email || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Dual ID Previews (Front and Back) */}
              {hasIdData ? (
                <div className="id-dual-grid">
                  {/* Front Side Card */}
                  <div className="id-photo-card">
                    <div className="id-photo-header">
                      <div className="id-photo-title">
                        <i className="fa-regular fa-image text-purple"></i>
                        Front Side
                      </div>
                      <span className="id-side-pill">Required</span>
                    </div>

                    <div
                      className="id-preview-frame"
                      onClick={() =>
                        setPreviewModal({
                          isOpen: true,
                          imageUrl: client.idFrontUrl,
                          title: displayName,
                          side: 'Front Side',
                          idType: client.idType || 'Government ID'
                        })
                      }
                      title="Click to inspect high-resolution"
                    >
                      {client.idFrontUrl ? (
                        <>
                          <img
                            src={client.idFrontUrl}
                            alt="Front side of ID"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          <div className="id-preview-overlay">
                            <i className="fa-solid fa-magnifying-glass-plus" style={{ fontSize: '1.75rem' }}></i>
                            <span>Click to Inspect Full Size</span>
                          </div>
                        </>
                      ) : (
                        <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                          No front image available
                        </div>
                      )}
                    </div>

                    <div className="id-photo-footer">
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', maxWidth: '14rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {client.idFrontName || 'front_id.jpg'}
                      </span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                          onClick={() =>
                            setPreviewModal({
                              isOpen: true,
                              imageUrl: client.idFrontUrl,
                              title: displayName,
                              side: 'Front Side',
                              idType: client.idType || 'Government ID'
                            })
                          }
                          disabled={!client.idFrontUrl}
                        >
                          <i className="fa-solid fa-expand"></i> Inspect
                        </button>
                        {client.idFrontUrl && (
                          <a
                            href={client.idFrontUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                          >
                            <i className="fa-solid fa-arrow-up-right-from-square"></i> Open
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Back Side Card */}
                  <div className="id-photo-card">
                    <div className="id-photo-header">
                      <div className="id-photo-title">
                        <i className="fa-regular fa-image text-purple"></i>
                        Back Side
                      </div>
                      <span className="id-side-pill">
                        {client.idBackUrl ? 'Uploaded' : 'Optional / Single Sided'}
                      </span>
                    </div>

                    {client.idBackUrl ? (
                      <div
                        className="id-preview-frame"
                        onClick={() =>
                          setPreviewModal({
                            isOpen: true,
                            imageUrl: client.idBackUrl,
                            title: displayName,
                            side: 'Back Side',
                            idType: client.idType || 'Government ID'
                          })
                        }
                        title="Click to inspect high-resolution"
                      >
                        <img
                          src={client.idBackUrl}
                          alt="Back side of ID"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <div className="id-preview-overlay">
                          <i className="fa-solid fa-magnifying-glass-plus" style={{ fontSize: '1.75rem' }}></i>
                          <span>Click to Inspect Full Size</span>
                        </div>
                      </div>
                    ) : (
                      <div className="id-empty-back-box">
                        <i className="fa-solid fa-file-circle-minus" style={{ fontSize: '2rem', color: '#cbd5e1' }}></i>
                        <div>No back side was provided for this identification document.</div>
                      </div>
                    )}

                    <div className="id-photo-footer">
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', maxWidth: '14rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {client.idBackUrl ? client.idBackName || 'back_id.jpg' : 'Not attached'}
                      </span>
                      {client.idBackUrl && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                            onClick={() =>
                              setPreviewModal({
                                isOpen: true,
                                imageUrl: client.idBackUrl,
                                title: displayName,
                                side: 'Back Side',
                                idType: client.idType || 'Government ID'
                              })
                            }
                          >
                            <i className="fa-solid fa-expand"></i> Inspect
                          </button>
                          <a
                            href={client.idBackUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                          >
                            <i className="fa-solid fa-arrow-up-right-from-square"></i> Open
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                  <i className="fa-solid fa-id-card" style={{ fontSize: '2.5rem', color: '#94a3b8', marginBottom: '1rem' }}></i>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-dark)' }}>No Government ID on Record</h3>
                  <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.875rem' }}>
                    This client registered before the government ID verification system was introduced.
                  </p>
                </div>
              )}

              {/* Review & Decision Action Panel */}
              <div className="verification-decision-panel">
                <div className="decision-info-text">
                  <h3>Verification Actions</h3>
                  <p>
                    {isPending
                      ? 'Confirm that the ID photo matches the applicant and details are valid before approving.'
                      : isRejected
                      ? 'This application is currently rejected. You may override and approve if documentation is verified.'
                      : 'Account is verified. You may manage access or delete account if necessary.'}
                  </p>
                </div>

                <div className="decision-buttons-row">
                  {isPending && (
                    <>
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                        onClick={handleApprovePrompt}
                        disabled={isConfirmLoading || isSubmitting}
                      >
                        <i className="fa-solid fa-check-circle"></i>
                        Approve Account
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                        onClick={handleOpenRejectModal}
                        disabled={isConfirmLoading || isSubmitting}
                      >
                        <i className="fa-solid fa-xmark-circle"></i>
                        Reject Application
                      </button>
                      <button
                        type="button"
                        className="btn-danger"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                        onClick={handleDeletePrompt}
                        disabled={isConfirmLoading || isSubmitting}
                      >
                        <i className="fa-solid fa-trash-can"></i>
                        Delete Spam Account
                      </button>
                    </>
                  )}

                  {isRejected && (
                    <>
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                        onClick={handleApprovePrompt}
                        disabled={isConfirmLoading || isSubmitting}
                      >
                        <i className="fa-solid fa-check-circle"></i>
                        Override & Approve
                      </button>
                      <button
                        type="button"
                        className="btn-danger"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                        onClick={handleDeletePrompt}
                        disabled={isConfirmLoading || isSubmitting}
                      >
                        <i className="fa-solid fa-trash-can"></i>
                        Delete Spam Account
                      </button>
                    </>
                  )}

                  {!isPending && !isRejected && (
                    <button
                      type="button"
                      className="btn-danger"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                      onClick={handleDeletePrompt}
                      disabled={isConfirmLoading || isSubmitting}
                    >
                      <i className="fa-solid fa-trash-can"></i>
                      Delete Account
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lightbox / High-resolution ID Modal */}
      <IdPreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal((prev) => ({ ...prev, isOpen: false }))}
        imageUrl={previewModal.imageUrl}
        title={previewModal.title}
        side={previewModal.side}
        idType={previewModal.idType}
      />

      {/* Reject Reason Modal */}
      <RejectClientModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        client={client}
        onConfirmReject={handleConfirmReject}
        isLoading={isRejectLoading}
      />

      {/* Edit Client Modal */}
      <ClientEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        editingClient={client}
        onSubmit={handleEditSubmit}
        isLoading={isSubmitting}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!confirmState}
        onClose={() => setConfirmState(null)}
        onConfirm={handleConfirmAction}
        title={confirmState?.title}
        message={confirmState?.message}
        confirmLabel={confirmState?.confirmLabel}
        confirmIcon={confirmState?.confirmIcon}
        isDanger={confirmState?.isDanger}
        isLoading={isConfirmLoading}
      />
    </RecordDetailLayout>
  );
}
