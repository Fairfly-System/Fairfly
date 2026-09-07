import React, { useState, useEffect } from 'react';
import BaseModal from '../../UI/ModalBase/BaseModal';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../UI/toast/ToastProvider';
import { subscribeToAnnouncements, postAnnouncement } from '../../../services/chatService';
import './announcements-modal.css';

export default function AnnouncementsModal({ isOpen, onClose }) {
  const { userDetails } = useAuthContext();
  const { addToast } = useToast();

  const isAdmin = userDetails?.role === 'admin';

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Admin form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [isPosting, setIsPosting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const unsub = subscribeToAnnouncements((list) => {
      setAnnouncements(list);
      setLoading(false);
    });

    return () => unsub();
  }, [isOpen]);

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || isPosting) return;

    setIsPosting(true);
    try {
      await postAnnouncement({
        title: title.trim(),
        content: content.trim(),
        priority
      });

      addToast('Announcement broadcasted successfully to all operators', 'success');
      setTitle('');
      setContent('');
      setPriority('Normal');
      setShowForm(false);
    } catch (error) {
      console.error('Failed to post announcement:', error);
      addToast(error.message || 'Failed to post announcement', 'error');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="44rem"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className="fa-solid fa-bullhorn" style={{ color: 'var(--purple)' }}></i>
          <span>Head Office Announcements</span>
        </div>
      }
      subtitle="Official notices, system maintenance alerts, and policy updates"
    >
      <div className="announcements-modal-body">
        {/* Admin Broadcast Area */}
        {isAdmin && (
          <div>
            {!showForm ? (
              <button
                type="button"
                className="btn-primary"
                style={{ width: '100%', marginBottom: '0.5rem' }}
                onClick={() => setShowForm(true)}
              >
                <i className="fa-solid fa-plus"></i>
                <span>Broadcast New Announcement</span>
              </button>
            ) : (
              <form onSubmit={handlePostAnnouncement} className="announcements-admin-form">
                <div className="announcements-form-title">
                  <i className="fa-solid fa-bullhorn"></i>
                  <span>New Announcement Broadcast</span>
                </div>

                <input
                  type="text"
                  className="announcements-input"
                  placeholder="Announcement title (e.g. System Maintenance Notice)..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />

                <textarea
                  className="announcements-textarea"
                  placeholder="Write the full announcement details here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />

                <div className="announcements-form-controls">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-mid)' }}>
                      Priority:
                    </span>
                    <select
                      className="announcements-priority-select"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      <option value="Normal">Normal</option>
                      <option value="Important">Important</option>
                      <option value="Urgent">Urgent Alert</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => setShowForm(false)}
                      disabled={isPosting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={isPosting || !title.trim() || !content.trim()}
                    >
                      {isPosting ? (
                        <>
                          <i className="fa-solid fa-circle-notch fa-spin"></i>
                          <span>Broadcasting...</span>
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-paper-plane"></i>
                          <span>Broadcast Now</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Operator Broadcast-Only Notice */}
        {!isAdmin && (
          <div className="announcements-operator-banner">
            <i className="fa-solid fa-circle-info"></i>
            <span>
              This is an official broadcast channel from FairFly Head Office. All notices and updates are read-only.
            </span>
          </div>
        )}

        {/* Feed List */}
        <div className="announcements-feed">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={`skel-ann-${i}`} className="announcement-card normal" aria-busy="true">
                <div className="announcement-header-row">
                  <div className="announcement-title-row" style={{ width: '60%' }}>
                    <div className="skeleton skeleton-title" style={{ width: '70%', height: '1.1rem', margin: 0 }} />
                    <div className="skeleton skeleton-badge" style={{ width: '4rem', height: '1.25rem', margin: 0 }} />
                  </div>
                  <div className="announcement-meta">
                    <div className="skeleton skeleton-text" style={{ width: '7rem', height: '0.8rem', margin: 0 }} />
                  </div>
                </div>
                <div style={{ marginTop: '0.75rem' }}>
                  <div className="skeleton skeleton-text" style={{ width: '95%', height: '0.85rem', margin: '0.3rem 0' }} />
                  <div className="skeleton skeleton-text" style={{ width: '80%', height: '0.85rem', margin: '0.3rem 0' }} />
                </div>
              </div>
            ))
          ) : announcements.length === 0 ? (
            <div className="announcements-empty">
              <i className="fa-regular fa-bell-slash"></i>
              <h3>No announcements yet</h3>
              <p>When Head Office broadcasts new alerts or updates, they will appear here.</p>
            </div>
          ) : (
            announcements.map((item) => (
              <div key={item.id} className={`announcement-card ${(item.priority || 'Normal').toLowerCase()}`}>
                <div className="announcement-header-row">
                  <div className="announcement-title-row">
                    <span className="announcement-title">{item.title}</span>
                    <span className={`announcement-priority-badge ${(item.priority || 'Normal').toLowerCase()}`}>
                      {item.priority || 'Normal'}
                    </span>
                  </div>

                  <div className="announcement-meta">
                    <i className="fa-regular fa-clock"></i>
                    <span>
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Recent'}
                    </span>
                    <span>• by {item.authorName || 'Head Office'}</span>
                  </div>
                </div>

                <div className="announcement-content">{item.content}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </BaseModal>
  );
}
