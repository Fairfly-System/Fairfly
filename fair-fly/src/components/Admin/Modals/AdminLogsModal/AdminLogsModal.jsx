import React, { useState, useMemo } from 'react';
import FilterChipGroup from '../../../UI/FilterChipGroup/FilterChipGroup';
import BaseModal from '../../../UI/ModalBase/BaseModal';
import Pagination from '../../../UI/Pagination/Pagination';
import {
  ACTION_META,
  humanResourceType,
} from '../../../../pages/Admin/AdminDashboard/dashboardUtils';

export default function AdminLogsModal({
  isOpen,
  onClose,
  allLogs = [],
  allLogsLoading = false,
  onExportLogs,
}) {
  const [modalSearch, setModalSearch] = useState('');
  const [modalActionFilter, setModalActionFilter] = useState('all');
  const [modalPage, setModalPage] = useState(1);
  const [modalPageSize, setModalPageSize] = useState(10);

  const handleClose = () => {
    setModalSearch('');
    setModalActionFilter('all');
    setModalPage(1);
    if (onClose) onClose();
  };

  // ── Filtered + Paginated logs ─────────────────────────────────────────────
  const filteredModalLogs = useMemo(() => {
    return allLogs.filter((log) => {
      const matchesSearch =
        modalSearch === '' ||
        (log.adminEmail || '').toLowerCase().includes(modalSearch.toLowerCase()) ||
        (log.resourceType || '').toLowerCase().includes(modalSearch.toLowerCase()) ||
        (log.path || '').toLowerCase().includes(modalSearch.toLowerCase()) ||
        (log.adminUid || '').toLowerCase().includes(modalSearch.toLowerCase());

      const matchesAction =
        modalActionFilter === 'all' || log.actionType === modalActionFilter;

      return matchesSearch && matchesAction;
    });
  }, [allLogs, modalSearch, modalActionFilter]);

  const paginatedModalLogs = useMemo(() => {
    const start = (modalPage - 1) * modalPageSize;
    return filteredModalLogs.slice(start, start + modalPageSize);
  }, [filteredModalLogs, modalPage, modalPageSize]);

  const handleExport = () => {
    if (onExportLogs) {
      onExportLogs(filteredModalLogs);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="750px"
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
              onChange={(e) => {
                setModalSearch(e.target.value);
                setModalPage(1);
              }}
            />
            {modalSearch && (
              <button
                className="clear-search-btn"
                onClick={() => {
                  setModalSearch('');
                  setModalPage(1);
                }}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>

          <FilterChipGroup
            chips={['all', 'CREATE', 'UPDATE', 'DELETE'].map((f) => ({
              value: f,
              label: f === 'all' ? `All (${allLogs.length})` : f,
            }))}
            activeChip={modalActionFilter}
            onChipChange={(val) => {
              setModalActionFilter(val);
              setModalPage(1);
            }}
          />

          <button
            className="activity-export-btn"
            onClick={handleExport}
            title="Export filtered logs"
          >
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
            paginatedModalLogs.map((log) => {
              const meta = ACTION_META[log.actionType] || ACTION_META.UPDATE;
              return (
                <div className="activity-row activity-row--modal" key={log.id}>
                  <div
                    className="activity-icon-bubble"
                    style={{
                      background: meta.bg,
                      border: `1px solid ${meta.color}20`,
                    }}
                  >
                    <i
                      className={meta.icon}
                      style={{ color: meta.color, fontSize: '0.75rem' }}
                    />
                  </div>

                  <div className="activity-body" style={{ flex: 1 }}>
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
                      <span className="activity-uid" title={log.adminUid}>
                        UID: {log.adminUid?.slice(0, 10)}…
                      </span>
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
              );
            })
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
    </BaseModal>
  );
}
