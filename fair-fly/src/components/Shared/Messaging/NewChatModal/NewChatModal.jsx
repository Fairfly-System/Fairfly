import React, { useState, useEffect, useMemo } from 'react';
import BaseModal from '../../../UI/ModalBase/BaseModal';
import { getEligibleContacts } from '../../../../services/chatService';
import './new-chat-modal.css';

export default function NewChatModal({ isOpen, onClose, onSelectContact, currentUserRole }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isStartingChat, setIsStartingChat] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadContacts();
    }
  }, [isOpen]);

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
    if (!search.trim()) return contacts;
    const q = search.toLowerCase().trim();
    return contacts.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.branchName?.toLowerCase().includes(q)
    );
  }, [contacts, search]);

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
        </div>

        <div className="new-chat-contacts-list">
          {loading ? (
            <div className="new-chat-empty">
              <i className="fa-solid fa-circle-notch fa-spin"></i>
              <p>Loading available contacts...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="new-chat-empty">
              <i className="fa-regular fa-user"></i>
              <p>No matching contacts found</p>
            </div>
          ) : (
            filteredContacts.map((contact) => {
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
            })
          )}
        </div>
      </div>
    </BaseModal>
  );
}
