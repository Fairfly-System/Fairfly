import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import RecordDetailLayout from '../../../components/UI/RecordDetailLayout/RecordDetailLayout';
import AlertBar from '../../../components/UI/AlertBar/AlertBar';
import KpiCard from '../../../components/UI/KpiCard/KpiCard';
import ClientEditModal from '../../../components/Admin/Modals/ClientEditModal/ClientEditModal';
import ConfirmationModal from '../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal';
import { fetchClientById, updateClient, deleteClient } from '../../../services/adminService';
import './admin-clients.css';

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userToken } = useAuthContext();
  const { addToast } = useToast();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Status Toggle
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

  // Delete Prompt
  const handleDeletePrompt = () => {
    if (!client) return;
    setConfirmState({
      type: 'delete',
      title: 'Delete Client Account?',
      message: `Are you sure you want to permanently delete ${client.fullName || client.name || 'this client'} (${client.email})? This action cannot be undone.`,
      confirmLabel: 'Delete Permanently',
      confirmIcon: 'fa-solid fa-trash-can',
      isDanger: true
    });
  };

  const handleConfirmAction = () => {
    if (!confirmState) return;

    if (confirmState.type === 'status') {
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
          addToast('Client account deleted permanently', 'success');
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
  const isDeactivated = client?.status === 'Deactivated';

  const breadcrumbs = [
    { label: 'Admin Portal', to: '/admin' },
    { label: 'Client Accounts', to: '/admin/clients' },
    { label: loading ? 'Loading...' : displayName, active: true }
  ];

  const actions = client
    ? [
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
      ]
    : [];

  const alertBarProps = useMemo(() => {
    if (!client) return null;
    if (client.status === 'Deactivated') {
      return {
        message: 'This client account is currently deactivated. The customer cannot book new services or schedule branch appointments.',
        type: 'warning'
      };
    }
    return {
      message: 'This client account is active and in good standing. Passwords and emails are protected and cannot be changed by administrators.',
      type: 'success'
    };
  }, [client]);

  return (
    <RecordDetailLayout
      title={client?.fullName || client?.name || 'Client Profile'}
      subtitle={client?.email || 'client@email.com'}
      status={client?.status || 'Active'}
      statusType={client?.status === 'Active' ? 'success' : 'danger'}
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
                  <span className={`status-pill ${client.status === 'Active' ? 'status-pill-active' : 'status-pill-disabled'}`}>
                    {client.status || 'Active'}
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
        </div>
      )}

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
