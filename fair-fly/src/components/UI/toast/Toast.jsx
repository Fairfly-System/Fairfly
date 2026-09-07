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
        return <i className="fa-solid fa-circle-check" aria-hidden="true"></i>;
      case 'error':
        return <i className="fa-solid fa-circle-xmark" aria-hidden="true"></i>;
      case 'warning':
        return <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>;
      default:
        return <i className="fa-solid fa-circle-info" aria-hidden="true"></i>;
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