import PropTypes from 'prop-types';
import React, { useState } from 'react';
import './Toast.css';

const Toast = ({ message, type = 'info', onRemove, id }) => {
  const [isExiting, setIsExiting] = useState(false);

  // Handle auto-remove with exit animation
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Remove from DOM after animation finishes
  React.useEffect(() => {
    if (isExiting) {
      const animationTimer = setTimeout(() => {
        onRemove(id);
      }, 300); // matches animation duration in CSS
      return () => clearTimeout(animationTimer);
    }
  }, [isExiting, id, onRemove]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <span role="img" aria-label="success icon">✓</span>;
      case 'error':
        return <span role="img" aria-label="error icon">✕</span>;
      case 'warning':
        return <span role="img" aria-label="warning icon">⚠</span>;
      default:
        return <span role="img" aria-label="info icon">ℹ</span>;
    }
  };

  return (
    <div className={`toast toast-${type} ${isExiting ? 'toast-exit' : ''}`} role="alert">
      <div className="toast-content">
        <div className="toast-icon">{getIcon()}</div>
        <div className="toast-message">{message}</div>
        <button
          className="toast-close"
          onClick={() => {
            setIsExiting(true);
          }}
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
};

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  onRemove: PropTypes.func.isRequired,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
};

export default Toast;