import React from 'react';
import './Loading.css';

const Loading = ({text = 'Fairfly'}) => {
  return (
    <div className="loading-container">
      <div className="loading-content">
        <div className="spinner"></div>
        <p>Loading {text}...</p>
      </div>
    </div>
  );
};

export default Loading;
