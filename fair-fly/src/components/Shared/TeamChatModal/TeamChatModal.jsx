import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './team-chat-modal.css';
import { sendMessage, listenToMessages, getRecentMessages } from '../../../services/chatService';

export default function TeamChatModal({ onClose }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatId, setChatId] = useState(null);

  useEffect(() => {
    initializeTeamChat();
  }, []);

  const initializeTeamChat = async () => {
    try {
      const TEAM_CHAT_ID = 'fairfly-team-chat';
      setChatId(TEAM_CHAT_ID);

      const recentMessages = await getRecentMessages(TEAM_CHAT_ID, 50);
      setMessages(recentMessages);

      const unsubscribe = listenToMessages(TEAM_CHAT_ID, (updatedMessages) => {
        setMessages(updatedMessages);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error initializing team chat:', error);
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !chatId) return;

    try {
      const senderId = 'current-user-id';

      await sendMessage(chatId, {
        senderId,
        content: message.trim()
      });

      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message: ' + error.message);
    }
  };

  const content = (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chat-modal-header">
          <div className="chat-modal-title">
            <i className="fa-regular fa-message"></i>
            <h2>Team Communication</h2>
          </div>
          <button className="chat-modal-close" onClick={onClose} aria-label="Close chat">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <p className="chat-modal-subtitle">
          Communicate with all operators about system issues and services
        </p>

        <div className="chat-modal-messages">
          {loading && !chatId ? (
            <div className="chat-empty-state">
              <p>Loading chat messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="chat-empty-state">
              <i className="fa-regular fa-comments"></i>
              <h3>No messages yet</h3>
              <p>Start the conversation with your team</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isCurrentUser = msg.senderId === 'current-user-id';
              return (
                <div key={index} className={`chat-message ${isCurrentUser ? 'own-message' : 'other-message'}`}>
                  <div className="chat-message-content">
                    <p>{msg.content}</p>
                    <span className="chat-message-time">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={handleSendMessage} className="chat-modal-input-form">
          <input
            type="text"
            className="chat-modal-input"
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={!chatId}
          />
          <button
            type="submit"
            className="chat-modal-send"
            disabled={!message.trim() || !chatId}
          >
            <i className="fa-solid fa-paper-plane"></i>
            Send
          </button>
        </form>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}