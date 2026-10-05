import React, { useState, useEffect, useCallback } from 'react';
import { fetchOperatorActivityLogs } from '../../../services/adminService';
import './operator-activity-logs.css';

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

/**
 * Highlights entity codes (e.g. QT-2026-1234, INQ-123, PAY-123, OPL-123) with monospace tags
 */
export function renderFormattedDescription(description) {
  if (!description) return null;
  // Match common FairFly entity patterns: QT-..., INQ-..., PAY-..., ASV-..., etc.
  const regex = /([A-Z]{2,4}-\d{4,}[A-Za-z0-9-]*|\b\d{2}-\d{3,}\b|₱[\d,]+(?:\.\d{2})?)/g;
  const parts = description.split(regex);

  return parts.map((part, i) => {
    if (regex.test(part)) {
      return (
        <span key={i} className="operator-log-entity-tag">
          {part}
        </span>
      );
    }
    return part;
  });
}

export default function OperatorLogsModal({ isOpen, onClose, operatorId, operatorName, userToken }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [cursors, setCursors] = useState([null]); // cursors[0] = null, cursors[1] = docId after page 0, etc.
  const [hasMore, setHasMore] = useState(false);
  const PAGE_SIZE = 8;

  const loadLogsForPage = useCallback((cursorId) => {
    if (!operatorId || !userToken) return;

    fetchOperatorActivityLogs(
      userToken,
      operatorId,
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
        setError(err?.message || 'Failed to retrieve operator activity history.');
      },
      setLoading
    );
  }, [operatorId, userToken]);

  useEffect(() => {
    if (isOpen) {
      setPageIndex(0);
      setCursors([null]);
      loadLogsForPage(null);
    }
  }, [isOpen, loadLogsForPage]);

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

  if (!isOpen) return null;

  return (
    <div className="operator-logs-modal-overlay" onClick={onClose}>
      <div className="operator-logs-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="operator-logs-modal-header">
          <div className="operator-logs-modal-header-title">
            <h3>
              <i className="fa-solid fa-list-check" style={{ color: 'var(--purple, #5558e3)' }}></i>
              Operator Activity History
            </h3>
            <p>
              Auditable operational log trail for <strong>{operatorName || operatorId}</strong>
            </p>
          </div>
          <button
            type="button"
            className="operator-logs-modal-close-btn"
            onClick={onClose}
            aria-label="Close activity history"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Retention & Scope Bar */}
        <div className="operator-logs-modal-retention-info">
          <span>
            <i className="fa-solid fa-shield-halved text-purple" style={{ marginRight: '0.4rem' }}></i>
            90-Day Retention Policy: Active records are retained for auditing. Archived records are pruned.
          </span>
          <span className="retention-badge">
            <i className="fa-solid fa-database"></i>
            Collection: operator-logs
          </span>
        </div>

        {/* Modal Body */}
        <div className="operator-logs-modal-body">
          {error && (
            <div style={{ padding: '0.75rem 1rem', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', fontSize: '0.8125rem' }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '0.4rem' }}></i>
              {error}
            </div>
          )}

          {loading ? (
            <div className="operator-activity-loading">
              {[...Array(PAGE_SIZE)].map((_, i) => (
                <div key={i} className="operator-activity-skeleton"></div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="operator-activity-empty">
              <i className="fa-regular fa-folder-open"></i>
              <strong>No activity records found</strong>
              <p>This operator has not recorded any logged operational actions within the retention period.</p>
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
                          <i className="fa-regular fa-clock" style={{ marginRight: '0.3rem' }}></i>
                          {formatLogTimestamp(log.timestamp)}
                        </span>
                      </div>

                      <div className="operator-log-description">
                        {renderFormattedDescription(log.description)}
                      </div>

                      <div className="operator-log-footer">
                        <span>
                          <i className="fa-solid fa-location-dot"></i>
                          {log.branchName || 'Branch Office'}
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

        {/* Modal Footer with Cursor Pagination */}
        <div className="operator-logs-modal-footer">
          <div className="operator-logs-page-indicator">
            Page {pageIndex + 1}
          </div>

          <div className="operator-logs-pagination-controls">
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
      </div>
    </div>
  );
}
