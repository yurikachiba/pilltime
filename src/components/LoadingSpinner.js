import React from 'react';

const LoadingSpinner = ({ message = '読み込み中...' }) => {
  return (
    <div className="loading-spinner" role="status" aria-label={message}>
      <div className="loading-spinner__circle" />
      <p className="loading-spinner__text">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
