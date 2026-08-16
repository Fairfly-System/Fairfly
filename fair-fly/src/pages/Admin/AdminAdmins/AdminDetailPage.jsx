import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { doc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { firestore } from '../../../firebase';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import RecordDetailLayout from '../../../components/UI/RecordDetailLayout/RecordDetailLayout';
import AdminModal from '../../../components/Admin/Modals/AdminModal/AdminModal';
import ConfirmationModal from '../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal';
import AlertBar from '../../../components/UI/AlertBar/AlertBar';
import KpiCard from '../../../components/UI/KpiCard/KpiCard';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';
import './admin-admins.css';

const TrashIcon = (props) => <i className="fa-solid fa-trash-can" {...props}></i>;
const BanIcon = (props) => <i className="fa-solid fa-ban" {...props}></i>;

export default function AdminDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userToken, user, userDetails } = useAuthContext();
  const isSuperAdmin = userDetails?.isSuperAdmin === true || userDetails?.email === 'admin@gmail.com' || user?.email === 'admin@gmail.com';
  const { addToast } = useToast();

  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [confirmState, setConfirmState] = useState(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [operatorsMap, setOperatorsMap] = useState({});

  // Subscribe to real-time operators map
  useEffect(() => {
    const q = query(collection(firestore, 'users'), where('role', '==', 'operator'));
    const unsub = onSnapshot(q, (snap) => {
      const map = {};
      snap.docs.forEach((d) => {
        map[d.id] = { id: d.id, ...d.data() };
      });
      setOperatorsMap(map);
    });
    return () => unsub();
  }, []);

  // Subscribe to real-time doc
  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const docRef = doc(firestore, 'users', id);
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          const isSuper = d.isSuperAdmin === true || d.email === 'admin@gmail.com';
          setAdminData({
            id: snap.id,
            ...d,
            isSuperAdmin: isSuper
          });
        } else {
          setAdminData(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching admin details:', err);
        addToast('Failed to load administrator details', 'error');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id, addToast]);

  const handleDeactivate = async () => {
    if (!adminData) return;
    const newStatus = adminData.status === 'Active' ? 'Inactive' : 'Active';
    setIsConfirmLoading(true);

    ApiCaller(
      `${API_BASE_URL}/api/admins/${adminData.id}`,
      'PATCH',
      { status: newStatus },
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast(`Administrator ${newStatus === 'Active' ? 'enabled' : 'disabled'} successfully`, 'success');
        setConfirmState(null);
        setIsConfirmLoading(false);
      },
      (err) => {
        addToast(`Failed to update status: ${err.message}`, 'error');
        setIsConfirmLoading(false);
      },
      setIsConfirmLoading
    );
  };

  const handleDelete = async () => {
    if (!adminData) return;
    setIsConfirmLoading(true);

    ApiCaller(
      `${API_BASE_URL}/api/admins/${adminData.id}`,
      'DELETE',
      null,
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast('Administrator deleted successfully', 'success');
        navigate('/admin/admins');
      },
      (err) => {
        addToast(`Failed to delete administrator: ${err.message}`, 'error');
        setIsConfirmLoading(false);
      },
      setIsConfirmLoading
    );
  };

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    ApiCaller(
      `${API_BASE_URL}/api/admins/${adminData.id}`,
      'PATCH',
      formData,
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast('Administrator details updated successfully', 'success');
        setIsModalOpen(false);
        setIsSubmitting(false);
      },
      (err) => {
        addToast(`Failed to update administrator: ${err.message}`, 'error');
        setIsSubmitting(false);
      },
      setIsSubmitting
    );
  };

  const isTargetSuperAdmin = adminData?.isSuperAdmin || adminData?.email === 'admin@gmail.com';

  const breadcrumbs = [
    { label: 'Dashboard', to: '/admin' },
    { label: 'Administrators', to: '/admin/admins' },
    { label: adminData ? (adminData.fullName || adminData.username || adminData.email) : 'Loading...' }
  ];

  const actions = useMemo(() => {
    if (!isSuperAdmin || !adminData) return [];

    const list = [
      {
        label: 'Edit Profile',
        icon: 'fa-solid fa-pen-to-square',
        onClick: () => setIsModalOpen(true),
        className: 'btn-secondary',
        disabled: isSubmitting || isConfirmLoading
      }
    ];

    if (!isTargetSuperAdmin) {
      list.push({
        label: adminData.status === 'Active' ? 'Disable Account' : 'Enable Account',
        icon: adminData.status === 'Active' ? 'fa-solid fa-ban' : 'fa-solid fa-circle-check',
        onClick: () => setConfirmState('status'),
        className: 'btn-secondary',
        disabled: isSubmitting || isConfirmLoading
      });

      list.push({
        label: 'Delete Account',
        icon: 'fa-solid fa-trash',
        onClick: () => setConfirmState('delete'),
        className: 'btn-danger',
        disabled: isSubmitting || isConfirmLoading
      });
    }

    return list;
  }, [isSuperAdmin, adminData, isTargetSuperAdmin, isSubmitting, isConfirmLoading]);

  return (
    <RecordDetailLayout
      title={adminData?.fullName || adminData?.username || 'Administrator Details'}
      subtitle={adminData?.email || 'admin@fairfly.com'}
      status={adminData?.status ? adminData.status.toUpperCase() : 'ACTIVE'}
      statusType={adminData?.status === 'Inactive' ? 'inactive' : 'active'}
      breadcrumbs={breadcrumbs}
      backTo="/admin/admins"
      backLabel="Back to Administrators"
      actions={actions}
      isLoading={loading}
      isNotFound={!loading && !adminData}
      notFoundMessage="The administrator account could not be found."
    >
      {adminData && (
        <div className="admin-detail-wrapper">
          {isTargetSuperAdmin && (
            <AlertBar
              message="Primary Super Administrator account has full system privileges and cannot be disabled or deleted."
              type="info"
            />
          )}

          {/* Quick Metrics */}
          <section className="services-summary-grid">
            <KpiCard
              title="Account Privilege"
              value={isTargetSuperAdmin ? 'Super Admin' : 'Support Admin'}
              detail={isTargetSuperAdmin ? 'Full System Authority' : 'Assists Branch Operators'}
              icon={isTargetSuperAdmin ? 'fa-solid fa-crown' : 'fa-solid fa-shield-halved'}
              iconColor={isTargetSuperAdmin ? '#eab308' : 'var(--purple)'}
            />
            <KpiCard
              title="Account Status"
              value={adminData.status || 'Active'}
              detail="Authentication & Portal Access"
              icon="fa-regular fa-circle-check"
              iconColor="var(--complete-green-dark)"
            />
            <KpiCard
              title="Assigned Role"
              value="Admin"
              detail="Portal: Admin Management"
              icon="fa-solid fa-user-lock"
              iconColor="var(--purple)"
            />
          </section>

          {/* Details Grid */}
          <div className="details-grid-2">
            {/* Account Profile */}
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-user-shield"></i> Administrator Profile
              </h2>
              <div className="panel-details-list">
                <div className="detail-item">
                  <span className="detail-label">Username</span>
                  <span className="detail-value">{adminData.username || adminData.fullName || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Full Name</span>
                  <span className="detail-value">{adminData.fullName || adminData.name || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Email Address</span>
                  <span className="detail-value">{adminData.email}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Contact Phone</span>
                  <span className="detail-value">{adminData.phone || 'N/A'}</span>
                </div>
              </div>
            </article>

            {/* Privilege & System Details */}
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-key"></i> System Access & Metadata
              </h2>
              <div className="panel-details-list">
                <div className="detail-item">
                  <span className="detail-label">Account Privilege</span>
                  <span className="detail-value">
                    {isTargetSuperAdmin ? 'Super Administrator' : 'Support Administrator'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Created Date</span>
                  <span className="detail-value">
                    {adminData.createdAt
                      ? new Date(adminData.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Initial System Setup'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Created By</span>
                  <span className="detail-value">{adminData.createdByName || (isTargetSuperAdmin ? 'System Root' : 'Super Admin')}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">User ID (UID)</span>
                  <span className="detail-value" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {adminData.id}
                  </span>
                </div>
              </div>
            </article>
          </div>

          {/* Assigned Branch Operators Panel */}
          <article className="card detail-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 className="panel-title" style={{ margin: 0 }}>
                <i className="fa-solid fa-users"></i> Assigned Branch Operators
              </h2>
              {isSuperAdmin && !isTargetSuperAdmin && (
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '0.8125rem', padding: '0.3125rem 0.75rem' }}
                  onClick={() => setIsModalOpen(true)}
                >
                  <i className="fa-solid fa-pen-to-square"></i> Manage Assignments
                </button>
              )}
            </div>

            {isTargetSuperAdmin ? (
              <div style={{ padding: '1rem', background: 'var(--bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginTop: '0.75rem' }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-dark)', fontWeight: 600 }}>
                  <i className="fa-solid fa-crown" style={{ color: '#eab308', marginRight: '0.5rem' }}></i>
                  Global Access (All Branches)
                </p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-light)' }}>
                  As Super Administrator, this account has unrestricted administrative authority across all franchise branches and operators.
                </p>
              </div>
            ) : adminData.assignedOperators && adminData.assignedOperators.length > 0 ? (
              <div className="admin-assigned-operators-list">
                {adminData.assignedOperators.map((opId) => {
                  const op = operatorsMap[opId];
                  return (
                    <div key={opId} className="admin-assigned-op-card">
                      <div className="admin-assigned-op-avatar">
                        <i className="fa-solid fa-store"></i>
                      </div>
                      <div className="admin-assigned-op-details">
                        <span className="admin-assigned-op-name">
                          {op?.branchName || op?.name || 'Franchise Branch'}
                        </span>
                        <span className="admin-assigned-op-email">
                          {op?.email || 'N/A'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-light)', background: 'var(--bg)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)', marginTop: '0.75rem' }}>
                <i className="fa-solid fa-user-slash" style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }}></i>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: 'var(--text-dark)' }}>No Operators Assigned</p>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.8125rem' }}>This support administrator is not currently assigned to oversee any specific branch operators.</p>
                {isSuperAdmin && (
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ fontSize: '0.8125rem', padding: '0.375rem 0.875rem' }}
                    onClick={() => setIsModalOpen(true)}
                  >
                    <i className="fa-solid fa-plus"></i> Assign Branch Operators
                  </button>
                )}
              </div>
            )}
          </article>

          {/* Audit / Recent Activity Panel */}
          <article className="card detail-panel">
            <h2 className="panel-title">
              <i className="fa-solid fa-clock-rotate-left"></i> Administrator Activity & Audit Overview
            </h2>
            <div className="admin-actions-timeline">
              <div className="admin-action-item">
                <i className="fa-solid fa-circle-check admin-action-icon"></i>
                <div className="admin-action-body">
                  <span className="admin-action-title">Administrator Account Verified & Active</span>
                  <span className="admin-action-meta">
                    Security status OK · Last login activity recorded
                  </span>
                </div>
              </div>
              <div className="admin-action-item">
                <i className="fa-solid fa-user-shield admin-action-icon"></i>
                <div className="admin-action-body">
                  <span className="admin-action-title">Administrative Role Assigned</span>
                  <span className="admin-action-meta">
                    Permissions set to: {isTargetSuperAdmin ? 'Super Administrator (Full System Authority)' : 'Support Administrator (Branch & Inquiry Management)'}
                  </span>
                </div>
              </div>
            </div>
          </article>
        </div>
      )}

      {/* Edit Admin Modal */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingAdmin={adminData}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={confirmState === 'delete'}
        onClose={() => !isConfirmLoading && setConfirmState(null)}
        Icon={TrashIcon}
        Title="Delete Administrator?"
        Desc={`"${adminData?.fullName || adminData?.email}" will lose all administrative access permanently.`}
        BtnColor="var(--error-red)"
        confirmText="Delete Administrator"
        isLoading={isConfirmLoading}
        OnConfirm={handleDelete}
      />

      <ConfirmationModal
        isOpen={confirmState === 'status'}
        onClose={() => !isConfirmLoading && setConfirmState(null)}
        Icon={BanIcon}
        Title={adminData?.status === 'Active' ? 'Disable Administrator?' : 'Enable Administrator?'}
        Desc={
          adminData?.status === 'Active'
            ? `"${adminData?.fullName || adminData?.email}" will be temporarily barred from accessing the Admin Portal.`
            : `"${adminData?.fullName || adminData?.email}" will regain administrative access.`
        }
        BtnColor="var(--orange)"
        confirmText={adminData?.status === 'Active' ? 'Disable Account' : 'Enable Account'}
        isLoading={isConfirmLoading}
        OnConfirm={handleDeactivate}
      />
    </RecordDetailLayout>
  );
}
