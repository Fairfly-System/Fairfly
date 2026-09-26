import './admin-dashboard.css';
import { useState, useEffect, useCallback } from 'react';
import { firestore } from '../../../firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { useAuthContext } from '../../../context/AuthContext';
import { fetchAdminAnalytics } from '../../../services/adminService';
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
import AlertBar from '../../../components/UI/AlertBar/AlertBar';
import WelcomeHero from '../../../components/UI/WelcomeHero/WelcomeHero';
import AdminLogsModal from '../../../components/Admin/Modals/AdminLogsModal/AdminLogsModal';
import Pagination from '../../../components/UI/Pagination/Pagination';
import {
  ACTION_META,
  relativeTime,
  humanResourceType,
  formatLogLine,
  PERIOD_OPTIONS,
  formatCurrency,
  formatReportPeriod,
  toRevenueChartData,
  buildAnalyticsCsv,
} from './dashboardUtils';

export default function Dashboard() {
  const { user, userDetails, userToken } = useAuthContext();

  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState('');
  const [period, setPeriod] = useState('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [selectedOperatorId, setSelectedOperatorId] = useState('');
  const [operatorSort, setOperatorSort] = useState('completed');
  const [operatorPage, setOperatorPage] = useState(1);
  const [ticketPage, setTicketPage] = useState(1);
  const [dashboardTicketSort, setDashboardTicketSort] = useState('priority');
  
  // Recent activity from Firestore (15 items)
  const [recentLogs, setRecentLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // All logs for modal
  const [allLogs, setAllLogs] = useState([]);
  const [allLogsLoading, setAllLogsLoading] = useState(true);
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);

  useEffect(() => {
    if (!userToken || (period === 'custom' && (!customFrom || !customTo))) return undefined;

    const params = period === 'custom'
      ? { from: customFrom, to: customTo, operatorId: selectedOperatorId }
      : { period, operatorId: selectedOperatorId };

    fetchAdminAnalytics(
      userToken,
      params,
      (data) => {
        setAnalyticsError('');
        setAnalytics(data);
      },
      (error) => setAnalyticsError(error.message || 'Unable to load analytics.'),
      setAnalyticsLoading
    );

    return undefined;
  }, [userToken, period, customFrom, customTo, selectedOperatorId]);

  // ── Recent logs subscription ──────────────────────────────────────────────
  useEffect(() => {
    const q = query(
      collection(firestore, 'admin-logs'),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setRecentLogs(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setLogsLoading(false);
      },
      (err) => {
        console.error('Failed to subscribe to admin-logs:', err);
        setLogsLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  // ── All logs subscription (when modal is opened) ──────────────────────────
  useEffect(() => {
    if (!isViewAllOpen) return;

    const q = query(collection(firestore, 'admin-logs'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setAllLogs(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setAllLogsLoading(false);
      },
      (err) => {
        console.error('Failed to subscribe to admin-logs (all):', err);
        setAllLogsLoading(false);
      }
    );
    return unsubscribe;
  }, [isViewAllOpen]);

  // ── Export logs helper (.txt download) ────────────────────────────────────
  const handleExportLogs = useCallback(
    (logsToExport = recentLogs) => {
      const source = logsToExport.length > 0 ? logsToExport : recentLogs;
      if (source.length === 0) return;

      const header = `FairFly Admin Action Logs — Exported ${new Date().toISOString()}\n${'='.repeat(
        80
      )}\n\n`;
      const lines = source.map(formatLogLine).join('\n');
      const content = header + lines + '\n';

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admin-logs-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [recentLogs]
  );

  const handleDownloadReport = () => {
    if (!analytics) return;
    const csv = buildAnalyticsCsv(analytics, selectedOperatorId ? 'Selected operator' : formatReportPeriod(analytics));
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `fairfly-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const sortedOperators = [...(analytics?.operators || [])].sort((first, second) => {
    if (operatorSort === 'recent') {
      return (new Date(second.lastCompletedAt || 0).getTime()) - (new Date(first.lastCompletedAt || 0).getTime());
    }
    return second.completedServices - first.completedServices;
  });

  const paginatedOperators = sortedOperators.slice((operatorPage - 1) * 5, operatorPage * 5);
  const dashboardTickets = [...(analytics?.tickets || analytics?.highPriorityTickets || [])].sort((first, second) => {
    if (dashboardTicketSort === 'priority') {
      const ranks = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDifference = (ranks[(second.priority || '').toLowerCase()] || 0)
        - (ranks[(first.priority || '').toLowerCase()] || 0);
      if (priorityDifference !== 0) return priorityDifference;
    }
    return new Date(second.createdAt || 0).getTime() - new Date(first.createdAt || 0).getTime();
  });
  const paginatedTickets = dashboardTickets.slice((ticketPage - 1) * 5, ticketPage * 5);

  const revenueData = toRevenueChartData(analytics?.revenueTrend);
  const selectedOperator = selectedOperatorId
    ? analytics?.operators?.find((operator) => operator.id === selectedOperatorId)
    : null;

  // ── Render log row for Recent Activity card ────────────────────────────────
  const renderLogRow = (log, index) => {
    const meta = ACTION_META[log.actionType] || ACTION_META.UPDATE;
    return (
      <article
        className="activity-row"
        key={log.id}
        style={{ animationDelay: `${index * 0.03}s` }}
      >
        <div
          className="activity-icon-bubble"
          style={{ background: meta.bg, border: `1px solid ${meta.color}20` }}
        >
          <i className={meta.icon} style={{ color: meta.color, fontSize: '0.75rem' }} />
        </div>

        <div className="activity-body">
          <p className="activity-summary">
            <span className={`action-badge action-badge--${log.actionType?.toLowerCase()}`}>
              {meta.label}
            </span>
            <span className="activity-resource">{humanResourceType(log.resourceType)}</span>
            {log.resourceId && (
              <span className="activity-id" title={log.resourceId}>
                {log.resourceId.length > 14 ? `${log.resourceId.slice(0, 14)}…` : log.resourceId}
              </span>
            )}
          </p>
          <p className="activity-meta">
            <span title={log.adminUid}>{log.adminEmail}</span>
            <span className="activity-dot">·</span>
            <span title={log.timestamp}>{relativeTime(log.timestamp)}</span>
          </p>
        </div>

        <span className="activity-status-code" title={`HTTP ${log.statusCode}`}>
          {log.statusCode}
        </span>
      </article>
    );
  };

  const adminName = userDetails?.name || user?.email?.split('@')[0] || 'Admin';

  return (
    <main className="dashboard page-fade-in">
      <WelcomeHero
        userName={adminName}
        subtitle="Manage travel services, monitor operators, and view incoming franchise applications in real-time."
        illustrationSrc="/pageImages/admin/dashboard.png"
      />

      <AlertBar
        message="System Monitor is fully active. All administrative action logs are recorded for compliance audit."
        type="info"
      />

      <section className="performance-overview card">
        <div>
          <h3 className="activity-card-title">Performance Overview</h3>
          <p className="analytics-period">{formatReportPeriod(analytics)}</p>
        </div>
        <div className="analytics-controls">
          <label>
            Period
            <select value={period} onChange={(event) => setPeriod(event.target.value)}>
              {PERIOD_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          {period === 'custom' && (
            <>
              <label>From<input type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} /></label>
              <label>To<input type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} /></label>
            </>
          )}
          <button className="btn-secondary" onClick={handleDownloadReport} disabled={!analytics} title="Download analytics report as CSV">
            <i className="fa-solid fa-file-csv" /> Export CSV
          </button>
        </div>
      </section>

      {analyticsError && <AlertBar message={analyticsError} type="error" />}
      {analyticsLoading && <div className="analytics-loading card">Loading analytics...</div>}

      {!analyticsLoading && analytics && (
        <>
          <section className="performance-overview card">
            <div className="performance-metrics">
              <article className="performance-metric-card">
                <div className="activity-icon-bubble performance-icon performance-icon--services"><i className="fa-solid fa-list-check" /></div>
                <div><span>Services Completed</span><strong>{analytics.totals.completedServices}</strong><small>For the selected period</small></div>
              </article>
              <article className="performance-metric-card">
                <div className="activity-icon-bubble performance-icon performance-icon--revenue"><i className="fa-solid fa-peso-sign" /></div>
                <div><span>Total Revenue</span><strong>{formatCurrency(analytics.totals.revenue)}</strong><small>For the selected period</small></div>
              </article>
            </div>
            <article className="performance-chart">
              <h3 className="chart-title">Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eceef3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `₱${Math.round(value / 1000)}k`} />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#6B6FF5" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </article>
          </section>

          <section className="report-summary card">
            <div className="activity-card-header">
              <div><h3 className="activity-card-title"><i className="fa-solid fa-chart-simple activity-card-icon" /> Report Summary</h3><p className="activity-card-subtitle">Selected period totals and operational indicators</p></div>
              <span className="analytics-period">{selectedOperator ? selectedOperator.name : formatReportPeriod(analytics)}</span>
            </div>
            <div className="analytics-summary-grid">
              <div><strong>{analytics.totals.completedServices}</strong><span>Completed services</span></div>
              <div><strong>{formatCurrency(analytics.totals.revenue)}</strong><span>Revenue</span></div>
              <div><strong>{analytics.totals.openTickets}</strong><span>Open tickets</span></div>
              <div><strong>{analytics.totals.highPriorityTickets}</strong><span>High priority</span></div>
            </div>
          </section>

          <section className="analytics-grid">
            <article className="card analytics-panel analytics-operators">
              <div className="analytics-panel-header">
                <div><h3 className="chart-title">Operators</h3><p className="analytics-period">Select an operator to generate a focused report.</p></div>
                <select value={operatorSort} onChange={(event) => setOperatorSort(event.target.value)} aria-label="Sort operators">
                  <option value="completed">Most services completed</option>
                  <option value="recent">Most recent activity</option>
                </select>
              </div>
              <div className="analytics-table-wrap">
                <table className="analytics-table">
                  <thead><tr><th>Operator</th><th>Completed</th><th>Revenue</th><th>Tickets</th><th /></tr></thead>
                  <tbody>
                    {paginatedOperators.map((operator) => <tr key={operator.id} className={selectedOperatorId === operator.id ? 'analytics-row-selected' : ''}><td><strong>{operator.name}</strong><small>{operator.email}</small></td><td>{operator.completedServices}</td><td>{formatCurrency(operator.revenue)}</td><td>{operator.openTickets}</td><td><button className="analytics-select-button" onClick={() => setSelectedOperatorId(operator.id)}>View</button></td></tr>)}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={operatorPage} totalItems={sortedOperators.length} pageSize={5} onPageChange={setOperatorPage} pageSizeOptions={[5]} />
            </article>

            <article className="card analytics-panel">
              <div className="analytics-panel-header"><h3 className="chart-title">Most Picked Services</h3><span className="analytics-period">Completed services</span></div>
              <div className="service-ranking-list">{(analytics.serviceRanking || []).slice(0, 8).map((service, index) => <div className="service-ranking-row" key={service.serviceType}><span className="service-ranking-number">{index + 1}</span><span>{service.serviceType}</span><strong>{service.completed}</strong></div>)}</div>
              {analytics.serviceRanking?.length === 0 && <div className="analytics-empty">No completed services in this period.</div>}
            </article>

            <article className="card analytics-panel">
              <div className="analytics-panel-header"><div><h3 className="chart-title">Tickets</h3><span className="analytics-period">Open support tickets</span></div><select value={dashboardTicketSort} onChange={(event) => { setDashboardTicketSort(event.target.value); setTicketPage(1); }} aria-label="Sort dashboard tickets"><option value="priority">Priority</option><option value="recent">Recent</option></select></div>
              <div className="priority-ticket-list">{paginatedTickets.map((ticket) => <div className="priority-ticket-row" key={ticket.id}><div><strong>{ticket.title}</strong><small>{ticket.operatorName} · {ticket.status}</small></div><span>{ticket.priority}</span></div>)}</div>
              <Pagination currentPage={ticketPage} totalItems={dashboardTickets.length} pageSize={5} onPageChange={setTicketPage} pageSizeOptions={[5]} />
              {dashboardTickets.length === 0 && <div className="analytics-empty">No open tickets in this period.</div>}
            </article>
          </section>
        </>
      )}

      {/* Recent Activity Card */}
      <section className="recent-activity-card card">
        <div className="activity-card-header">
          <div>
            <h3 className="activity-card-title">
              <i className="fa-solid fa-clock-rotate-left activity-card-icon" />
              Recent Activity
            </h3>
            <p className="activity-card-subtitle">Latest admin actions across the system</p>
          </div>

          <div className="activity-header-actions">
            <button
              className="btn-secondary activity-export-btn"
              onClick={() => handleExportLogs(recentLogs)}
              title="Export logs as .txt"
            >
              <i className="fa-solid fa-file-export" />
              <span>Export</span>
            </button>
            <button className="btn-primary activity-viewall-btn" onClick={() => setIsViewAllOpen(true)}>
              <i className="fa-solid fa-arrow-up-right-from-square" />
              <span>View All</span>
            </button>
          </div>
        </div>

        <div className="activity-list">
          {logsLoading ? (
            <div className="activity-loading-list" aria-busy="true">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="activity-skeleton-row">
                  <div className="skeleton skeleton-circle activity-skeleton-bubble" />
                  <div className="activity-skeleton-body">
                    <div className="skeleton skeleton-text activity-skeleton-text-1" />
                    <div className="skeleton skeleton-text activity-skeleton-text-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentLogs.length === 0 ? (
            <div className="activity-empty">
              <i className="fa-solid fa-inbox activity-empty-icon" />
              <p>No activity recorded yet. Actions will appear here automatically.</p>
            </div>
          ) : (
            recentLogs.map((log, i) => renderLogRow(log, i))
          )}
        </div>
      </section>

      {/* Standalone Admin Action Logs Modal */}
      <AdminLogsModal
        isOpen={isViewAllOpen}
        onClose={() => setIsViewAllOpen(false)}
        allLogs={allLogs}
        allLogsLoading={allLogsLoading}
        onExportLogs={(logs) => handleExportLogs(logs)}
      />
    </main>
  );
}