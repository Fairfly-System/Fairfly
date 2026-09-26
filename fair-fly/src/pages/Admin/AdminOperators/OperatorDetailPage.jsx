import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import RecordDetailLayout from '../../../components/UI/RecordDetailLayout/RecordDetailLayout';
import OperatorModal from '../../../components/Admin/Modals/OperatorModal/OperatorModal';
import ConfirmationModal from '../../../components/Admin/Modals/ConfirmationModal/ConfirmationModal';
import AlertBar from '../../../components/UI/AlertBar/AlertBar';
import KpiCard from '../../../components/UI/KpiCard/KpiCard';
import Pagination from '../../../components/UI/Pagination/Pagination';
import {
  fetchOperatorById,
  updateOperator,
  deleteOperator,
  fetchAdminAnalytics,
} from '../../../services/adminService';
import toFriendlyMessage from '../../../utils/friendlyErrors';
import { auth, firestore } from '../../../firebase';
import { doc, onSnapshot, collection, query } from 'firebase/firestore';
import {
  PERIOD_OPTIONS,
  formatCurrency,
  formatReportPeriod,
  toRevenueChartData,
  buildAnalyticsCsv,
} from '../AdminDashboard/dashboardUtils';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import './operator-detail.css';

const TrashIcon = (props) => <i className="fa-solid fa-trash-can" {...props}></i>;
const BanIcon = (props) => <i className="fa-solid fa-ban" {...props}></i>;

export default function OperatorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userToken, user, userDetails } = useAuthContext();
  const isSuperAdmin =
    userDetails?.isSuperAdmin === true ||
    userDetails?.email === 'admin@gmail.com' ||
    user?.email === 'admin@gmail.com';
  const { addToast } = useToast();

  // Operator account details
  const [operator, setOperator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmState, setConfirmState] = useState(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  // Operator Analytics state
  const [period, setPeriod] = useState('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState('');
  const [ticketPage, setTicketPage] = useState(1);
  const [dashboardTicketSort, setDashboardTicketSort] = useState('priority');

  // Real-time active client services assigned to this branch
  const [activeServices, setActiveServices] = useState([]);
  const [activeServicesLoading, setActiveServicesLoading] = useState(true);

  // 1. Load Operator Profile
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

  // Live Firestore document listener for operator user record
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

  // 2. Fetch scoped analytics specifically for this operator
  useEffect(() => {
    if (!userToken || !id || (period === 'custom' && (!customFrom || !customTo))) return undefined;

    const params =
      period === 'custom'
        ? { from: customFrom, to: customTo, operatorId: id }
        : { period, operatorId: id };

    fetchAdminAnalytics(
      userToken,
      params,
      (data) => {
        setAnalyticsError('');
        setAnalytics(data);
      },
      (error) => setAnalyticsError(error.message || 'Unable to load operator analytics.'),
      setAnalyticsLoading
    );

    return undefined;
  }, [userToken, id, period, customFrom, customTo]);

  // 3. Real-time active services subscription for this branch
  useEffect(() => {
    if (!id) return;
    const q = query(collection(firestore, 'activeServices'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((s) => s.operatorId === id || s.branchUid === id);
        setActiveServices(list);
        setActiveServicesLoading(false);
      },
      (err) => {
        console.warn('Firestore activeServices subscription error:', err);
        setActiveServicesLoading(false);
      }
    );
    return () => unsubscribe();
  }, [id]);

  // 4. Status Toggle (Enable / Disable)
  const handleDeactivate = async () => {
    if (!operator) return;
    const newStatus = operator.status === 'Active' ? 'Disabled' : 'Active';
    updateOperator(
      userToken,
      operator.id,
      { status: newStatus },
      () => {
        addToast(
          `Operator account ${newStatus === 'Active' ? 'enabled' : 'disabled'} successfully`,
          'success'
        );
        setConfirmState(null);
        loadOperator();
      },
      (error) => {
        addToast(toFriendlyMessage(error, 'Failed to update status'), 'error');
      },
      setIsConfirmLoading
    );
  };

  // 5. Qualification Toggle
  const handleToggleQualification = async () => {
    if (!operator) return;
    const newQualifiedState = !operator.isQualified;
    setIsConfirmLoading(true);
    updateOperator(
      userToken,
      operator.id,
      { isQualified: newQualifiedState },
      () => {
        addToast(
          `Operator qualification ${newQualifiedState ? 'granted' : 'revoked'} successfully`,
          newQualifiedState ? 'success' : 'info'
        );
        setIsConfirmLoading(false);
        loadOperator();
      },
      (error) => {
        addToast(toFriendlyMessage(error, 'Failed to update qualification'), 'error');
        setIsConfirmLoading(false);
      },
      setIsConfirmLoading
    );
  };

  // 6. Delete Operator
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

  // 7. Update Operator form submit
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

  // 8. Export CSV for this specific operator
  const handleDownloadReport = () => {
    if (!analytics) return;
    const scopeTitle = `${operator?.branchName || 'Operator'} (${formatReportPeriod(analytics)})`;
    const csv = buildAnalyticsCsv(analytics, scopeTitle);
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    const branchSlug = (operator?.branchName || id).toLowerCase().replace(/[^a-z0-9]/g, '-');
    link.download = `fairfly-operator-${branchSlug}-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Process revenue trend for chart
  const revenueData = toRevenueChartData(analytics?.revenueTrend);

  // Tickets sorting and pagination
  const operatorTickets = useMemo(() => {
    const list = [...(analytics?.tickets || analytics?.highPriorityTickets || [])];
    return list.sort((first, second) => {
      if (dashboardTicketSort === 'priority') {
        const ranks = { urgent: 4, high: 3, medium: 2, low: 1 };
        const priorityDifference =
          (ranks[(second.priority || '').toLowerCase()] || 0) -
          (ranks[(first.priority || '').toLowerCase()] || 0);
        if (priorityDifference !== 0) return priorityDifference;
      }
      return new Date(second.createdAt || 0).getTime() - new Date(first.createdAt || 0).getTime();
    });
  }, [analytics, dashboardTicketSort]);

  const paginatedTickets = operatorTickets.slice((ticketPage - 1) * 5, ticketPage * 5);

  const activeInProgressCount = activeServices.filter(
    (s) => !['completed', 'cancelled', 'rejected'].includes((s.status || '').toLowerCase())
  ).length;

  const breadcrumbs = [
    { label: 'Dashboard', to: '/admin' },
    { label: 'Operators', to: '/admin/operators' },
    { label: operator ? operator.branchName || operator.name : 'Loading...' },
  ];

  const actions = isSuperAdmin
    ? [
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
      ]
    : [];

  const alertBarProps = useMemo(() => {
    if (!operator) return null;
    if (operator.status === 'Disabled') {
      return {
        message:
          'This operator account is currently deactivated. The operator will not be able to log in or fulfill services.',
        type: 'warning',
      };
    }
    return {
      message:
        'This operator account is active and processing client inquiries and fulfillment checklists.',
      type: 'success',
    };
  }, [operator]);

  return (
    <RecordDetailLayout
      title={operator?.branchName || operator?.name || 'Operator Profile'}
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

          {/* ── Analytics & Time Controls Card ────────────────── */}
          <section className="card operator-analytics-controls-card">
            <div className="analytics-card-header">
              <div>
                <h3 className="activity-card-title">
                  <i className="fa-solid fa-chart-line text-purple" /> Operator Analytics & Performance
                </h3>
                <p className="analytics-period">{formatReportPeriod(analytics)}</p>
              </div>
              <div className="analytics-controls">
                <label>
                  Period
                  <select value={period} onChange={(e) => setPeriod(e.target.value)}>
                    {PERIOD_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                {period === 'custom' && (
                  <>
                    <label>
                      From{' '}
                      <input
                        type="date"
                        value={customFrom}
                        onChange={(e) => setCustomFrom(e.target.value)}
                      />
                    </label>
                    <label>
                      To{' '}
                      <input
                        type="date"
                        value={customTo}
                        onChange={(e) => setCustomTo(e.target.value)}
                      />
                    </label>
                  </>
                )}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleDownloadReport}
                  disabled={!analytics || analyticsLoading}
                  title="Export CSV report for this operator"
                >
                  <i className="fa-solid fa-file-csv" /> Export CSV
                </button>
              </div>
            </div>
          </section>

          {analyticsError && <AlertBar message={analyticsError} type="error" />}

          {/* ── Performance KPIs Row (Real Analytics) ───────────── */}
          <section className="operator-kpi-grid">
            <KpiCard
              title="Total Revenue"
              value={formatCurrency(analytics?.totals?.revenue || 0)}
              detail="Branch revenue in selected period"
              icon="fa-solid fa-peso-sign"
              iconColor="var(--complete-green-dark)"
              isLoading={analyticsLoading}
            />
            <KpiCard
              title="Completed Services"
              value={analytics?.totals?.completedServices || 0}
              detail="Fulfilled client orders"
              icon="fa-solid fa-circle-check"
              iconColor="var(--complete-green-dark)"
              isLoading={analyticsLoading}
            />
            <KpiCard
              title="Active Services"
              value={activeInProgressCount}
              detail="Currently in fulfillment"
              icon="fa-solid fa-bars-progress"
              iconColor="var(--purple)"
              isLoading={activeServicesLoading}
            />
            <KpiCard
              title="Open Tickets"
              value={analytics?.totals?.openTickets || 0}
              detail={
                analytics?.totals?.highPriorityTickets
                  ? `${analytics.totals.highPriorityTickets} high priority`
                  : 'Pending resolution'
              }
              icon="fa-solid fa-ticket"
              iconColor="var(--orange)"
              isLoading={analyticsLoading}
            />
          </section>

          {/* ── Revenue Trend Chart Card ──────────────────────── */}
          <section className="card operator-chart-card">
            <div className="analytics-panel-header">
              <div>
                <h3 className="chart-title">Revenue Trajectory</h3>
                <p className="analytics-period">
                  Historical earnings across {formatReportPeriod(analytics)}
                </p>
              </div>
            </div>
            {revenueData.length > 0 ? (
              <div style={{ width: '100%', height: 300, marginTop: '1rem' }}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eceef3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(val) => `₱${Math.round(val / 1000)}k`}
                    />
                    <Tooltip formatter={(val) => [formatCurrency(val), 'Revenue']} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#6B6FF5"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="analytics-empty">
                No revenue trend data available for this period.
              </div>
            )}
          </section>

          {/* ── 2-Column Analytics & Profile Layout ─────────────── */}
          <div className="operator-analytics-columns">
            {/* Left Column: Analytics Breakdown */}
            <div className="operator-analytics-left-col">
              {/* Report Summary Card */}
              <article className="card detail-panel">
                <div className="activity-card-header">
                  <div>
                    <h3 className="panel-title">
                      <i className="fa-solid fa-chart-simple text-purple" /> Report Summary
                    </h3>
                    <p className="analytics-period" style={{ marginTop: '0.25rem' }}>
                      Period operational indicators
                    </p>
                  </div>
                </div>
                <div className="analytics-summary-grid" style={{ marginTop: '0.5rem' }}>
                  <div>
                    <strong>{analytics?.totals?.completedServices || 0}</strong>
                    <span>Completed services</span>
                  </div>
                  <div>
                    <strong>{formatCurrency(analytics?.totals?.revenue || 0)}</strong>
                    <span>Total revenue</span>
                  </div>
                  <div>
                    <strong>{analytics?.totals?.openTickets || 0}</strong>
                    <span>Open tickets</span>
                  </div>
                  <div>
                    <strong>{analytics?.totals?.highPriorityTickets || 0}</strong>
                    <span>High priority tickets</span>
                  </div>
                </div>
              </article>

              {/* Most Picked Services Ranking */}
              <article className="card detail-panel">
                <div className="analytics-panel-header">
                  <div>
                    <h3 className="panel-title">
                      <i className="fa-solid fa-medal text-purple" /> Most Picked Services
                    </h3>
                    <p className="analytics-period" style={{ marginTop: '0.25rem' }}>
                      Services fulfilled by this branch
                    </p>
                  </div>
                </div>
                <div className="service-ranking-list">
                  {(analytics?.serviceRanking || []).slice(0, 8).map((srv, idx) => (
                    <div className="service-ranking-row" key={srv.serviceType}>
                      <span className="service-ranking-number">{idx + 1}</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>
                        {srv.serviceType}
                      </span>
                      <strong>{srv.completed} completed</strong>
                    </div>
                  ))}
                  {(!analytics?.serviceRanking || analytics.serviceRanking.length === 0) && (
                    <div className="analytics-empty" style={{ padding: '1.5rem' }}>
                      No completed services in this period.
                    </div>
                  )}
                </div>
              </article>

              {/* Support Tickets for this Operator */}
              <article className="card detail-panel">
                <div className="analytics-panel-header">
                  <div>
                    <h3 className="panel-title">
                      <i className="fa-solid fa-ticket text-purple" /> Support Tickets
                    </h3>
                    <p className="analytics-period" style={{ marginTop: '0.25rem' }}>
                      Tickets raised or assigned to this branch
                    </p>
                  </div>
                  <select
                    value={dashboardTicketSort}
                    onChange={(e) => {
                      setDashboardTicketSort(e.target.value);
                      setTicketPage(1);
                    }}
                    aria-label="Sort tickets"
                    style={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      padding: '0.35rem 0.5rem',
                      color: 'var(--text-dark)',
                    }}
                  >
                    <option value="priority">Priority</option>
                    <option value="recent">Recent</option>
                  </select>
                </div>

                <div className="priority-ticket-list">
                  {paginatedTickets.map((t) => (
                    <div className="priority-ticket-row" key={t.id}>
                      <div>
                        <strong>{t.title}</strong>
                        <small>
                          {t.status} ·{' '}
                          {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'Recent'}
                        </small>
                      </div>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          background: ['urgent', 'high'].includes((t.priority || '').toLowerCase())
                            ? '#fee2e2'
                            : '#f1f5f9',
                          color: ['urgent', 'high'].includes((t.priority || '').toLowerCase())
                            ? '#dc2626'
                            : '#475569',
                        }}
                      >
                        {t.priority}
                      </span>
                    </div>
                  ))}
                  {operatorTickets.length === 0 && (
                    <div className="analytics-empty" style={{ padding: '1.5rem' }}>
                      No tickets for this operator in this period.
                    </div>
                  )}
                </div>
                {operatorTickets.length > 5 && (
                  <Pagination
                    currentPage={ticketPage}
                    totalItems={operatorTickets.length}
                    pageSize={5}
                    onPageChange={setTicketPage}
                    pageSizeOptions={[5]}
                  />
                )}
              </article>
            </div>

            {/* Right Column: Account Profile & Active Services */}
            <div className="operator-analytics-right-col">
              {/* Account Profile Card */}
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
                    <span
                      className={`status-pill ${
                        operator.status === 'Active' ? 'status-pill-active' : 'status-pill-disabled'
                      }`}
                    >
                      {operator.status || 'Active'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Registered Role</span>
                    <span className="detail-value">Operator Partner</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Service Qualification</span>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.2rem 0.65rem',
                          borderRadius: 'var(--radius-full, 9999px)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: operator.isQualified
                            ? 'var(--purple-soft, #ede9fe)'
                            : 'var(--bg-muted, #f1f5f9)',
                          color: operator.isQualified
                            ? 'var(--purple, #7c3aed)'
                            : 'var(--text-mid, #64748b)',
                          border: `1px solid ${operator.isQualified ? '#ddd6fe' : '#e2e8f0'}`,
                        }}
                      >
                        <i
                          className={`fa-solid ${
                            operator.isQualified ? 'fa-certificate text-purple' : 'fa-circle-xmark'
                          }`}
                        ></i>
                        {operator.isQualified ? 'Qualified Operator' : 'Standard Operator'}
                      </span>
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={handleToggleQualification}
                          disabled={isConfirmLoading}
                          style={{
                            padding: '0.25rem 0.6rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            borderRadius: 'var(--radius-sm, 0.375rem)',
                            border: '1px solid var(--border-color, #e2e8f0)',
                            background: operator.isQualified ? '#fff1f2' : '#f0fdf4',
                            color: operator.isQualified ? '#e11d48' : '#16a34a',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                          title={
                            operator.isQualified
                              ? 'Revoke custom service creation rights'
                              : 'Grant ability to create custom branch services'
                          }
                        >
                          <i
                            className={`fa-solid ${
                              operator.isQualified ? 'fa-user-xmark' : 'fa-user-check'
                            }`}
                          ></i>
                          {operator.isQualified ? 'Revoke Qualification' : 'Grant Qualification'}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Location / Address</span>
                    <span className="detail-value">{operator.address || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Contact Number</span>
                    <span className="detail-value">{operator.contactNumber || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Branch Account ID</span>
                    <span className="detail-value text-mono">{operator.id}</span>
                  </div>
                </div>
              </article>

              {/* Active Services in Fulfillment Card */}
              <article className="card detail-panel">
                <div className="analytics-panel-header">
                  <div>
                    <h3 className="panel-title">
                      <i className="fa-solid fa-spinner text-purple" /> Active Orders in Fulfillment
                    </h3>
                    <p className="analytics-period" style={{ marginTop: '0.25rem' }}>
                      Live processing requests assigned to this branch
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.55rem',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--purple-soft, #ede9fe)',
                      color: 'var(--purple, #7c3aed)',
                    }}
                  >
                    {activeInProgressCount} active
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    marginTop: '0.5rem',
                  }}
                >
                  {activeServices
                    .filter(
                      (s) =>
                        !['completed', 'cancelled', 'rejected'].includes(
                          (s.status || '').toLowerCase()
                        )
                    )
                    .slice(0, 6)
                    .map((svc) => (
                      <div
                        key={svc.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-md, 8px)',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-muted, #f8fafc)',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <strong style={{ fontSize: '0.875rem', color: 'var(--text-dark)' }}>
                            {svc.serviceType || svc.serviceName || 'Travel Service'}
                          </strong>
                          <small style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>
                            Client: {svc.clientName || svc.clientEmail || 'Client'}
                          </small>
                        </div>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '0.2rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            background: '#e0e7ff',
                            color: '#4338ca',
                          }}
                        >
                          {svc.status || 'In Progress'}
                        </span>
                      </div>
                    ))}

                  {activeInProgressCount === 0 && (
                    <div className="analytics-empty" style={{ padding: '1.5rem' }}>
                      No active client services currently in fulfillment for this branch.
                    </div>
                  )}
                </div>
              </article>
            </div>
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
            Desc={`"${operator.branchName || operator.name}" account will be permanently removed. This action cannot be undone.`}
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
            Title={
              operator.status === 'Active'
                ? 'Disable this operator account?'
                : 'Enable this operator account?'
            }
            Desc={
              operator.status === 'Active'
                ? `"${operator.branchName || operator.name}" will lose access to the portal until re-enabled.`
                : `"${operator.branchName || operator.name}" will regain access to their portal dashboard.`
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
