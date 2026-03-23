import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useAllRecords } from '../hooks/useMedications';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

// 日付ごとにレコードをグループ化
function groupByDate(records) {
  const groups = {};
  for (const record of records) {
    const date = record.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(record);
  }
  // 日付の新しい順にソート
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

const STATUS_LABELS = {
  taken: '服用済み',
  skipped: 'スキップ',
};

const RecordPage = () => {
  const { records, loading, error } = useAllRecords();
  const navigate = useNavigate();

  if (loading) return <LoadingSpinner message="記録を読み込み中..." />;

  if (error) {
    return (
      <div className="error-message">
        <p>データの取得に失敗しました</p>
        <p className="error-message__detail">{error}</p>
      </div>
    );
  }

  const grouped = groupByDate(records);

  return (
    <div className="record-page">
      <Helmet>
        <title>服用記録 - PillTime</title>
        <meta name="description" content="過去のお薬の服用記録を確認" />
      </Helmet>

      <h1 className="page-title">服用記録</h1>

      {grouped.length === 0 ? (
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
          {grouped.map(([date, dayRecords]) => (
            <div key={date} className="record-date-group">
              <h2
                className="record-date-group__header"
                onClick={() => navigate(`/day-details/${date}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') navigate(`/day-details/${date}`);
                }}
              >
                {date}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </h2>
              {dayRecords.map((record) => (
                <div key={record.id} className="record-card">
                  <div className="record-card__icon">
                    {record.status === 'taken' ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                    )}
                  </div>
                  <div className="record-card__content">
                    <h3 className="record-card__name">{record.name}</h3>
                    <p className="record-card__detail">
                      {record.doseAmount}{record.unit}
                      {record.time && ` ・ ${record.time}`}
                      {' ・ '}
                      <span className={`record-card__status record-card__status--${record.status}`}>
                        {STATUS_LABELS[record.status] || record.status}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecordPage;
