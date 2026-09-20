import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import './base-modal.css';

const BaseModal = forwardRef(({
  children,
  title,
  subtitle,
  onClose,
  onOpen,
  isOpen: controlledIsOpen,
  maxWidth,
  width,
  size,
  className = '',
  isLoading = false,
}, ref) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [modalData, setModalData] = useState(null);

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const openModal = (data) => {
    setModalData(data || null);
    setInternalIsOpen(true);
    if (onOpen) onOpen(data);
  };

  const closeModal = () => {
    setInternalIsOpen(false);
    setModalData(null);
    if (onClose) onClose();
  };

  useImperativeHandle(ref, () => ({
    openModal,
    closeModal,
    isOpen,
    data: modalData,
  }));

  if (!isOpen) return null;

  // Compute container dimensions from size or explicit props
  let defaultMaxWidth = undefined;
  let defaultWidth = undefined;
  if (size === 'large') {
    defaultMaxWidth = '54rem';
    defaultWidth = '94%';
  } else if (size === 'xl') {
    defaultMaxWidth = '66rem';
    defaultWidth = '96%';
  } else if (size === 'medium') {
    defaultMaxWidth = '40rem';
    defaultWidth = '92%';
  } else if (size === 'small') {
    defaultMaxWidth = '28.125rem';
    defaultWidth = '90%';
  }

  const containerStyle = {};
  const effectiveMaxWidth = maxWidth || defaultMaxWidth;
  const effectiveWidth = width || defaultWidth;
  if (effectiveMaxWidth) containerStyle.maxWidth = effectiveMaxWidth;
  if (effectiveWidth) containerStyle.width = effectiveWidth;

  return createPortal(
    <div
      className="base-modal-overlay"
      onClick={() => {
        if (!isLoading) closeModal();
      }}
    >
      <div
        className={`base-modal-container ${className}`.trim()}
        style={containerStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || subtitle) && (
          <div className="base-modal-header">
            <div>
              {title && (
                typeof title === 'string' ? (
                  <h3 className="base-modal-title">{title}</h3>
                ) : (
                  title
                )
              )}
              {subtitle && (
                typeof subtitle === 'string' ? (
                  <p className="base-modal-subtitle">{subtitle}</p>
                ) : (
                  subtitle
                )
              )}
            </div>
            <button
              className="base-modal-close-btn"
              onClick={closeModal}
              disabled={isLoading}
              aria-label="Close modal"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        )}
        {!title && !subtitle && (
          <button
            className="base-modal-close-btn base-modal-close-btn-absolute"
            onClick={closeModal}
            disabled={isLoading}
            aria-label="Close modal"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        )}
        <div className="base-modal-body">
          {typeof children === 'function'
            ? children({ closeModal, close: closeModal, data: modalData })
            : children}
        </div>
      </div>
    </div>,
    document.body
  );
});

BaseModal.displayName = 'BaseModal';

export default BaseModal;
