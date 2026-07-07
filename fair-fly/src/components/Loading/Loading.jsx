import React from 'react';
import './Loading.css';

const Loading = () => {
  return (
    <div className="loading-container">
      <div className="loading-content">
        <div className="spinner"></div>
        <p>Loading Fairfly...</p>
      </div>
    </div>
  );
};

export default Loading;
