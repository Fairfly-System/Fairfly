import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useNotifications } from '../../../context/NotificationContext';
import './notification-bell.css';

/**
 * Format timestamp into human-readable relative time
 */
function formatTimeAgo(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Get icon and type styling for notification categories
 */
function getCategoryIcon(type) {
  switch (type) {
    case 'inquiry':
      return { icon: 'fa-solid fa-file-invoice', className: 'service' };
    case 'quotation':
      return { icon: 'fa-solid fa-file-circle-dollar', className: 'service' };
    case 'qualification':
      return { icon: 'fa-solid fa-award', className: 'franchise' };
    case 'appointment':
      return { icon: 'fa-solid fa-calendar-check', className: 'appointment' };
    case 'service':
      return { icon: 'fa-solid fa-clipboard-list', className: 'service' };
    case 'ticket':
      return { icon: 'fa-solid fa-ticket', className: 'ticket' };
    case 'franchise':
      return { icon: 'fa-solid fa-briefcase', className: 'franchise' };
    case 'resource':
      return { icon: 'fa-solid fa-file-arrow-down', className: 'resource' };
    case 'message':
      return { icon: 'fa-solid fa-comment-dots', className: 'ticket' };
    default:
      return { icon: 'fa-solid fa-bell', className: 'system' };
  }
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'unread'
  const containerRef = useRef(null);

  // Close on outside click or Escape
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleNotificationClick = (notif) => {
    markAsRead(notif.id);
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const filteredList = notifications.filter((n) => {
    if (filterTab === 'unread') return !n.read;
    return true;
  });

  return (
    <div className="notification-bell-container" ref={containerRef}>
      <button
        type="button"
        className={`notification-bell-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        title="Notifications"
      >
        <i className="fa-regular fa-bell"></i>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          {/* Header */}
          <div className="notification-dropdown-header">
            <div className="notification-header-title">
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <span className="notification-count-pill">{unreadCount} new</span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                className="notification-mark-all-btn"
                onClick={markAllAsRead}
                title="Mark all as read"
              >
                <i className="fa-solid fa-check-double"></i>
                Mark all read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="notification-tabs">
            <button
              type="button"
              className={`notification-tab-btn ${filterTab === 'all' ? 'active' : ''}`}
              onClick={() => setFilterTab('all')}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              className={`notification-tab-btn ${filterTab === 'unread' ? 'active' : ''}`}
              onClick={() => setFilterTab('unread')}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="notification-list">
            {filteredList.length === 0 ? (
              <div className="notification-empty-state">
                <div className="notification-empty-icon">
                  <i className="fa-regular fa-bell-slash"></i>
                </div>
                <span className="notification-empty-title">
                  {filterTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </span>
                <p className="notification-empty-desc">
                  {filterTab === 'unread'
                    ? "You're all caught up! Check back later."
                    : 'System alerts, appointments, and updates will appear here.'}
                </p>
              </div>
            ) : (
              filteredList.map((notif) => {
                const category = getCategoryIcon(notif.type);
                return (
                  <div
                    key={notif.id}
                    className={`notification-item ${!notif.read ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className={`notification-icon-bubble ${category.className}`}>
                      <i className={category.icon}></i>
                    </div>

                    <div className="notification-item-content">
                      <span className="notification-item-title">{notif.title}</span>
                      <p className="notification-item-message">{notif.message}</p>
                      <span className="notification-item-time">{formatTimeAgo(notif.createdAt)}</span>
                    </div>

                    {!notif.read && <span className="notification-unread-dot" title="Unread" />}

                    <button
                      type="button"
                      className="notification-dismiss-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notif.id);
                      }}
                      title="Dismiss notification"
                      aria-label="Dismiss notification"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
