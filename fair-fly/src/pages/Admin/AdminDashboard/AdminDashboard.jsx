import './admin-dashboard.css';
import { useState, useEffect, useCallback } from 'react';
import { firestore } from '../../../firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { useAuthContext } from '../../../context/AuthContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
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
import {
  ACTION_META,
  relativeTime,
  humanResourceType,
  formatLogLine,
  revenueData,
  servicesCompletedData,
} from './dashboardUtils';

export default function Dashboard() {
  const { user, userDetails } = useAuthContext();
  
  // Recent activity from Firestore (15 items)
  const [recentLogs, setRecentLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // All logs for modal
  const [allLogs, setAllLogs] = useState([]);
  const [allLogsLoading, setAllLogsLoading] = useState(true);
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);

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

  // ── Render log row for Recent Activity card ────────────────────────────────
  const renderLogRow = (log, index) => {
    const meta = ACTION_META[log.actionType] || ACTION_META.UPDATE;
    return (
      <div
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
                {log.resourceId.slice(0, 8)}…
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
      </div>
    );
  };

  const adminName = userDetails?.name || user?.email?.split('@')[0] || 'Admin';

  return (
    <div className="dashboard page-fade-in">
      <WelcomeHero
        userName={adminName}
        subtitle="Manage travel services, monitor operators, and view incoming franchise applications in real-time."
        illustrationSrc="/pageImages/admin/dashboard.png"
      />

      <AlertBar
        message="System Monitor is fully active. All administrative action logs are recorded for compliance audit."
        type="info"
      />

      {/* Charts Section */}
      <section className="dashboard-charts">
        <div className="chart-card card">
          <h3 className="chart-title">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceef3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(val) => `₱${val / 1000}k`} />
              <Tooltip formatter={(val) => [`₱${val.toLocaleString()}`, 'Revenue']} />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#6B6FF5"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card card">
          <h3 className="chart-title">Services Completed</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={servicesCompletedData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceef3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" name="Completed" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Recent Activity Card */}
      <section className="recent-activity-card card">
        <div className="activity-card-header">
          <div>
            <h3 className="activity-card-title">
              <i
                className="fa-solid fa-clock-rotate-left"
                style={{ marginRight: '0.5rem', color: 'var(--purple)' }}
              />
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
            <p className="activity-empty">Loading activity...</p>
          ) : recentLogs.length === 0 ? (
            <div className="activity-empty">
              <i className="fa-solid fa-inbox" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }} />
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
    </div>
  );
}