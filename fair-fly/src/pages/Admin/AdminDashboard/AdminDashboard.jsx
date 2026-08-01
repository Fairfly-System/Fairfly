import './admin-dashboard.css';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { firestore } from '../../../firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
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
import ModalWrapper from '../../../components/Admin/Modals/ModalWrapper';
import Pagination from '../../../components/UI/Pagination/Pagination';

// ── Helpers ─────────────────────────────────────────────────────────────────

const ACTION_META = {
  CREATE: { label: 'Created', icon: 'fa-solid fa-plus', color: '#16a34a', bg: '#dcfce7' },
  UPDATE: { label: 'Updated', icon: 'fa-solid fa-pen', color: '#3b82f6', bg: '#dbeafe' },
  DELETE: { label: 'Deleted', icon: 'fa-solid fa-trash-can', color: '#dc2626', bg: '#fee2e2' },
};

function relativeTime(isoString) {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(isoString).toLocaleDateString();
}

function humanResourceType(type) {
  const map = {
    service: 'Service',
    operator: 'Operator',
    workflowTemplate: 'Workflow Template',
    workflowInstance: 'Workflow Instance',
    franchiseApplication: 'Franchise App',
    quicklink: 'Quick Link',
    chat: 'Chat',
    unknown: 'Resource',
  };
  return map[type] || type;
}

function formatLogLine(log) {
  const date = new Date(log.timestamp);
  const dateStr = date.toISOString().replace('T', ' ').slice(0, 19);
  const resource = humanResourceType(log.resourceType);
  const id = log.resourceId ? ` (ID: ${log.resourceId})` : '';
  return `[${dateStr}] ${log.actionType} ${resource}${id} by ${log.adminEmail} (${log.adminUid}) — HTTP ${log.method} ${log.path} → ${log.statusCode}`;
}

// ── Placeholder chart data ──────────────────────────────────────────────────

const revenueData = [
  { month: 'Jan', revenue: 185000 },
  { month: 'Feb', revenue: 210000 },
  { month: 'Mar', revenue: 195000 },
  { month: 'Apr', revenue: 240000 },
  { month: 'May', revenue: 220000 },
  { month: 'Jun', revenue: 260000 },
  { month: 'Jul', revenue: 275000 },
  { month: 'Aug', revenue: 250000 },
  { month: 'Sep', revenue: 290000 },
  { month: 'Oct', revenue: 310000 },
  { month: 'Nov', revenue: 295000 },
  { month: 'Dec', revenue: 330000 },
];

const servicesCompletedData = [
  { month: 'Jan', completed: 32 },
  { month: 'Feb', completed: 41 },
  { month: 'Mar', completed: 38 },
  { month: 'Apr', completed: 50 },
  { month: 'May', completed: 47 },
  { month: 'Jun', completed: 55 },
  { month: 'Jul', completed: 60 },
  { month: 'Aug', completed: 58 },
  { month: 'Sep', completed: 63 },
  { month: 'Oct', completed: 70 },
  { month: 'Nov', completed: 66 },
  { month: 'Dec', completed: 75 },
];

// ── Component ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  // Recent activity from Firestore
  const [recentLogs, setRecentLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // "View All" modal state
  const [allLogs, setAllLogs] = useState([]);
  const [allLogsLoading, setAllLogsLoading] = useState(true);
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [modalActionFilter, setModalActionFilter] = useState('all');
  const [modalPage, setModalPage] = useState(1);
  const [modalPageSize, setModalPageSize] = useState(10);

  // ── Recent logs (dashboard card — 15 most recent) ─────────────────────
  useEffect(() => {
    const q = query(
      collection(firestore, 'admin-logs'),
      orderBy('timestamp', 'desc'),
      limit(15)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRecentLogs(
        snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      );
      setLogsLoading(false);
    }, (err) => {
      console.error('Failed to subscribe to admin-logs:', err);
      setLogsLoading(false);
    });
    return unsubscribe;
  }, []);

  // ── All logs (modal — full collection for search/pagination) ──────────
  useEffect(() => {
    if (!isViewAllOpen) return;

    const q = query(
      collection(firestore, 'admin-logs'),
      orderBy('timestamp', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAllLogs(
        snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      );
      setAllLogsLoading(false);
    }, (err) => {
      console.error('Failed to subscribe to admin-logs (all):', err);
      setAllLogsLoading(false);
    });
    return unsubscribe;
  }, [isViewAllOpen]);

  // ── Modal filtered + paginated data ───────────────────────────────────
  const filteredModalLogs = useMemo(() => {
    return allLogs.filter(log => {
      const matchesSearch =
        modalSearch === '' ||
        (log.adminEmail || '').toLowerCase().includes(modalSearch.toLowerCase()) ||
        (log.resourceType || '').toLowerCase().includes(modalSearch.toLowerCase()) ||
        (log.path || '').toLowerCase().includes(modalSearch.toLowerCase()) ||
        (log.adminUid || '').toLowerCase().includes(modalSearch.toLowerCase());

      const matchesAction =
        modalActionFilter === 'all' ||
        log.actionType === modalActionFilter;

      return matchesSearch && matchesAction;
    });
  }, [allLogs, modalSearch, modalActionFilter]);

  const paginatedModalLogs = useMemo(() => {
    const start = (modalPage - 1) * modalPageSize;
    return filteredModalLogs.slice(start, start + modalPageSize);
  }, [filteredModalLogs, modalPage, modalPageSize]);

  // ── Export logs as .txt ───────────────────────────────────────────────
  const handleExportLogs = useCallback(() => {
    const source = isViewAllOpen ? filteredModalLogs : recentLogs;
    if (source.length === 0) return;

    const header = `FairFly Admin Action Logs — Exported ${new Date().toISOString()}\n${'='.repeat(80)}\n\n`;
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
  }, [isViewAllOpen, filteredModalLogs, recentLogs]);

  // ── Render helpers ────────────────────────────────────────────────────
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
            <span className="activity-resource">
              {humanResourceType(log.resourceType)}
            </span>
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

  // ────────────────────────────────────────────────────────────────────────

  return (
    <div className="dashboard">
      <AlertBar
        message="Welcome to the Admin Dashboard! Here you can monitor key metrics, manage services, and review franchise applications."
        type="info"
      />

      {/* Charts Section */}
      <section className="dashboard-charts">
        <div className="chart-card">
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
                stroke="#16a34a"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
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

      {/* ── Recent Activity Card ──────────────────────────────────────────── */}
      <section className="recent-activity-card card">
        <div className="activity-card-header">
          <div>
            <h3 className="activity-card-title">
              <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: '0.5rem', color: 'var(--purple)' }} />
              Recent Activity
            </h3>
            <p className="activity-card-subtitle">Latest admin actions across the system</p>
          </div>

          <div className="activity-header-actions">
            <button className="activity-export-btn" onClick={handleExportLogs} title="Export logs as .txt">
              <i className="fa-solid fa-file-export" />
              <span>Export</span>
            </button>
            <button className="activity-viewall-btn" onClick={() => setIsViewAllOpen(true)}>
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

      {/* ── View All Logs Modal ───────────────────────────────────────────── */}
      <ModalWrapper
        isOpen={isViewAllOpen}
        onClose={() => {
          setIsViewAllOpen(false);
          setModalSearch('');
          setModalActionFilter('all');
          setModalPage(1);
        }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fa-solid fa-clock-rotate-left" style={{ color: 'var(--purple)' }} />
            <span>Admin Action Logs</span>
          </div>
        }
        subtitle="Full searchable history of all admin actions"
      >
        <div className="logs-modal-content">
          {/* Toolbar */}
          <div className="logs-modal-toolbar">
            <div className="search-box" style={{ flex: 1 }}>
              <i className="fa-solid fa-magnifying-glass search-icon" />
              <input
                type="text"
                placeholder="Search by email, resource, path, or UID..."
                value={modalSearch}
                onChange={(e) => { setModalSearch(e.target.value); setModalPage(1); }}
              />
              {modalSearch && (
                <button className="clear-search-btn" onClick={() => { setModalSearch(''); setModalPage(1); }}>
                  <i className="fa-solid fa-xmark" />
                </button>
              )}
            </div>

            <div className="filter-chips">
              {['all', 'CREATE', 'UPDATE', 'DELETE'].map(f => (
                <button
                  key={f}
                  className={`filter-chip ${modalActionFilter === f ? 'active' : ''}`}
                  onClick={() => { setModalActionFilter(f); setModalPage(1); }}
                >
                  {f === 'all' ? `All (${allLogs.length})` : f}
                </button>
              ))}
            </div>

            <button className="activity-export-btn" onClick={handleExportLogs} title="Export filtered logs">
              <i className="fa-solid fa-file-export" />
              <span>Export</span>
            </button>
          </div>

          {/* Log rows */}
          <div className="logs-modal-list">
            {allLogsLoading ? (
              <p className="activity-empty">Loading logs...</p>
            ) : paginatedModalLogs.length === 0 ? (
              <p className="activity-empty">No logs match your search.</p>
            ) : (
              paginatedModalLogs.map((log, i) => (
                <div className="activity-row activity-row--modal" key={log.id}>
                  <div
                    className="activity-icon-bubble"
                    style={{
                      background: (ACTION_META[log.actionType] || ACTION_META.UPDATE).bg,
                      border: `1px solid ${(ACTION_META[log.actionType] || ACTION_META.UPDATE).color}20`,
                    }}
                  >
                    <i
                      className={(ACTION_META[log.actionType] || ACTION_META.UPDATE).icon}
                      style={{ color: (ACTION_META[log.actionType] || ACTION_META.UPDATE).color, fontSize: '0.75rem' }}
                    />
                  </div>

                  <div className="activity-body" style={{ flex: 1 }}>
                    <p className="activity-summary">
                      <span className={`action-badge action-badge--${log.actionType?.toLowerCase()}`}>
                        {(ACTION_META[log.actionType] || ACTION_META.UPDATE).label}
                      </span>
                      <span className="activity-resource">{humanResourceType(log.resourceType)}</span>
                      {log.resourceId && (
                        <span className="activity-id" title={log.resourceId}>{log.resourceId.slice(0, 8)}…</span>
                      )}
                    </p>
                    <p className="activity-meta">
                      <span className="activity-uid" title={log.adminUid}>UID: {log.adminUid?.slice(0, 10)}…</span>
                      <span className="activity-dot">·</span>
                      <span>{log.adminEmail}</span>
                      <span className="activity-dot">·</span>
                      <span>{log.method} {log.path}</span>
                    </p>
                  </div>

                  <div className="activity-row-right">
                    <span className="activity-status-code">{log.statusCode}</span>
                    <span className="activity-timestamp" title={log.timestamp}>
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={modalPage}
            totalItems={filteredModalLogs.length}
            pageSize={modalPageSize}
            onPageChange={setModalPage}
            onPageSizeChange={setModalPageSize}
          />
        </div>
      </ModalWrapper>
    </div>
  );
}