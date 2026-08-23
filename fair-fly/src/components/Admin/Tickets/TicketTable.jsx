import React, { useMemo } from 'react';
import DataTable from '../../UI/DataTable/DataTable';
import './tickets.css';

export default function TicketTable({
  tickets = [],
  loading = false,
  onViewThread,
  onStatusChange,
  onCloseTicket,
  disabled = false,
}) {

  // Columns definition for DataTable
  const columns = useMemo(
    () => [
      {
        key: 'title',
        header: 'Ticket Title / Subject',
        className: 'ticket-title-col',
        render: (ticket) => (
          <div className="ticket-title-info">
            <span className="ticket-op-name">{ticket.title || 'Untitled Support Request'}</span>
            <span className="ticket-col-id">ID: {ticket.id ? ticket.id.slice(0, 10) : 'N/A'}</span>
          </div>
        ),
      },
      {
        key: 'operatorId',
        header: 'Branch Operator',
        className: 'ticket-op-col',
        render: (ticket) => {
          const name = ticket.operatorName || 'Operator Branch';
          const initials = name
            .split(' ')
            .filter(Boolean)
            .map((w) => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'OP';

          const uid = ticket.operatorId || 'N/A';
          const shortUid = uid.length > 14 ? `${uid.slice(0, 10)}...` : uid;

          return (
            <div className="ticket-op-info">
              <div className="ticket-op-avatar">{initials}</div>
              <div className="ticket-op-details">
                <span className="ticket-op-name">{name}</span>
                <span className="ticket-op-uid-pill" title={`Firestore Operator UID: ${uid}`}>
                  <i className="fa-solid fa-id-badge"></i> UID: {shortUid}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        key: 'category',
        header: 'Category',
        render: (ticket) => (
          <span className="ticket-category-pill">{ticket.category || 'General'}</span>
        ),
      },
      {
        key: 'priority',
        header: 'Priority',
        render: (ticket) => {
          const priority = (ticket.priority || 'Medium').toLowerCase();
          return (
            <span className={`ticket-priority-pill ${priority}`}>
              {ticket.priority || 'Medium'}
            </span>
          );
        },
      },
      {
        key: 'status',
        header: 'Status',
        render: (ticket) => {
          const status = (ticket.status || 'Pending').toLowerCase();
          let icon = 'fa-solid fa-clock';
          if (status === 'ongoing') icon = 'fa-solid fa-spinner fa-spin';
          if (status === 'closed') icon = 'fa-solid fa-circle-check';

          return (
            <span className={`ticket-status-badge ${status}`}>
              <i className={icon}></i>
              {ticket.status || 'Pending'}
            </span>
          );
        },
      },
      {
        key: 'updatedAt',
        header: 'Last Activity',
        render: (ticket) => {
          const dateStr = ticket.updatedAt || ticket.createdAt;
          if (!dateStr) return 'N/A';
          const date = new Date(dateStr);
          return (
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              {isNaN(date.getTime()) ? dateStr : date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          );
        },
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (ticket) => {
          const isClosed = (ticket.status || '').toLowerCase() === 'closed';
          return (
            <div className="ticket-actions">
              <button
                type="button"
                className="ticket-action-btn view-thread-btn"
                onClick={() => onViewThread && onViewThread(ticket)}
                title="Open Forum Support Thread"
              >
                <i className="fa-solid fa-comments"></i>
                <span>View Thread</span>
              </button>

              {!isClosed && onCloseTicket && (
                <button
                  type="button"
                  className="ticket-action-btn close-btn"
                  onClick={() => onCloseTicket(ticket.id)}
                  disabled={disabled}
                  title="Close Forum Thread"
                >
                  <i className="fa-solid fa-lock"></i>
                  <span>Close</span>
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [onViewThread, onCloseTicket, disabled]
  );

  return (
    <DataTable
      columns={columns}
      data={tickets}
      keyField="id"
      disabled={disabled || loading}
      emptyState={{
        icon: 'fa-solid fa-ticket-simple',
        message: 'No support tickets match your search & status filter.',
      }}
    />
  );
}
