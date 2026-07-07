import React, { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import Toast from './Toast';
import './ToastContainer.css';

export const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  //This is the function that adds a toast to the state, Math.random() generates a random number between 0 and 1, which is used to generate a unique id for each toast
  const addToast = useCallback((message, type = 'info') => { //useCallBack to prevent unnecessary re-renders of other Toast components
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    return id;
  }, []);

  //This is the function that removes a toast from the state using the Toast ID.
  //The useCallback hook is used to memoize the removeToast function, which prevents unnecessary re-renders when the same function is used in multiple components (Prevents Re-rendering of unaffected Toasts).
  const removeToast = useCallback((id) => {  //useCallBack to prevent unnecessary re-renders of other Toast components
    setToasts(prev => prev.filter(toast => toast.id !== id)); //Removes the toast with the matching ID from the state
  }, []);

  const value = {
    toasts,
    addToast,
    removeToast
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/*When Toast is added via ToastProvider's addToast function, it is rendered here*/}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id} //Required for React to recognize the Toast component as a unique component.
            id={toast.id}//Passes the ID from the Toast object to the Toast component (Used for removing the Toast and modifying it from the ToastProvider's scope).
            message={toast.message}//Passes the message from the Toast object to the Toast component.
            type={toast.type}//Passes the type from the Toast object to the Toast component.
            onRemove={removeToast}//Passes the removeToast function to the Toast component, which in the Toast component receives ID as a parameter, while the function passed is still within the ToastProvider's scope, enabling modification of the Toasts Array.
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default ToastProvider;