import './team-chat-modal.css';
import { useState } from 'react';

export default function TeamChatModal({ onClose }) {
  const [message, setMessage] = useState('');

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
          <i className="fa-regular fa-comments"></i>
          <h3>No messages yet</h3>
          <p>Start the conversation with your team</p>
        </div>

        <textarea
          className="chat-modal-input"
          placeholder="Type your message here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button className="chat-modal-send">
          <i className="fa-solid fa-paper-plane"></i>
          Send Message
        </button>
      </div>
    </div>
  );
}
