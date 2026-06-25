import React from 'react';
import './modal.css';

export default function ModalWrapper({ isOpen, onClose, title, subtitle, children }) {
  if (!isOpen) return null;

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="closeBtn" onClick={onClose}>&times;</button>
        <div className="modalHeader">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}