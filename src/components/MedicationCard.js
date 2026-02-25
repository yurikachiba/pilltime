import React from 'react';
import { MESSAGE_TYPE_LABELS } from '../constants';

const MedicationCard = ({
  med,
  notificationOn,
  messageType,
  onToggleNotification,
  onTimeChange,
  onMessageTypeChange,
  onNotify,
  onMarkTaken,
  isTaken,
}) => {
  return (
    <div className={`med-card ${isTaken ? 'med-card--taken' : ''}`}>
      <div className="med-card__header">
        <div className="med-card__info">
          <h3 className="med-card__name">{med.name}</h3>
          <p className="med-card__dose">
            {med.dose} {med.unit}
          </p>
        </div>
        <div className="med-card__time-badge">
          <input
            type="time"
            value={med.time || ''}
            onChange={(e) => onTimeChange(med.id, e)}
            className="med-card__time-input"
            aria-label={`${med.name}の服用時間`}
          />
        </div>
      </div>
      <div className="med-card__actions">
        <button
          className={`med-card__take-btn ${isTaken ? 'med-card__take-btn--done' : ''}`}
          onClick={() => onMarkTaken(med.id)}
          aria-label={isTaken ? '服用済み' : '服用する'}
        >
          {isTaken ? '服用済み' : '飲んだ'}
        </button>
        <div className="med-card__settings">
          <label className="med-card__toggle">
            <input
              type="checkbox"
              checked={notificationOn}
              onChange={() => onToggleNotification(med.id)}
              aria-label={`${med.name}の通知`}
            />
            <span className="med-card__toggle-slider" />
          </label>
          <select
            value={messageType}
            onChange={(e) => onMessageTypeChange(med.id, e)}
            className="med-card__select"
            aria-label="通知メッセージタイプ"
          >
            {Object.entries(MESSAGE_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <button
            className="med-card__notify-btn"
            onClick={() => onNotify(med)}
            aria-label="テスト通知を送信"
            title="テスト通知"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MedicationCard;
