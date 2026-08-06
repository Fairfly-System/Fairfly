import React, { useState } from 'react';
import './tickets.css';

export default function TicketThread({
  ticket,
  onBack,
  onSendMessage,
  onCloseForum,
  onStatusChange,
  isLoading = false,
}) {
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!ticket) {
    return (
      <div className="ticket-thread-container">
        <button className="back-to-table-btn" onClick={onBack}>
          <i className="fa-solid fa-arrow-left"></i> Back to Tickets
        </button>
        <div className="empty-state-box">
          <p>No ticket selected</p>
        </div>
      </div>
    );
  }

  const isClosed = (ticket.status || '').toLowerCase() === 'closed';

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || isSending || isLoading) return;

    try {
      setIsSending(true);
      await onSendMessage(ticket.id, replyText.trim());
      setReplyText('');
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = async () => {
    if (isLoading || isClosed) return;
    await onCloseForum(ticket.id);
  };

  const handleReopen = async () => {
    if (isLoading) return;
    await onStatusChange(ticket.id, 'Ongoing');
  };

  const messages = ticket.messages || [];

  return (
    <div className="ticket-thread-container page-fade-in">
      {/* Header Card */}
      <div className="thread-header-card">
        <div className="thread-nav-top">
          <button className="back-to-table-btn" onClick={onBack}>
            <i className="fa-solid fa-arrow-left"></i> Back to Tickets List
          </button>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {!isClosed ? (
              <button
                type="button"
                className="ticket-action-btn close-btn"
                onClick={handleClose}
                disabled={isLoading}
              >
                <i className="fa-solid fa-lock"></i> Close Forum Thread
              </button>
            ) : (
              <button
                type="button"
                className="ticket-action-btn"
                onClick={handleReopen}
                disabled={isLoading}
                style={{ borderColor: '#6366f1', color: '#4f46e5' }}
              >
                <i className="fa-solid fa-lock-open"></i> Re-open Forum
              </button>
            )}
          </div>
        </div>

        <div className="thread-header-main">
          <div className="thread-title-row">
            <div>
              <span className="ticket-col-id" style={{ display: 'block', marginBottom: '0.25rem' }}>
                TICKET ID: #{ticket.id}
              </span>
              <h3>{ticket.title || 'Support Thread'}</h3>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className={`ticket-status-badge ${(ticket.status || 'Pending').toLowerCase()}`}>
                <i className={isClosed ? 'fa-solid fa-circle-check' : 'fa-solid fa-clock'}></i>
                {ticket.status || 'Pending'}
              </span>
              <span className={`ticket-priority-pill ${(ticket.priority || 'Medium').toLowerCase()}`}>
                Priority: {ticket.priority || 'Medium'}
              </span>
              <span className="ticket-category-pill">{ticket.category || 'General'}</span>
            </div>
          </div>

          <div className="thread-meta-bar">
            <div className="thread-meta-item">
              <i className="fa-solid fa-user-gear"></i>
              <span>Operator ID: <strong>{ticket.operatorId || 'N/A'}</strong></span>
            </div>
            <div className="thread-meta-item">
              <i className="fa-solid fa-building"></i>
              <span>Name: <strong>{ticket.operatorName || 'Operator'}</strong></span>
            </div>
            <div className="thread-meta-item">
              <i className="fa-solid fa-envelope"></i>
              <span>Email: <strong>{ticket.operatorEmail || 'N/A'}</strong></span>
            </div>
            <div className="thread-meta-item">
              <i className="fa-solid fa-calendar-days"></i>
              <span>Created: <strong>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : 'N/A'}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Forum Discussion Posts */}
      <div className="forum-posts-list">
        {messages.length === 0 ? (
          <div className="forum-post-card op-post">
            <div className="forum-post-header">
              <div className="forum-author-info">
                <div className="forum-author-avatar operator">OP</div>
                <div className="forum-author-name">
                  {ticket.operatorName || 'Operator'}
                  <span className="role-badge operator">OPERATOR</span>
                </div>
              </div>
              <span className="forum-post-time">
                {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : 'Just now'}
              </span>
            </div>
            <div className="forum-post-body">
              {ticket.lastMessage || ticket.title}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOp = (msg.senderRole || '').toLowerCase() === 'operator';
            const roleClass = isOp ? 'operator' : 'admin';
            const roleLabel = isOp ? 'OPERATOR' : 'ADMIN';
            const initials = (msg.senderName || (isOp ? 'Op' : 'Ad'))
              .split(' ')
              .map((w) => w[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <div key={msg.id || index} className={`forum-post-card ${isOp ? 'op-post' : 'admin-post'}`}>
                <div className="forum-post-header">
                  <div className="forum-author-info">
                    <div className={`forum-author-avatar ${roleClass}`}>{initials}</div>
                    <div className="forum-author-name">
                      {msg.senderName || (isOp ? 'Operator' : 'Super Admin')}
                      <span className={`role-badge ${roleClass}`}>{roleLabel}</span>
                    </div>
                  </div>
                  <span className="forum-post-time">
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div className="forum-post-body">{msg.message}</div>
              </div>
            );
          })
        )}
      </div>

      {/* Forum Reply Box or Closed Forum Notice */}
      {!isClosed ? (
        <form onSubmit={handleSendReply} className="forum-reply-box">
          <div className="forum-reply-header">
            <i className="fa-solid fa-reply"></i>
            <span>Respond to Support Thread</span>
          </div>

          <textarea
            className="forum-reply-textarea"
            placeholder="Type your response to the operator here..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            disabled={isSending || isLoading}
          ></textarea>

          <div className="forum-reply-actions">
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              <i className="fa-solid fa-circle-info"></i> Replying as Admin will advance ticket status to <strong>Ongoing</strong>.
            </span>

            <button
              type="submit"
              className="forum-send-btn"
              disabled={!replyText.trim() || isSending || isLoading}
            >
              {isSending ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> Posting...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-paper-plane"></i> Send Response
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="closed-forum-banner">
          <i className="fa-solid fa-lock"></i>
          <p>
            This support forum thread was closed by <strong>{ticket.closedBy || 'Admin'}</strong>
            {ticket.closedAt ? ` on ${new Date(ticket.closedAt).toLocaleString()}` : ''}.
          </p>
          <button
            type="button"
            className="back-to-table-btn"
            onClick={handleReopen}
            disabled={isLoading}
            style={{ marginTop: '0.5rem' }}
          >
            <i className="fa-solid fa-lock-open"></i> Re-open Support Forum
          </button>
        </div>
      )}
    </div>
  );
}
