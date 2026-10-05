import React, { useState, useEffect, useCallback } from 'react';
import { fetchOperatorActivityLogs } from '../../../services/adminService';
import OperatorLogsModal, { renderFormattedDescription } from './OperatorLogsModal';
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
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return String(ts);
  }
}

export default function OperatorActivityLogSection({ operatorId, operatorName, userToken }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const loadRecentLogs = useCallback(() => {
    if (!operatorId || !userToken) return;

    // Strict requirement: load only the first 5 upon page load to minimize Firestore reads
    fetchOperatorActivityLogs(
      userToken,
      operatorId,
      { limit: 5, onlyActive: true },
      (res) => {
        setLogs(res?.logs || []);
        setHasMore(Boolean(res?.hasMore));
        setError('');
      },
      (err) => {
        setError(err?.message || 'Unable to retrieve recent actions.');
      },
      setLoading
    );
  }, [operatorId, userToken]);

  useEffect(() => {
    loadRecentLogs();
  }, [loadRecentLogs]);

  return (
    <article className="card detail-panel operator-activity-section">
      <div className="operator-activity-header">
        <div className="operator-activity-title-group">
          <h3 className="operator-activity-title">
            <i className="fa-solid fa-clock-rotate-left" style={{ color: 'var(--purple, #5558e3)' }}></i>
            Recent Operator Actions
          </h3>
          <p className="operator-activity-subtitle">
            5 most recent business mutations performed by this branch operator
          </p>
        </div>

        <div className="operator-activity-actions">
          <span className="retention-badge" title="Records older than 90 days are archived">
            <i className="fa-solid fa-clock"></i>
            90d Retention
          </span>

          <button
            type="button"
            className="view-all-logs-btn"
            onClick={() => setIsModalOpen(true)}
            aria-label="View more activity logs"
          >
            <span>View More</span>
            <i className="fa-solid fa-arrow-up-right-from-square"></i>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.65rem 0.85rem', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', fontSize: '0.8125rem' }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '0.35rem' }}></i>
          {error}
        </div>
      )}

      {loading ? (
        <div className="operator-activity-loading">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="operator-activity-skeleton"></div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="operator-activity-empty">
          <i className="fa-regular fa-clipboard"></i>
          <strong>No actions logged yet</strong>
          <p>This operator has not performed any recorded quotations, inquiries, active service step completions, or payment verifications.</p>
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

      {/* View More Full History Modal */}
      <OperatorLogsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        operatorId={operatorId}
        operatorName={operatorName}
        userToken={userToken}
      />
    </article>
  );
}
