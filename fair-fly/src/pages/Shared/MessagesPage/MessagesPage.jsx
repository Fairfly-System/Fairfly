import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import { uploadFileToBackend } from '../../../utils/fileUploadApi';
import {
  subscribeToConversations,
  subscribeToMessages,
  sendDirectMessage,
  markChatAsRead,
  getOrCreateDirectChat,
  getChatUserProfiles,
  getEligibleContacts
} from '../../../services/chatService';
import NewChatModal from '../../../components/Shared/Messaging/NewChatModal/NewChatModal';
import Breadcrumbs from '../../../components/UI/Breadcrumbs/Breadcrumbs';
import useDebounce from '../../../hooks/useDebounce';
import { useLightbox, isImageUrl } from '../../../components/UI/ImageLightbox/ImageLightbox';
import './messages-page.css';

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatMessageTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatConvTimestamp(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Yesterday';

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatDayDivider(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  if (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  ) {
    return 'Today';
  }
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return 'Yesterday';
  }
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

export default function MessagesPage() {
  const { user, userDetails, userToken } = useAuthContext();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const currentUid = user?.uid;
  const currentRole = userDetails?.role || 'client';

  // Conversations state
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [activeConversation, setActiveConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'unread'
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

  // Cached user profiles { [uid]: { id, name, email, role, branchName } }
  const [userProfiles, setUserProfiles] = useState({});
  const fetchedUserIdsRef = useRef(new Set());

  // Messages state
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { openLightbox } = useLightbox();

  // Pre-load eligible contacts into user profiles cache
  useEffect(() => {
    let isMounted = true;
    getEligibleContacts()
      .then((contacts) => {
        if (!isMounted || !Array.isArray(contacts)) return;
        const profileMap = {};
        contacts.forEach((c) => {
          if (c.id) {
            profileMap[c.id] = {
              id: c.id,
              name: c.name || c.fullName || c.branchName || 'User',
              email: c.email || '',
              role: c.role || 'user',
              branchName: c.branchName || null
            };
            fetchedUserIdsRef.current.add(c.id);
          }
        });
        setUserProfiles((prev) => ({ ...prev, ...profileMap }));
      })
      .catch((err) => {
        console.warn('Could not pre-load contacts into user profile cache:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle direct navigation to a specific contact
  useEffect(() => {
    if (!currentUid || !location.state?.partnerId) return;

    const partnerId = location.state.partnerId;

    // Check if we already have an existing conversation with this partner in the local conversations list
    const existing = conversations.find((c) => {
      const parts = c.participants || [];
      return parts.includes(partnerId);
    });

    if (existing) {
      setActiveConversation(existing);
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }

    const openChat = async () => {
      try {
        const conv = await getOrCreateDirectChat(partnerId);
        if (conv?.partnerProfile?.id) {
          setUserProfiles((prev) => ({
            ...prev,
            [conv.partnerProfile.id]: conv.partnerProfile
          }));
          fetchedUserIdsRef.current.add(conv.partnerProfile.id);
        }
        setActiveConversation(conv);
        navigate(location.pathname, { replace: true, state: {} });
      } catch (err) {
        console.error('Error opening direct chat with partner:', err);
        addToast(err.message || 'Could not open chat', 'error');
      }
    };

    openChat();
  }, [currentUid, location.state?.partnerId, conversations, navigate, location.pathname, addToast]);

  // Real-time subscription to conversations list
  useEffect(() => {
    if (!currentUid) return;
    setLoadingConversations(true);
    const unsub = subscribeToConversations(currentUid, (list) => {
      setConversations(list);
      setLoadingConversations(false);

      // If active conversation updated in list, update activeConversation data
      setActiveConversation((prev) => {
        if (!prev) return null;
        const updated = list.find((c) => c.id === prev.id);
        return updated || prev;
      });
    });

    return () => unsub();
  }, [currentUid]);

  // Batch resolve any conversation partner IDs not present in user profile cache
  useEffect(() => {
    if (!conversations.length || !currentUid) return;

    const missingIds = [];
    conversations.forEach((conv) => {
      const partnerId = conv.participants?.find((p) => p !== currentUid);
      if (partnerId && !userProfiles[partnerId] && !fetchedUserIdsRef.current.has(partnerId)) {
        missingIds.push(partnerId);
        fetchedUserIdsRef.current.add(partnerId);
      }
    });

    if (missingIds.length > 0) {
      getChatUserProfiles(missingIds)
        .then((newProfiles) => {
          if (newProfiles && Object.keys(newProfiles).length > 0) {
            setUserProfiles((prev) => ({ ...prev, ...newProfiles }));
          }
        })
        .catch((err) => {
          console.warn('Failed to batch resolve conversation partner profiles:', err);
        });
    }
  }, [conversations, currentUid, userProfiles]);

  // Real-time subscription to active conversation's messages
  useEffect(() => {
    if (!activeConversation?.id) {
      setMessages([]);
      return;
    }

    // Mark as read
    if (activeConversation.unreadCount?.[currentUid] > 0) {
      markChatAsRead(activeConversation.id);
    }

    const unsub = subscribeToMessages(activeConversation.id, (msgs) => {
      setMessages(msgs);
    });

    return () => unsub();
  }, [activeConversation?.id, currentUid]);

  // Helper to extract partner details from fresh user profile cache
  const getPartnerDetails = useCallback((conv) => {
    if (!conv) return {};
    const partnerId = conv.participants?.find((p) => p !== currentUid);
    const profile = (partnerId && userProfiles[partnerId]) || conv.participantDetails?.[partnerId] || {};
    const role = profile.role || conv.participantRoles?.[partnerId] || 'user';
    return {
      id: partnerId,
      name: profile.name || profile.fullName || profile.branchName || 'User',
      email: profile.email || '',
      role,
      branchName: profile.branchName || null
    };
  }, [currentUid, userProfiles]);

  // Filtered conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const partner = getPartnerDetails(c);
      const unread = (c.unreadCount?.[currentUid] || 0) > 0;

      if (filterTab === 'unread' && !unread) return false;

      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase().trim();
        const matchesName = partner.name?.toLowerCase().includes(q);
        const matchesEmail = partner.email?.toLowerCase().includes(q);
        const matchesBranch = partner.branchName?.toLowerCase().includes(q);
        const matchesLast = c.lastMessage?.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesBranch && !matchesLast) {
          return false;
        }
      }
      return true;
    });
  }, [conversations, debouncedSearch, filterTab, currentUid, getPartnerDetails]);

  // Start chat with contact from NewChatModal
  const handleSelectContact = async (contact) => {
    try {
      if (contact?.id) {
        setUserProfiles((prev) => ({
          ...prev,
          [contact.id]: {
            id: contact.id,
            name: contact.name || contact.fullName || contact.branchName || 'User',
            email: contact.email || '',
            role: contact.role || 'user',
            branchName: contact.branchName || null
          }
        }));
        fetchedUserIdsRef.current.add(contact.id);
      }

      const existing = conversations.find((c) => {
        const parts = c.participants || [];
        return parts.includes(contact.id);
      });

      if (existing) {
        setActiveConversation(existing);
        addToast(`Switched to chat with ${contact.name}`, 'info');
        return;
      }

      const conv = await getOrCreateDirectChat(contact.id);
      if (conv?.partnerProfile?.id) {
        setUserProfiles((prev) => ({
          ...prev,
          [conv.partnerProfile.id]: conv.partnerProfile
        }));
        fetchedUserIdsRef.current.add(conv.partnerProfile.id);
      }
      setActiveConversation(conv);
      addToast(`Chat opened with ${contact.name}`, 'info');
    } catch (error) {
      addToast(error.message, 'error');
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 5MB for chat files
    if (file.size > 5 * 1024 * 1024) {
      addToast('File size cannot exceed 5MB', 'error');
      return;
    }

    setSelectedFile(file);
  };

  // Send message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !selectedFile) || !activeConversation?.id || isSending) return;

    setIsSending(true);
    let fileMetadata = null;

    try {
      if (selectedFile) {
        setIsUploading(true);
        const authToken = userToken || (await user?.getIdToken());
        const uploadRes = await uploadFileToBackend(
          selectedFile,
          `chat_attachments/${activeConversation.id}`,
          authToken
        );

        fileMetadata = {
          fileName: uploadRes.fileName || selectedFile.name,
          fileSize: uploadRes.fileSize || selectedFile.size,
          fileType: selectedFile.type,
          fileUrl: uploadRes.url
        };
        setIsUploading(false);
      }

      await sendDirectMessage(activeConversation.id, {
        content: inputText.trim(),
        messageType: fileMetadata ? (fileMetadata.fileType.startsWith('image/') ? 'image' : 'file') : 'text',
        fileMetadata
      });

      setInputText('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Failed to send message:', error);
      addToast(error.message || 'Failed to send message', 'error');
    } finally {
      setIsSending(false);
      setIsUploading(false);
    }
  };

  // Group messages by date for dividers
  const groupedMessages = useMemo(() => {
    const groups = [];
    let lastDate = null;

    messages.forEach((msg) => {
      const msgDate = new Date(msg.createdAt || msg.timestamp || 0).toDateString();
      if (msgDate !== lastDate) {
        groups.push({
          type: 'divider',
          date: msg.createdAt || msg.timestamp,
          id: `div_${msgDate}`
        });
        lastDate = msgDate;
      }
      groups.push({ type: 'message', data: msg, id: msg.id });
    });

    return groups;
  }, [messages]);

  const activePartner = activeConversation ? getPartnerDetails(activeConversation) : null;
  const currentInitial = (userDetails?.name || user?.email || 'U')[0].toUpperCase();

  const breadcrumbItems = useMemo(() => {
    const rootTo = currentRole === 'client' ? '/client' : `/${currentRole}`;
    const rootLabel = currentRole === 'client' ? 'Home' : 'Dashboard';

    const items = [
      { label: rootLabel, to: rootTo },
      { label: 'Direct Messages' }
    ];

    if (activePartner?.name) {
      items.push({ label: activePartner.name });
    }

    return items;
  }, [currentRole, activePartner?.name]);

  return (
    <div className="messages-page-wrapper page-fade-in">
      <Breadcrumbs items={breadcrumbItems} />

      <div className={`messages-container-card ${activeConversation ? 'chat-open' : ''}`}>
        {/* ────────────────────────────────────────────────────────────────
            LEFT PANE: CONVERSATIONS LIST
            ──────────────────────────────────────────────────────────────── */}
        <aside className="messages-left-pane">
          {/* Header */}
          <div className="messages-left-header">
            <div className="messages-user-profile">
              <div className={`messages-user-avatar ${currentRole}`}>
                {currentInitial}
              </div>
              <div className="messages-user-info">
                <span className="messages-user-name">
                  {userDetails?.branchName || userDetails?.name || userDetails?.fullName || 'My Messages'}
                </span>
                <span className="messages-user-status">Online</span>
              </div>
            </div>

            <button
              type="button"
              className="btn-new-chat"
              onClick={() => setIsNewChatModalOpen(true)}
              title="Start New Conversation"
            >
              <i className="fa-solid fa-plus"></i>
              <span>New Chat</span>
            </button>
          </div>

          {/* Search & Tabs */}
          <div className="messages-left-search">
            <div className="messages-search-box">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="text"
                className="messages-search-input"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="messages-filter-pills">
              <button
                type="button"
                className={`messages-filter-pill ${filterTab === 'all' ? 'active' : ''}`}
                onClick={() => setFilterTab('all')}
              >
                All Chats ({conversations.length})
              </button>
              <button
                type="button"
                className={`messages-filter-pill ${filterTab === 'unread' ? 'active' : ''}`}
                onClick={() => setFilterTab('unread')}
              >
                Unread (
                {conversations.filter((c) => (c.unreadCount?.[currentUid] || 0) > 0).length}
                )
              </button>
            </div>
          </div>

          {/* Conversation List Items */}
          <div className="messages-conv-list">
            {loadingConversations ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={`skel-conv-${i}`} className="messages-conv-item" aria-busy="true" style={{ pointerEvents: 'none' }}>
                  <div className="skeleton skeleton-circle" style={{ width: '2.5rem', height: '2.5rem', minWidth: '2.5rem' }} />
                  <div className="messages-conv-content" style={{ flex: 1 }}>
                    <div className="messages-conv-top-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <div className="skeleton skeleton-title" style={{ width: '50%', height: '0.9rem', margin: 0 }} />
                      <div className="skeleton skeleton-text" style={{ width: '20%', height: '0.75rem', margin: 0 }} />
                    </div>
                    <div className="skeleton skeleton-text" style={{ width: '80%', height: '0.75rem', margin: 0 }} />
                  </div>
                </div>
              ))
            ) : filteredConversations.length === 0 ? (
              <div className="messages-empty-left">
                <i className="fa-regular fa-comments"></i>
                <p>No conversations found</p>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ fontSize: '0.8125rem', color: 'var(--purple)' }}
                  onClick={() => setIsNewChatModalOpen(true)}
                >
                  <i className="fa-solid fa-plus"></i> Start a new chat
                </button>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const partner = getPartnerDetails(conv);
                const isActive = activeConversation?.id === conv.id;
                const unread = conv.unreadCount?.[currentUid] || 0;
                const partnerInitial = (partner.name || 'U')[0].toUpperCase();

                return (
                  <button
                    key={conv.id}
                    type="button"
                    className={`messages-conv-item ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveConversation(conv)}
                  >
                    <div className={`messages-conv-avatar ${partner.role}`}>
                      {partnerInitial}
                    </div>

                    <div className="messages-conv-content">
                      <div className="messages-conv-top-row">
                        <span className="messages-conv-name">{partner.name}</span>
                        <span className="messages-conv-time">
                          {formatConvTimestamp(conv.lastMessageAt || conv.updatedAt)}
                        </span>
                      </div>

                      <div className="messages-conv-bottom-row">
                        <span className={`messages-conv-preview ${unread > 0 ? 'unread' : ''}`}>
                          {conv.lastMessage
                            ? conv.lastMessage
                            : <em>Started a new conversation</em>}
                        </span>

                        {unread > 0 && (
                          <span className="messages-unread-badge">{unread}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ────────────────────────────────────────────────────────────────
            RIGHT PANE: CHAT WINDOW
            ──────────────────────────────────────────────────────────────── */}
        <main className="messages-right-pane">
          {activeConversation && activePartner ? (
            <>
              {/* Chat Header */}
              <header className="messages-chat-header">
                <div className="messages-partner-profile">
                  <button
                    type="button"
                    className="icon-btn"
                    style={{ marginRight: '0.5rem', display: 'none' }}
                    onClick={() => setActiveConversation(null)}
                    title="Back to conversations"
                  >
                    <i className="fa-solid fa-arrow-left"></i>
                  </button>

                  <div className={`messages-partner-avatar ${activePartner.role}`}>
                    {(activePartner.name || 'U')[0].toUpperCase()}
                  </div>

                  <div className="messages-partner-info">
                    <div className="messages-partner-name-row">
                      <span className="messages-partner-name">{activePartner.name}</span>
                      <span className={`messages-role-badge ${activePartner.role}`}>
                        {activePartner.role === 'admin' ? 'Head Office Admin' : activePartner.role}
                      </span>
                    </div>
                    <span className="messages-partner-sub">
                      {activePartner.branchName ? `${activePartner.branchName} • ` : ''}
                      {activePartner.email}
                    </span>
                  </div>
                </div>
              </header>

              {/* Chat Thread Messages */}
              <div className="messages-chat-body">
                {groupedMessages.length === 0 ? (
                  <div className="messages-empty-left" style={{ margin: 'auto' }}>
                    <i className="fa-regular fa-message" style={{ fontSize: '2rem', color: 'var(--purple-light)' }}></i>
                    <p>No messages yet. Send a message to start chatting with {activePartner.name}.</p>
                  </div>
                ) : (
                  groupedMessages.map((item) => {
                    if (item.type === 'divider') {
                      return (
                        <div key={item.id} className="messages-date-divider">
                          <span className="messages-date-pill">{formatDayDivider(item.date)}</span>
                        </div>
                      );
                    }

                    const msg = item.data;
                    const isSentByMe = msg.senderId === currentUid;

                    return (
                      <div
                        key={item.id}
                        className={`message-bubble-row ${isSentByMe ? 'sent' : 'received'}`}
                      >
                        <div className="message-bubble">
                          {/* File Attachment if present */}
                          {msg.fileMetadata && (() => {
                            const isImg = msg.messageType === 'image' || isImageUrl(msg.fileMetadata?.fileUrl, msg.fileMetadata?.fileName);
                            return isImg ? (
                              <button
                                type="button"
                                onClick={() => openLightbox({ url: msg.fileMetadata.fileUrl, title: msg.fileMetadata.fileName || 'Attached Image' })}
                                className="message-attachment-card message-attachment-card-btn"
                                title="Click to view image"
                              >
                                <i className="fa-solid fa-file-image message-attachment-icon"></i>
                                <div className="message-attachment-meta">
                                  <span className="message-attachment-name">{msg.fileMetadata.fileName}</span>
                                  <span className="message-attachment-size">{formatFileSize(msg.fileMetadata.fileSize)}</span>
                                </div>
                                <i className="fa-solid fa-expand" style={{ fontSize: '0.875rem' }}></i>
                              </button>
                            ) : (
                              <a
                                href={msg.fileMetadata.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="message-attachment-card"
                              >
                                <i className="fa-solid fa-file-arrow-down message-attachment-icon"></i>
                                <div className="message-attachment-meta">
                                  <span className="message-attachment-name">{msg.fileMetadata.fileName}</span>
                                  <span className="message-attachment-size">{formatFileSize(msg.fileMetadata.fileSize)}</span>
                                </div>
                                <i className="fa-solid fa-download" style={{ fontSize: '0.875rem' }}></i>
                              </a>
                            );
                          })()}

                          {/* Text content */}
                          {msg.content && <p>{msg.content}</p>}
                        </div>

                        <div className="message-meta-row">
                          <span>{formatMessageTime(msg.createdAt || msg.timestamp)}</span>
                          {isSentByMe && (
                            <i className="fa-solid fa-check-double message-check-icon" title="Delivered"></i>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Attachment Preview Strip */}
              {selectedFile && (
                <div className="messages-attachment-preview-strip">
                  <span className="messages-attachment-preview-name">
                    <i className="fa-solid fa-paperclip"></i>
                    {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </span>
                  <button
                    type="button"
                    className="messages-btn-remove-attachment"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    title="Remove file"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              )}

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="messages-chat-input-area">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                />

                <button
                  type="button"
                  className="messages-btn-attach"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach file (max 5MB)"
                >
                  <i className="fa-solid fa-paperclip"></i>
                </button>

                <div className="messages-input-wrap">
                  <input
                    type="text"
                    className="messages-input-field"
                    placeholder="Type a message..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={isSending}
                  />
                </div>

                <button
                  type="submit"
                  className="messages-btn-send"
                  disabled={(!inputText.trim() && !selectedFile) || isSending}
                  title="Send message"
                >
                  {isSending ? (
                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                  ) : (
                    <i className="fa-solid fa-paper-plane"></i>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Empty State */
            <div className="messages-right-empty">
              <div className="messages-empty-graphic">
                <i className="fa-solid fa-comments"></i>
              </div>
              <h3>Fairfly Live Direct Messaging</h3>
              <p>
                Stay seamlessly connected with branch operators and team administrators. Select a conversation from the sidebar or start a new direct chat.
              </p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setIsNewChatModalOpen(true)}
              >
                <i className="fa-solid fa-pen-to-square"></i>
                <span>Start New Conversation</span>
              </button>
            </div>
          )}
        </main>
      </div>

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        onSelectContact={handleSelectContact}
        currentUserRole={currentRole}
      />
    </div>
  );
}
