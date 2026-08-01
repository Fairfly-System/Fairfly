import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import './base-modal.css';

const BaseModal = forwardRef(({ children, title, onClose }, ref) => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  useImperativeHandle(ref, () => ({
    openModal,
    closeModal,
  }));

  if (!isOpen) return null;

  return createPortal(
    <div className="base-modal-overlay" onClick={closeModal}>
      <div className="base-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="base-modal-header">
          {title && <h3 className="base-modal-title">{title}</h3>}
          <button className="base-modal-close-btn" onClick={closeModal} aria-label="Close modal">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div className="base-modal-body">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
});

BaseModal.displayName = 'BaseModal';

export default BaseModal;
