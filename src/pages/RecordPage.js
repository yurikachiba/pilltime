import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useMedicationHistory } from '../hooks/useMedications';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const RecordPage = () => {
  const { history, loading, error } = useMedicationHistory();
  const navigate = useNavigate();

  if (loading) return <LoadingSpinner message="履歴を読み込み中..." />;

  if (error) {
    return (
      <div className="error-message">
        <p>データの取得に失敗しました</p>
        <p className="error-message__detail">{error}</p>
      </div>
    );
  }

  return (
    <div className="record-page">
      <Helmet>
        <title>服用記録 - PillTime</title>
        <meta name="description" content="過去のお薬の服用記録を確認" />
      </Helmet>

      <h1 className="page-title">服用記録</h1>

      {history.length === 0 ? (
        <EmptyState
          icon={
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          }
          title="記録がありません"
          description="お薬を服用すると、ここに記録が表示されます"
        />
      ) : (
        <div className="record-list">
          {history.map((medication, index) => (
            <div
              key={index}
              className="record-card"
              onClick={() => navigate(`/day-details/${medication.date || new Date().toISOString().split('T')[0]}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigate(`/day-details/${medication.date || new Date().toISOString().split('T')[0]}`);
              }}
            >
              <div className="record-card__icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
              </div>
              <div className="record-card__content">
                <h3 className="record-card__name">{medication.name}</h3>
                {medication.date && <p className="record-card__date">{medication.date}</p>}
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecordPage;
