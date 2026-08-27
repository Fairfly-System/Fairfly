import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import RecordDetailLayout from '../../../components/UI/RecordDetailLayout/RecordDetailLayout';
import OperatorModal from '../../../components/Admin/Modals/OperatorModal/OperatorModal';
import ConfirmationModal from '../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal';
import AlertBar from '../../../components/UI/AlertBar/AlertBar';
import KpiCard from '../../../components/UI/KpiCard/KpiCard';
import { fetchOperatorById, updateOperator, deleteOperator } from '../../../services/adminService';
import toFriendlyMessage from '../../../utils/friendlyErrors';
import { auth, firestore } from '../../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import './operator-detail.css';

const TrashIcon = (props) => <i className="fa-solid fa-trash-can" {...props}></i>;
const BanIcon = (props) => <i className="fa-solid fa-ban" {...props}></i>;

export default function OperatorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userToken, user, userDetails } = useAuthContext();
  const isSuperAdmin = userDetails?.isSuperAdmin === true || userDetails?.email === 'admin@gmail.com' || user?.email === 'admin@gmail.com';
  const { addToast } = useToast();

  const [operator, setOperator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmState, setConfirmState] = useState(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const loadOperator = useCallback(async () => {
    if (!id) return;
    let token = userToken;
    if (!token && auth.currentUser) {
      try {
        token = await auth.currentUser.getIdToken();
      } catch (e) {
        console.warn('Error fetching token:', e);
      }
    }

    if (token) {
      fetchOperatorById(
        token,
        id,
        (data) => {
          if (data) setOperator(data);
          setLoading(false);
        },
        (error) => {
          console.warn('fetchOperatorById API notice, relying on live Firestore doc:', error);
          setLoading(false);
        },
        setLoading
      );
    }
  }, [userToken, id]);

  // Live Firestore document listener
  useEffect(() => {
    if (!id) return;
    const unsubscribe = onSnapshot(
      doc(firestore, 'users', id),
      (docSnap) => {
        if (docSnap.exists()) {
          setOperator({ id: docSnap.id, uid: docSnap.id, ...docSnap.data() });
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Firestore doc subscription error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    loadOperator();
  }, [loadOperator]);

  const handleDeactivate = async () => {
    if (!operator) return;
    const newStatus = operator.status === 'Active' ? 'Disabled' : 'Active';
    updateOperator(
      userToken,
      operator.id,
      { status: newStatus },
      () => {
        addToast(`Operator account ${newStatus === 'Active' ? 'enabled' : 'disabled'} successfully`, 'success');
        setConfirmState(null);
        loadOperator();
      },
      (error) => {
        addToast(toFriendlyMessage(error, 'Failed to update status'), 'error');
      },
      setIsConfirmLoading
    );
  };

  const handleDelete = async () => {
    if (!operator) return;
    deleteOperator(
      userToken,
      operator.id,
      () => {
        addToast('Operator deleted successfully', 'success');
        navigate('/admin/operators');
      },
      (error) => {
        addToast(toFriendlyMessage(error, 'Failed to delete operator'), 'error');
      },
      setIsConfirmLoading
    );
  };

  const handleFormSubmit = async (operatorData) => {
    const { email, ...dataToUpdate } = operatorData;
    updateOperator(
      userToken,
      operator.id,
      dataToUpdate,
      () => {
        addToast('Operator details updated successfully', 'success');
        setIsModalOpen(false);
        loadOperator();
      },
      (error) => {
        addToast(toFriendlyMessage(error, 'Failed to update operator'), 'error');
      },
      setIsSubmitting
    );
  };

  // Mock charts / data statistics for now, prepared for future properties injection
  const stats = useMemo(() => {
    return {
      totalSales: '₱142,500.00',
      activeServicesCount: 8,
      completedServicesCount: 24,
      ticketsCreated: 3,
    };
  }, []);

  const recentActions = useMemo(() => {
    return [
      { id: 1, action: 'Updated Service Status', target: 'PSA Birth Certificate #4221', time: '2 hours ago' },
      { id: 2, action: 'Created Support Ticket', target: 'Payment Gateway Issue', time: '1 day ago' },
      { id: 3, action: 'Fulfilling Procedure Step 3', target: 'Japan Visa Application #1094', time: '3 days ago' },
    ];
  }, []);

  const breadcrumbs = [
    { label: 'Dashboard', to: '/admin' },
    { label: 'Operators', to: '/admin/operators' },
    { label: operator ? operator.branchName : 'Loading...' },
  ];

  const actions = isSuperAdmin ? [
    {
      label: 'Edit Info',
      icon: 'fa-solid fa-pen-to-square',
      onClick: () => setIsModalOpen(true),
      className: 'btn-secondary',
      disabled: isSubmitting || isConfirmLoading,
    },
    {
      label: operator?.status === 'Active' ? 'Disable Account' : 'Enable Account',
      icon: operator?.status === 'Active' ? 'fa-solid fa-ban' : 'fa-solid fa-circle-check',
      onClick: () => setConfirmState('status'),
      className: 'btn-secondary',
      disabled: isSubmitting || isConfirmLoading,
    },
    {
      label: 'Delete Account',
      icon: 'fa-solid fa-trash',
      onClick: () => setConfirmState('delete'),
      className: 'btn-danger',
      disabled: isSubmitting || isConfirmLoading,
    },
  ] : [];

  const alertBarProps = useMemo(() => {
    if (!operator) return null;
    if (operator.status === 'Disabled') {
      return {
        message: 'This operator account is currently deactivated. The operator will not be able to log in or fulfill services.',
        type: 'warning',
      };
    }
    return {
      message: 'This operator account is active and processing client inquiries and fulfillment checklists.',
      type: 'success',
    };
  }, [operator]);

  return (
    <RecordDetailLayout
      title={operator?.branchName || 'Operator Profile'}
      subtitle={operator?.email || 'operator@email.com'}
      status={operator?.status}
      statusType={operator?.status === 'Active' ? 'success' : 'danger'}
      breadcrumbs={breadcrumbs}
      backTo="/admin/operators"
      backLabel="Back to Operators"
      actions={operator ? actions : []}
      isLoading={loading}
      isNotFound={!loading && !operator}
      notFoundMessage="The operator record could not be found."
    >
      {operator && (
        <div className="operator-detail-wrapper">
          {alertBarProps && (
            <div className="operator-alert-container">
              <AlertBar message={alertBarProps.message} type={alertBarProps.type} />
            </div>
          )}

          {/* Performance KPIs Section */}
          <section className="details-grid-3">
            <KpiCard
              title="Assigned Active Services"
              value={stats.activeServicesCount}
              icon="fa-solid fa-spinner"
              iconColor="var(--purple)"
              detail="Checks and updates pending"
            />
            <KpiCard
              title="Sales Volume"
              value={stats.totalSales}
              icon="fa-solid fa-peso-sign"
              iconColor="var(--complete-green-dark)"
              detail="Total generated commission volume"
            />
            <KpiCard
              title="Fulfilled Service Orders"
              value={stats.completedServicesCount}
              icon="fa-solid fa-circle-check"
              iconColor="var(--complete-green-dark)"
              detail="Total successful processing cycles"
            />
          </section>

          {/* Main Info Columns */}
          <div className="details-grid-2">
            {/* Account Details Box */}
            <article className="card detail-panel">
              <h2 className="panel-title">
                <i className="fa-solid fa-user-gear text-purple"></i> Account Profile
              </h2>
              <div className="panel-details-list">
                <div className="detail-item">
                  <span className="detail-label">Email Address</span>
                  <span className="detail-value">{operator.email || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Branch Status</span>
                  <span className={`status-pill ${operator.status === 'Active' ? 'status-pill-active' : 'status-pill-disabled'}`}>
                    {operator.status || 'Active'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Registered Role</span>
                  <span className="detail-value">Operator Partner</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Branch Account ID</span>
                  <span className="detail-value text-mono">{operator.id}</span>
                </div>
              </div>
            </article>

            {/* Performance Analytics Tab Card */}
            <article className="card detail-panel">
              <div className="panel-header-tabs">
                <button
                  className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  Activity Logs
                </button>
                <button
                  className={`tab-btn ${activeTab === 'performance' ? 'active' : ''}`}
                  onClick={() => setActiveTab('performance')}
                >
                  Branch Insights
                </button>
              </div>

              {activeTab === 'overview' ? (
                <div className="action-logs-list">
                  {recentActions.map((act) => (
                    <div key={act.id} className="log-item">
                      <div className="log-dot"></div>
                      <div className="log-content">
                        <p className="log-action">
                          <strong>{act.action}</strong>: {act.target}
                        </p>
                        <span className="log-time">{act.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mock-chart-container">
                  <div className="chart-placeholder">
                    <i className="fa-solid fa-chart-line chart-icon"></i>
                    <p className="chart-title">Weekly Processing Output</p>
                    <div className="mock-bars">
                      <div className="bar" style={{ height: '35%' }}></div>
                      <div className="bar" style={{ height: '60%' }}></div>
                      <div className="bar" style={{ height: '45%' }}></div>
                      <div className="bar active" style={{ height: '80%' }}></div>
                      <div className="bar" style={{ height: '65%' }}></div>
                    </div>
                    <span className="chart-subtitle">Prepared for telemetry injection</span>
                  </div>
                </div>
              )}
            </article>
          </div>

          {/* Form Modal for editing */}
          <OperatorModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            editingOperator={operator}
            onSubmit={handleFormSubmit}
            isLoading={isSubmitting}
          />

          {/* Single Delete confirmation */}
          <ConfirmationModal
            isOpen={confirmState === 'delete'}
            onClose={() => !isConfirmLoading && setConfirmState(null)}
            Icon={TrashIcon}
            Title="Delete this operator account?"
            Desc={`"${operator.branchName}" account will be permanently removed. This action cannot be undone.`}
            BtnColor="var(--error-red)"
            confirmText="Delete Account"
            isLoading={isConfirmLoading}
            OnConfirm={handleDelete}
          />

          {/* Single Deactivate/Activate confirmation */}
          <ConfirmationModal
            isOpen={confirmState === 'status'}
            onClose={() => !isConfirmLoading && setConfirmState(null)}
            Icon={BanIcon}
            Title={operator.status === 'Active' ? 'Disable this operator account?' : 'Enable this operator account?'}
            Desc={operator.status === 'Active' 
              ? `"${operator.branchName}" will lose access to the portal until re-enabled.` 
              : `"${operator.branchName}" will regain access to their portal dashboard.`
            }
            BtnColor="var(--orange)"
            confirmText={operator.status === 'Active' ? 'Disable Account' : 'Enable Account'}
            isLoading={isConfirmLoading}
            OnConfirm={handleDeactivate}
          />
        </div>
      )}
    </RecordDetailLayout>
  );
}
