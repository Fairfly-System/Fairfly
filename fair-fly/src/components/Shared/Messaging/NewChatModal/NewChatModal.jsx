import React, { useState, useEffect, useMemo, useRef } from 'react';
import BaseModal from '../../../UI/ModalBase/BaseModal';
import { getEligibleContacts } from '../../../../services/chatService';
import useDebounce from '../../../../hooks/useDebounce';
import './new-chat-modal.css';

const PAGE_SIZE = 10;

export default function NewChatModal({ isOpen, onClose, onSelectContact, currentUserRole }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadContacts();
      setVisibleCount(PAGE_SIZE);
    }
  }, [isOpen]);

  useEffect(() => {
    // Reset pagination when debounced search changes
    setVisibleCount(PAGE_SIZE);
  }, [debouncedSearch]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const list = await getEligibleContacts();
      setContacts(list || []);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = useMemo(() => {
    if (!debouncedSearch.trim()) return contacts;
    const q = debouncedSearch.toLowerCase().trim();
    return contacts.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.branchName?.toLowerCase().includes(q)
    );
  }, [contacts, debouncedSearch]);

  const visibleContacts = useMemo(() => {
    return filteredContacts.slice(0, visibleCount);
  }, [filteredContacts, visibleCount]);

  const hasMore = visibleCount < filteredContacts.length;

  // Infinite scroll handler
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 50 && hasMore) {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredContacts.length));
    }
  };

  const handleContactClick = async (contact) => {
    if (isStartingChat) return;
    setIsStartingChat(true);
    try {
      await onSelectContact(contact);
      onClose();
    } catch (error) {
      console.error('Failed to start chat:', error);
    } finally {
      setIsStartingChat(false);
    }
  };

  const getSubLabel = (contact) => {
    if (contact.role === 'operator') {
      return `Branch Operator • ${contact.email}`;
    }
    if (contact.role === 'admin') {
      return contact.isSuperAdmin ? `Head Office Super Admin • ${contact.email}` : `Support Admin • ${contact.email}`;
    }
    return `Client • ${contact.email}`;
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => !isStartingChat && onClose()}
      maxWidth="32rem"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className="fa-solid fa-pen-to-square" style={{ color: 'var(--purple)' }}></i>
          <span>New Conversation</span>
        </div>
      }
      subtitle={
        currentUserRole === 'client'
          ? 'Select a branch operator to chat with'
          : currentUserRole === 'operator'
          ? 'Select an administrator or client'
          : 'Select an operator or administrator to message'
      }
    >
      <div className="new-chat-modal-body">
        <div className="new-chat-search-wrap">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            type="text"
            className="new-chat-search-input"
            placeholder="Search by name, branch, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          {search && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mid)' }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>

        <div
          className="new-chat-contacts-list"
          ref={listRef}
          onScroll={handleScroll}
          style={{ maxHeight: '22rem', overflowY: 'auto' }}
        >
          {loading ? (
            <div className="new-chat-empty">
              <i className="fa-solid fa-circle-notch fa-spin"></i>
              <p>Loading available contacts...</p>
            </div>
          ) : visibleContacts.length === 0 ? (
            <div className="new-chat-empty">
              <i className="fa-regular fa-user"></i>
              <p>No matching contacts found</p>
            </div>
          ) : (
            <>
              {visibleContacts.map((contact) => {
                const initial = (contact.name || contact.email || 'U')[0].toUpperCase();
                return (
                  <button
                    key={contact.id}
                    type="button"
                    className="new-chat-contact-item"
                    onClick={() => handleContactClick(contact)}
                    disabled={isStartingChat}
                  >
                    <div className={`new-chat-contact-avatar ${contact.role}`}>
                      {initial}
                    </div>
                    <div className="new-chat-contact-info">
                      <div className="new-chat-contact-name-row">
                        <span className="new-chat-contact-name">{contact.name}</span>
                        <span className={`new-chat-contact-role-badge ${contact.role}`}>
                          {contact.role === 'admin' && contact.isSuperAdmin ? 'Super Admin' : contact.role}
                        </span>
                      </div>
                      <span className="new-chat-contact-sub">{getSubLabel(contact)}</span>
                    </div>
                    <i className="fa-solid fa-chevron-right" style={{ color: 'var(--text-light-2)', fontSize: '0.75rem' }}></i>
                  </button>
                );
              })}

              {hasMore && (
                <div style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-mid)', fontSize: '0.8125rem' }}>
                  <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: '0.375rem', color: 'var(--purple)' }}></i>
                  Scroll down to load more ({filteredContacts.length - visibleCount} remaining)...
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </BaseModal>
  );
}
