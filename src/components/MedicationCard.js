import React, { useState } from 'react';
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
  onDelete,
  onEdit,
  isTaken,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete?.(med.id);
      setConfirmDelete(false);
      setShowMenu(false);
    } else {
      setConfirmDelete(true);
    }
  };

  return (
    <div className={`med-card ${isTaken ? 'med-card--taken' : ''}`}>
      <div className="med-card__header">
        <div className="med-card__info">
          <h3 className="med-card__name">{med.name}</h3>
          <p className="med-card__dose">
            {med.doseAmounts && med.doseAmounts.some((d, i, arr) => d !== arr[0])
              ? med.selectedTimes?.map((t, i) => `${t}: ${med.doseAmounts[i] ?? med.doseAmount}${med.unit}`).join('、')
              : `1回 ${med.doseAmount} ${med.unit}`
            }
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="med-card__time-badge">
            <input
              type="time"
              value={med.time || ''}
              onChange={(e) => onTimeChange(med.id, e)}
              className="med-card__time-input"
              aria-label={`${med.name}の服用時間`}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => { setShowMenu(!showMenu); setConfirmDelete(false); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              aria-label="メニュー"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
              </svg>
            </button>
            {showMenu && (
              <div style={{
                position: 'absolute', right: 0, top: '100%', background: 'white', borderRadius: '8px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.15)', zIndex: 10, minWidth: '120px', overflow: 'hidden',
              }}>
                <button
                  type="button"
                  onClick={() => { onEdit?.(med); setShowMenu(false); }}
                  style={{ display: 'block', width: '100%', padding: '12px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '14px' }}
                >
                  編集
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  style={{ display: 'block', width: '100%', padding: '12px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '14px', color: confirmDelete ? 'white' : '#e53e3e', backgroundColor: confirmDelete ? '#e53e3e' : 'transparent' }}
                >
                  {confirmDelete ? '本当に削除' : '削除'}
                </button>
              </div>
            )}
          </div>
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
