import React, { useState, useEffect, useCallback } from 'react';
import { fetchOperatorActivityLogs } from '../../../services/adminService';
import { renderFormattedDescription } from '../../../components/Admin/OperatorActivityLogs/OperatorLogsModal';
import '../../../components/Admin/OperatorActivityLogs/operator-activity-logs.css';

function getActionMeta(action) {
  const code = (action || '').toUpperCase();
  if (code.includes('QUOTATION')) {
    return {
      icon: 'fa-solid fa-file-invoice-dollar',
      accent: '#7c3aed',
      tagBg: '#ede9fe',
      tagColor: '#6d28d9',
      tagBorder: '#ddd6fe',
      label: 'Quotation'
    };
  }
  if (code.includes('INQUIRY')) {
    return {
      icon: 'fa-solid fa-clipboard-question',
      accent: '#0284c7',
      tagBg: '#e0f2fe',
      tagColor: '#0369a1',
      tagBorder: '#bae6fd',
      label: 'Inquiry'
    };
  }
  if (code.includes('ACTIVE_SERVICE') || code.includes('STEP')) {
    return {
      icon: 'fa-solid fa-briefcase',
      accent: '#059669',
      tagBg: '#ecfdf5',
      tagColor: '#047857',
      tagBorder: '#a7f3d0',
      label: 'Service Order'
    };
  }
  if (code.includes('PAYMENT')) {
    return {
      icon: 'fa-solid fa-credit-card',
      accent: '#d97706',
      tagBg: '#fef3c7',
      tagColor: '#b45309',
      tagBorder: '#fde68a',
      label: 'Payment'
    };
  }
  if (code.includes('APPOINTMENT')) {
    return {
      icon: 'fa-solid fa-calendar-check',
      accent: '#0d9488',
      tagBg: '#ccfbf1',
      tagColor: '#0f766e',
      tagBorder: '#99f6e4',
      label: 'Appointment'
    };
  }
  return {
    icon: 'fa-solid fa-clock-rotate-left',
    accent: '#5558e3',
    tagBg: '#eef2ff',
    tagColor: '#4338ca',
    tagBorder: '#c7d2fe',
    label: 'Activity'
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

export default function OperatorActivityLogsTab({ userToken }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [cursors, setCursors] = useState([null]);
  const [hasMore, setHasMore] = useState(false);
  const PAGE_SIZE = 8;

  const loadLogsForPage = useCallback((cursorId) => {
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
        setError(err?.message || 'Unable to load activity logs.');
      },
      setLoading
    );
  }, [userToken]);

  useEffect(() => {
    loadLogsForPage(null);
  }, [loadLogsForPage]);

  const handleNextPage = () => {
    if (!hasMore || loading) return;
    const lastDoc = logs[logs.length - 1];
    if (!lastDoc?.id) return;

    const nextPageIndex = pageIndex + 1;
    const nextCursors = [...cursors];
    nextCursors[nextPageIndex] = lastDoc.id;
    setCursors(nextCursors);
    setPageIndex(nextPageIndex);
    loadLogsForPage(lastDoc.id);
  };

  const handlePrevPage = () => {
    if (pageIndex <= 0 || loading) return;
    const prevPageIndex = pageIndex - 1;
    setPageIndex(prevPageIndex);
    loadLogsForPage(cursors[prevPageIndex]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
      {/* Retention Alert & Scope Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          background: 'var(--bg-muted, #f8fafc)',
          border: '1px solid var(--border-color, #e2e8f0)',
          fontSize: '0.8125rem',
          color: 'var(--text-mid, #475569)'
        }}
      >
        <span>
          <i className="fa-solid fa-clock-rotate-left text-purple" style={{ marginRight: '0.4rem' }}></i>
          Showing your recorded operational actions. Active retention window: <strong>90 Days</strong>.
        </span>

        <span className="retention-badge">
          <i className="fa-solid fa-shield-halved"></i>
          Audit Trail Active
        </span>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', fontSize: '0.8125rem' }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '0.4rem' }}></i>
          {error}
        </div>
      )}

      {loading ? (
        <div className="operator-activity-loading">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="operator-activity-skeleton"></div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="operator-activity-empty">
          <i className="fa-regular fa-clipboard"></i>
          <strong>No activity history recorded</strong>
          <p>Your quotations, inquiries, workflow step updates, and payment verifications will appear here in chronological order.</p>
        </div>
      ) : (
        <div className="operator-activity-list">
          {logs.map((log) => {
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
                      <i className="fa-regular fa-id-card"></i>
                      Log ID: {log.id}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {!loading && logs.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 0',
            borderTop: '1px solid var(--border-color, #e2e8f0)',
            marginTop: '0.5rem'
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
    </div>
  );
}
