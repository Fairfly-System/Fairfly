import React from 'react';
import './data-table.css';

/**
 * Reusable DataTable component supporting columns, custom rendering,
 * row selection, bulk actions (Enable, Disable, Delete), and empty states.
 *
 * @param {Object[]} columns - Array of column configs: { key, header, render, className, headerClassName }
 * @param {Object[]} data - Array of row objects to render
 * @param {string} [keyField='id'] - Unique ID property of each row object
 * @param {boolean} [selectable=false] - Whether to render checkboxes and enable row selection
 * @param {Array} [selectedIds=[]] - Controlled array of selected item keyField values
 * @param {Function} [onSelectionChange] - Callback when selection changes: (newSelectedIds) => void
 * @param {Function} [onBulkDelete] - Callback when Bulk Delete action is clicked: (selectedIds) => void
 * @param {Function} [onBulkEnable] - Callback when Bulk Enable action is clicked: (selectedIds) => void
 * @param {Function} [onBulkDisable] - Callback when Bulk Disable action is clicked: (selectedIds) => void
 * @param {Array} [bulkActions=[]] - Custom bulk actions array: [{ label, icon, variant, onClick: (selectedIds) => void }]
 * @param {ReactNode|Object} [emptyState] - Custom empty state node or config: { icon, message }
 * @param {string} [className=''] - Custom container class
 * @param {Function|string} [rowClassName] - Custom row class generator or string
 * @param {boolean} [disabled=false] - Whether controls should be disabled during loading/submitting
 */
export default function DataTable({
  columns = [],
  data = [],
  keyField = 'id',
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  onBulkDelete,
  onBulkEnable,
  onBulkDisable,
  bulkActions = [],
  emptyState = null,
  className = '',
  rowClassName,
  disabled = false,
}) {
  const selectedSet = new Set(selectedIds);
  const hasSelection = selectedIds.length > 0;

  const allSelected =
    data.length > 0 && data.every((row) => selectedSet.has(row[keyField]));

  const isIndeterminate =
    data.some((row) => selectedSet.has(row[keyField])) && !allSelected;

  const handleSelectAll = (e) => {
    if (!onSelectionChange || disabled) return;
    if (e.target.checked) {
      const allPageIds = data.map((row) => row[keyField]);
      const newSelected = Array.from(new Set([...selectedIds, ...allPageIds]));
      onSelectionChange(newSelected);
    } else {
      const pageIdSet = new Set(data.map((row) => row[keyField]));
      const newSelected = selectedIds.filter((id) => !pageIdSet.has(id));
      onSelectionChange(newSelected);
    }
  };

  const handleSelectRow = (id) => {
    if (!onSelectionChange || disabled) return;
    if (selectedSet.has(id)) {
      onSelectionChange(selectedIds.filter((item) => item !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleClearSelection = () => {
    if (onSelectionChange && !disabled) {
      onSelectionChange([]);
    }
  };

  const totalCols = columns.length + (selectable ? 1 : 0);

  const renderEmptyState = () => {
    if (React.isValidElement(emptyState)) {
      return emptyState;
    }
    const iconClass = emptyState?.icon || 'fa-solid fa-folder-open';
    const messageText = emptyState?.message || 'No records found';

    return (
      <td colSpan={totalCols} className="empty-table-cell">
        <i className={`${iconClass} empty-icon`}></i>
        <p>{messageText}</p>
      </td>
    );
  };

  return (
    <div className={`data-table-container ${className}`}>
      {/* Permanent Bulk Action Bar (Prevents Layout Shift) */}
      {selectable && (
        <div
          className={`table-bulk-bar ${
            hasSelection ? 'table-bulk-bar-active' : 'table-bulk-bar-neutral'
          }`}
        >
          <div className="bulk-bar-info">
            <span
              className={`bulk-count-badge ${
                hasSelection ? 'count-badge-active' : 'count-badge-neutral'
              }`}
            >
              {selectedIds.length}
            </span>
            <span className="bulk-text">
              {selectedIds.length === 0
                ? '0 selected items'
                : `${selectedIds.length} ${
                    selectedIds.length === 1 ? 'item' : 'items'
                  } selected`}
            </span>
          </div>

          <div className="bulk-bar-actions">
            {onBulkEnable && (
              <button
                type="button"
                className="bulk-btn bulk-btn-enable"
                onClick={() => !disabled && hasSelection && onBulkEnable(selectedIds)}
                disabled={disabled || !hasSelection}
                title={hasSelection ? 'Enable Selected' : 'Select items to enable'}
              >
                <i className="fa-solid fa-circle-check"></i>
                <span>Enable</span>
              </button>
            )}

            {onBulkDisable && (
              <button
                type="button"
                className="bulk-btn bulk-btn-disable"
                onClick={() => !disabled && hasSelection && onBulkDisable(selectedIds)}
                disabled={disabled || !hasSelection}
                title={hasSelection ? 'Disable Selected' : 'Select items to disable'}
              >
                <i className="fa-solid fa-ban"></i>
                <span>Disable</span>
              </button>
            )}

            {onBulkDelete && (
              <button
                type="button"
                className="bulk-btn bulk-btn-delete"
                onClick={() => !disabled && hasSelection && onBulkDelete(selectedIds)}
                disabled={disabled || !hasSelection}
                title={hasSelection ? 'Delete Selected' : 'Select items to delete'}
              >
                <i className="fa-solid fa-trash"></i>
                <span>Delete</span>
              </button>
            )}

            {bulkActions.map((action, idx) => (
              <button
                key={idx}
                type="button"
                className={`bulk-btn bulk-btn-${action.variant || 'default'}`}
                onClick={() => !disabled && hasSelection && action.onClick(selectedIds)}
                disabled={disabled || !hasSelection}
              >
                {action.icon && <i className={action.icon}></i>}
                <span>{action.label}</span>
              </button>
            ))}

            {hasSelection && (
              <button
                type="button"
                className="bulk-btn bulk-btn-clear"
                onClick={handleClearSelection}
                disabled={disabled}
                title="Clear selection"
              >
                <i className="fa-solid fa-xmark"></i>
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Table Responsive Wrapper */}
      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              {selectable && (
                <th className="select-col">
                  <label className="data-table-checkbox">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      disabled={disabled}
                      ref={(input) => {
                        if (input) input.indeterminate = isIndeterminate;
                      }}
                      onChange={handleSelectAll}
                      aria-label="Select all rows"
                    />
                  </label>
                </th>
              )}

              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  className={`${col.headerClassName || ''} ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>{renderEmptyState()}</tr>
            ) : (
              data.map((row, rowIndex) => {
                const rowId = row[keyField];
                const isSelected = selectedSet.has(rowId);
                const extraRowClass =
                  typeof rowClassName === 'function'
                    ? rowClassName(row, rowIndex)
                    : rowClassName || '';

                return (
                  <tr
                    key={rowId || rowIndex}
                    className={`${isSelected ? 'table-row-selected' : ''} ${extraRowClass}`}
                  >
                    {selectable && (
                      <td className="select-col">
                        <label className="data-table-checkbox">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={disabled}
                            onChange={() => handleSelectRow(rowId)}
                            aria-label={`Select row ${rowId || rowIndex + 1}`}
                          />
                        </label>
                      </td>
                    )}

                    {columns.map((col, colIndex) => {
                      const cellValue = row[col.key];
                      const rendered =
                        typeof col.render === 'function'
                          ? col.render(row, rowIndex)
                          : cellValue;

                      return (
                        <td
                          key={col.key || colIndex}
                          className={col.className || ''}
                        >
                          {rendered}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
