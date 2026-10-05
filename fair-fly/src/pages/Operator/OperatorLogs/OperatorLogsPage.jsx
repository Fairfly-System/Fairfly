import { useState, useEffect, useCallback, useMemo } from 'react';
import Breadcrumbs from '../../../components/UI/Breadcrumbs/Breadcrumbs';
import PageHeader from '../../../components/UI/PageHeader/PageHeader';
import FilterChipGroup from '../../../components/UI/FilterChipGroup/FilterChipGroup';
import { useAuthContext } from '../../../context/AuthContext';
import { fetchOperatorActivityLogs } from '../../../services/adminService';
import { renderFormattedDescription } from '../../../components/Admin/OperatorActivityLogs/OperatorLogsModal';
import '../../../components/Admin/OperatorActivityLogs/operator-activity-logs.css';
import './operator-logs-page.css';

function getActionMeta(action) {
  const code = (action || '').toUpperCase();
  if (code.includes('QUOTATION')) {
    return {
      icon: 'fa-solid fa-file-invoice-dollar',
      accent: '#7c3aed',
      tagBg: '#ede9fe',
      tagColor: '#6d28d9',
      tagBorder: '#ddd6fe',
      label: 'Quotation',
      category: 'quotations'
    };
  }
  if (code.includes('INQUIRY')) {
    return {
      icon: 'fa-solid fa-clipboard-question',
      accent: '#0284c7',
      tagBg: '#e0f2fe',
      tagColor: '#0369a1',
      tagBorder: '#bae6fd',
      label: 'Inquiry',
      category: 'inquiries'
    };
  }
  if (code.includes('ACTIVE_SERVICE') || code.includes('STEP')) {
    return {
      icon: 'fa-solid fa-briefcase',
      accent: '#059669',
      tagBg: '#ecfdf5',
      tagColor: '#047857',
      tagBorder: '#a7f3d0',
      label: 'Service Order',
      category: 'services'
    };
  }
  if (code.includes('PAYMENT')) {
    return {
      icon: 'fa-solid fa-credit-card',
      accent: '#d97706',
      tagBg: '#fef3c7',
      tagColor: '#b45309',
      tagBorder: '#fde68a',
      label: 'Payment',
      category: 'payments'
    };
  }
  if (code.includes('APPOINTMENT')) {
    return {
      icon: 'fa-solid fa-calendar-check',
      accent: '#0d9488',
      tagBg: '#ccfbf1',
      tagColor: '#0f766e',
      tagBorder: '#99f6e4',
      label: 'Appointment',
      category: 'appointments'
    };
  }
  return {
    icon: 'fa-solid fa-clock-rotate-left',
    accent: '#5558e3',
    tagBg: '#eef2ff',
    tagColor: '#4338ca',
    tagBorder: '#c7d2fe',
    label: 'Activity',
    category: 'general'
  };
}

function formatLogTimestamp(ts) {
  if (!ts) return 'Recent';
  try {
    const d = new Date(ts);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return String(ts);
  }
}

export default function OperatorLogsPage() {
  const { userToken } = useAuthContext();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [pageIndex, setPageIndex] = useState(0);
  const [cursors, setCursors] = useState([null]);
  const [hasMore, setHasMore] = useState(false);
  const PAGE_SIZE = 10;

  const breadcrumbItems = [
    { label: 'Dashboard', to: '/operator' },
    { label: 'Activity Logs' },
  ];

  const loadLogs = useCallback((cursorId) => {
    if (!userToken) return;

    fetchOperatorActivityLogs(
      userToken,
      'me',
      {
        limit: PAGE_SIZE,
        startAfterId: cursorId || undefined,
        onlyActive: true
      },
      (res) => {
        setLogs(res?.logs || []);
        setHasMore(Boolean(res?.hasMore));
        setError('');
      },
      (err) => {
        setError(err?.message || 'Unable to load operator activity logs.');
      },
      setLoading
    );
  }, [userToken]);

  useEffect(() => {
    loadLogs(null);
  }, [loadLogs]);

  const handleNextPage = () => {
    if (!hasMore || loading) return;
    const lastDoc = logs[logs.length - 1];
    if (!lastDoc?.id) return;

    const nextPageIndex = pageIndex + 1;
    const nextCursors = [...cursors];
    nextCursors[nextPageIndex] = lastDoc.id;
    setCursors(nextCursors);
    setPageIndex(nextPageIndex);
    loadLogs(lastDoc.id);
  };

  const handlePrevPage = () => {
    if (pageIndex <= 0 || loading) return;
    const prevPageIndex = pageIndex - 1;
    setPageIndex(prevPageIndex);
    loadLogs(cursors[prevPageIndex]);
  };

  // Client-side category and text filtering for the loaded page items
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const meta = getActionMeta(log.action);
      if (categoryFilter !== 'all' && meta.category !== categoryFilter) {
        return false;
      }
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const descMatch = (log.description || '').toLowerCase().includes(query);
        const idMatch = (log.id || '').toLowerCase().includes(query);
        const entityMatch = (log.entityId || '').toLowerCase().includes(query);
        const branchMatch = (log.branchName || '').toLowerCase().includes(query);
        return descMatch || idMatch || entityMatch || branchMatch;
      }
      return true;
    });
  }, [logs, categoryFilter, searchTerm]);

  return (
    <main className="operator-logs-page page-fade-in">
      <Breadcrumbs items={breadcrumbItems} />

      <PageHeader
        title="Operator Activity Logs"
        subtitle="Auditable trail of actions you have performed across quotations, inquiries, service fulfillments, and payments"
        illustrationSrc="/pageImages/operator/history.png"
      />

      <section className="card op-logs-card">
        {/* Retention policy banner */}
        <div className="op-logs-retention-banner">
          <div className="op-logs-retention-left">
            <i className="fa-solid fa-shield-halved text-purple"></i>
            <div>
              <strong>90-Day Operational Retention Active</strong>
              <p>Active logs are retained for auditing. Queries are bounded using Firestore cursors to prevent high document reads.</p>
            </div>
          </div>
          <span className="retention-badge">
            <i className="fa-solid fa-database"></i>
            operator-logs
          </span>
        </div>

        {/* Toolbar */}
        <div className="table-toolbar" style={{ marginTop: '1rem' }}>
          <div className="search-box">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              placeholder="Search by action, entity ID, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchTerm('')}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>

          <FilterChipGroup
            chips={[
              { value: 'all', label: 'All Activities' },
              { value: 'quotations', label: 'Quotations' },
              { value: 'inquiries', label: 'Inquiries' },
              { value: 'services', label: 'Services' },
              { value: 'payments', label: 'Payments' },
              { value: 'appointments', label: 'Appointments' },
            ]}
            activeChip={categoryFilter}
            onChipChange={setCategoryFilter}
          />
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', fontSize: '0.8125rem', marginTop: '1rem' }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '0.4rem' }}></i>
            {error}
          </div>
        )}

        {/* Logs List */}
        <div style={{ marginTop: '1.25rem' }}>
          {loading ? (
            <div className="operator-activity-loading">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="operator-activity-skeleton"></div>
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="operator-activity-empty">
              <i className="fa-regular fa-folder-open"></i>
              <strong>No activity records found</strong>
              <p>No logged actions match the selected filter or search terms.</p>
            </div>
          ) : (
            <div className="operator-activity-list">
              {filteredLogs.map((log) => {
                const meta = getActionMeta(log.action);
                return (
                  <div
                    key={log.id}
                    className="operator-log-card"
                    style={{
                      '--log-accent': meta.accent,
                      '--tag-bg': meta.tagBg,
                      '--tag-color': meta.tagColor,
                      '--tag-border': meta.tagBorder
                    }}
                  >
                    <div className="operator-log-icon-box">
                      <i className={meta.icon}></i>
                    </div>

                    <div className="operator-log-body">
                      <div className="operator-log-top-row">
                        <span className="operator-log-action-tag">
                          {meta.label}
                        </span>
                        <span className="operator-log-time">
                          <i className="fa-regular fa-clock" style={{ marginRight: '0.25rem' }}></i>
                          {formatLogTimestamp(log.timestamp)}
                        </span>
                      </div>

                      <div className="operator-log-description">
                        {renderFormattedDescription(log.description)}
                      </div>

                      <div className="operator-log-footer">
                        <span>
                          <i className="fa-solid fa-location-dot"></i>
                          {log.branchName || 'Branch'}
                        </span>
                        <span>
                          <i className="fa-regular fa-envelope"></i>
                          {log.operatorEmail || 'Operator'}
                        </span>
                        <span style={{ marginLeft: 'auto', fontFamily: 'monospace', color: '#94a3b8' }}>
                          {log.id}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {!loading && logs.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 0 0.5rem 0',
              borderTop: '1px solid var(--border-color, #e2e8f0)',
              marginTop: '1.25rem'
            }}
          >
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-mid, #475569)', fontWeight: 600 }}>
              Page {pageIndex + 1}
            </span>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="operator-logs-nav-btn"
                onClick={handlePrevPage}
                disabled={pageIndex === 0 || loading}
              >
                <i className="fa-solid fa-chevron-left"></i> Previous
              </button>
              <button
                type="button"
                className="operator-logs-nav-btn"
                onClick={handleNextPage}
                disabled={!hasMore || loading}
              >
                Next <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
