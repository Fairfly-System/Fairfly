import React from 'react';
import { createPortal } from 'react-dom';
import './modal.css';

export default function ModalWrapper({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '480px',
  width,
}) {
  if (!isOpen) return null;

  const modalStyle = {};
  if (maxWidth) modalStyle.maxWidth = maxWidth;
  if (width) modalStyle.width = width;

  return createPortal(
    <div className="modalOverlay" onClick={onClose}>
      <div className="modal" style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <button className="closeBtn" onClick={onClose} aria-label="Close modal">
          <i className="fa-solid fa-circle-xmark"></i>
        </button>
        {title && (
          <div className="modalHeader">
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
}