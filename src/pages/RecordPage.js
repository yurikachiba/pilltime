import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useAllDiary } from '../hooks/useMedications';
import { MOOD_FACES } from '../constants';
import { getLocalToday } from '../utils/dateUtils';
import MoodFaceIcon from '../components/MoodFaceIcon';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

// 日付を読みやすい形式にフォーマット
function formatDate(dateStr) {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' });
  } catch {
    return dateStr;
  }
}

const RecordPage = () => {
  const { entries, loading, error } = useAllDiary();
  const navigate = useNavigate();

  if (loading) return <LoadingSpinner message="日記を読み込み中..." />;

  if (error) {
    return (
      <div className="error-message">
        <p>データの取得に失敗しました</p>
        <p className="error-message__detail">{error}</p>
      </div>
    );
  }

  return (
    <div className="diary-page">
      <Helmet>
        <title>日記 - PillTime</title>
        <meta name="description" content="日々の体調とメモの記録" />
      </Helmet>

      <div className="diary-page__header">
        <h1 className="page-title">日記</h1>
        <button
          className="btn btn--primary diary-page__add-btn"
          onClick={() => navigate(`/day-details/${getLocalToday()}`)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          今日の日記を書く
        </button>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          }
          title="日記がありません"
          description="下のボタンから今日の体調やメモを記録しましょう"
        />
      ) : (
        <div className="diary-list">
          {entries.map((entry) => {
            const face = entry.mood ? MOOD_FACES[entry.mood] : null;
            return (
              <div
                key={entry.date}
                className="diary-card"
                onClick={() => navigate(`/day-details/${entry.date}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') navigate(`/day-details/${entry.date}`);
                }}
              >
                <div className="diary-card__header">
                  <span className="diary-card__date">{formatDate(entry.date)}</span>
                  {face && (
                    <span className="diary-card__mood">
                      <MoodFaceIcon type={face.icon} size={24} />
                      <span className="diary-card__mood-label">{face.label}</span>
                    </span>
                  )}
                </div>
                {entry.notes && (
                  <p className="diary-card__notes">{entry.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecordPage;
