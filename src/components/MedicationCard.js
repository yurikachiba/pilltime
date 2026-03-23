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
  onSkip,
  onDelete,
  onEdit,
  isTaken,
  isSkipped,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className={`med-card ${isTaken ? 'med-card--taken' : ''} ${isSkipped ? 'med-card--skipped' : ''}`}>
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
              onClick={() => setShowMenu(!showMenu)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              aria-label="メニュー"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
              </svg>
            </button>
            {showMenu && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 9 }}
                  onClick={() => setShowMenu(false)}
                />
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
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="med-card__actions">
        <div className="med-card__action-btns">
          <button
            className={`med-card__take-btn ${isTaken ? 'med-card__take-btn--done' : ''}`}
            onClick={() => onMarkTaken()}
            disabled={isSkipped}
            aria-label={isTaken ? '服用済み' : '服用する'}
          >
            {isTaken ? '服用済み' : '飲んだ'}
          </button>
          <button
            className={`med-card__skip-btn ${isSkipped ? 'med-card__skip-btn--done' : ''}`}
            onClick={() => onSkip()}
            disabled={isTaken}
            aria-label={isSkipped ? 'スキップ済み' : 'スキップする'}
          >
            {isSkipped ? 'スキップ済' : 'スキップ'}
          </button>
        </div>
        <div className="med-card__settings">
          <label className="med-card__toggle">
            <input
              type="checkbox"
              checked={notificationOn}
              onChange={() => onToggleNotification(med.id)}
              aria-label={`${med.name}の通知`}
            />
            <span className="med-card__toggle-slider" />
            <span className="med-card__toggle-label">{notificationOn ? '通知ON' : '通知OFF'}</span>
          </label>
          {notificationOn && (
            <>
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
              >
                テスト
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicationCard;
