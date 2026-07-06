import React, { useState, useEffect } from 'react';
import './team-chat-modal.css';
import { sendMessage, listenToMessages, getRecentMessages } from '../../../services/chatService';

export default function TeamChatModal({ onClose }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatId, setChatId] = useState(null);

  // Initialize or get the team chat on component mount
  useEffect(() => {
    initializeTeamChat();
  }, []);

  const initializeTeamChat = async () => {
    try {
      // For now, we'll use a fixed team chat ID
      // In a real app, you might want to create/get a specific team chat
      const TEAM_CHAT_ID = 'fairfly-team-chat';

      // Try to get the chat first
      // Since we don't have a getChatById function that creates if not exists,
      // we'll just use the ID and handle errors appropriately
      setChatId(TEAM_CHAT_ID);

      // Load recent messages
      const recentMessages = await getRecentMessages(TEAM_CHAT_ID, 50);
      setMessages(recentMessages);

      // Set up real-time listener
      const unsubscribe = listenToMessages(TEAM_CHAT_ID, (updatedMessages) => {
        setMessages(updatedMessages);
      });

      // Cleanup listener on unmount
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
      // In a real app, you would get the current user ID from auth
      // For now, we'll use a placeholder
      const senderId = 'current-user-id'; // TODO: Replace with actual user ID from auth

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

  if (loading && !chatId) {
    return (
      <div className="chat-modal-overlay" onClick={onClose}>
        <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
          <div className="chat-modal-header">
            <div className="chat-modal-title">
              <i className="fa-regular fa-message"></i>
              <h2>Team Communication</h2>
            </div>
            <button className="chat-modal-close" onClick={onClose}>
              <i className="fa-solid fa-circle-xmark"></i>
            </button>
          </div>
          <p className="chat-modal-subtitle">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chat-modal-header">
          <div className="chat-modal-title">
            <i className="fa-regular fa-message"></i>
            <h2>Team Communication</h2>
          </div>
          <button className="chat-modal-close" onClick={onClose}>
            <i className="fa-solid fa-circle-xmark"></i>
          </button>
        </div>

        <p className="chat-modal-subtitle">
          Communicate with all operators about system issues and services
        </p>

        <div className="chat-modal-messages">
          {messages.length === 0 ? (
            <>
              <i className="fa-regular fa-comments"></i>
              <h3>No messages yet</h3>
              <p>Start the conversation with your team</p>
            </>
          ) : (
            <>
              {messages.map((msg, index) => {
                // Determine if message is from current user (simplified)
                const isCurrentUser = msg.senderId === 'current-user-id'; // TODO: Replace with actual check

                return (
                  <div key={index} className={`chat-message ${isCurrentUser ? 'own-message' : 'other-message'}`}>
                    <div className="chat-message-content">
                      <p>{msg.content}</p>
                      <span className="chat-message-time">
                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                );
              })}
            </>
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
}