import React, { useState, useCallback } from 'react';
import FilterChipGroup from '../../../UI/FilterChipGroup/FilterChipGroup';
import BaseModal from '../../../UI/ModalBase/BaseModal';
import Pagination from '../../../UI/Pagination/Pagination';
import useFirestorePagination from '../../../../hooks/useFirestorePagination';
import useDebounce from '../../../../hooks/useDebounce';
import {
  ACTION_META,
  humanResourceType,
} from '../../../../pages/Admin/AdminDashboard/dashboardUtils';

export default function AdminLogsModal({
  isOpen,
  onClose,
  onExportLogs,
}) {
  const [modalSearch, setModalSearch] = useState('');
  const [modalActionFilter, setModalActionFilter] = useState('all');
  const debouncedSearch = useDebounce(modalSearch, 300);

  const searchFilterFn = useCallback(
    (log) => {
      if (!debouncedSearch) return true;
      const term = debouncedSearch.toLowerCase().trim();
      return (
        (log.adminEmail || '').toLowerCase().includes(term) ||
        (log.resourceType || '').toLowerCase().includes(term) ||
        (log.path || '').toLowerCase().includes(term) ||
        (log.adminUid || '').toLowerCase().includes(term) ||
        (log.resourceId || '').toLowerCase().includes(term)
      );
    },
    [debouncedSearch]
  );

  const customFilterFn = useCallback(
    (log) => {
      if (modalActionFilter === 'all') return true;
      return log.actionType === modalActionFilter;
    },
    [modalActionFilter]
  );

  const {
    data: logs,
    loading: logsLoading,
    currentPage,
    pageSize,
    totalItems,
    unfilteredTotal,
    goToPage,
    changePageSize,
  } = useFirestorePagination({
    collectionName: 'admin-logs',
    filterKey: modalActionFilter,
    orderByField: 'timestamp',
    orderDirection: 'desc',
    initialPageSize: 10,
    enabled: isOpen,
    realtime: true,
    searchTerm: debouncedSearch,
    searchFilterFn,
    customFilterFn: modalActionFilter !== 'all' ? customFilterFn : null,
  });

  const handleClose = () => {
    setModalSearch('');
    setModalActionFilter('all');
    goToPage(1);
    if (onClose) onClose();
  };

  const handleExport = () => {
    if (onExportLogs) {
      onExportLogs(logs);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="72rem"
      width="95%"
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
                goToPage(1);
              }}
            />
            {modalSearch && (
              <button
                className="clear-search-btn"
                onClick={() => {
                  setModalSearch('');
                  goToPage(1);
                }}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>

          <FilterChipGroup
            chips={[
              { value: 'all', label: 'All', count: unfilteredTotal || totalItems },
              { value: 'CREATE', label: 'CREATE' },
              { value: 'UPDATE', label: 'UPDATE' },
              { value: 'DELETE', label: 'DELETE' },
            ]}
            activeChip={modalActionFilter}
            onChipChange={(val) => {
              setModalActionFilter(val);
              goToPage(1);
            }}
          />

          <button
            className="activity-export-btn"
            onClick={handleExport}
            title="Export logs"
          >
            <i className="fa-solid fa-file-export" />
            <span>Export</span>
          </button>
        </div>

        {/* Log rows */}
        <div className="logs-modal-list">
          {logsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', padding: '1rem 0' }} aria-busy="true">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.75rem 0' }}>
                  <div className="skeleton skeleton-circle" style={{ width: '2.25rem', height: '2.25rem' }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    <div className="skeleton skeleton-text" style={{ width: '60%', height: '0.875rem', margin: 0 }} />
                    <div className="skeleton skeleton-text" style={{ width: '30%', height: '0.75rem', margin: 0 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <p className="activity-empty">No logs match your search.</p>
          ) : (
            logs.map((log) => {
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
                          {log.resourceId.length > 14 ? `${log.resourceId.slice(0, 14)}…` : log.resourceId}
                        </span>
                      )}
                    </p>
                    <p className="activity-meta">
                      <span className="activity-uid" title={log.adminUid}>
                        UID: {log.adminUid?.length > 14 ? `${log.adminUid.slice(0, 14)}…` : log.adminUid}
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
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={goToPage}
          onPageSizeChange={changePageSize}
          pageSizeOptions={[5, 10, 20, 50]}
        />
      </div>
    </BaseModal>
  );
}
