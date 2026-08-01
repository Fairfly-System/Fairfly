import React from 'react';
import { createPortal } from 'react-dom';
import './modal.css';

export default function ModalWrapper({ isOpen, onClose, title, subtitle, children }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="modalOverlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="closeBtn" onClick={onClose} aria-label="Close modal">
          <i className="fa-solid fa-circle-xmark"></i>
        </button>
        <div className="modalHeader">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}