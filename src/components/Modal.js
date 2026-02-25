import React from 'react';

const Modal = ({ isOpen, message, type = 'success', onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className={`modal-dialog modal-dialog--${type}`} role="dialog" aria-modal="true">
        <div className="modal-dialog__icon">
          {type === 'success' ? (
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12l3 3 5-5" />
            </svg>
          ) : (
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          )}
        </div>
        <p className="modal-dialog__message">{message}</p>
        <button className="modal-dialog__button" onClick={onClose}>閉じる</button>
      </div>
    </>
  );
};

export default Modal;
