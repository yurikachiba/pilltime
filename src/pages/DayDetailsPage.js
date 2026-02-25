import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { useDayDetails } from '../hooks/useDayDetails';
import { useModal } from '../hooks/useModal';
import { MOOD_MIN, MOOD_MAX } from '../constants';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

const MOOD_LABELS = ['', '最悪', 'とても悪い', '悪い', 'やや悪い', '普通', 'やや良い', '良い', 'とても良い', '最高', '絶好調'];

const DayDetailsPage = () => {
  const { date } = useParams();
  const {
    mood, setMood,
    notes, setNotes,
    medications,
    takenMedications, toggleMedication,
    loading, error,
    save,
  } = useDayDetails(date);
  const modal = useModal();

  const handleSave = async () => {
    try {
      await save();
      modal.showSuccess('データが保存されました');
    } catch {
      modal.showError('申し訳ございません。データの保存に失敗しました');
    }
  };

  const formattedDate = (() => {
    try {
      const d = new Date(date + 'T00:00:00');
      return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    } catch {
      return date;
    }
  })();

  if (loading) return <LoadingSpinner message="日別データを読み込み中..." />;

  if (error) {
    return (
      <div className="error-message">
        <p>データの取得に失敗しました</p>
        <p className="error-message__detail">{error}</p>
      </div>
    );
  }

  return (
    <div className="day-details">
      <Helmet>
        <title>{date}の詳細 - PillTime</title>
        <meta name="description" content={`${date}のお薬服用記録と体調メモ`} />
      </Helmet>

      <Modal isOpen={modal.isOpen} message={modal.message} type={modal.type} onClose={modal.close} />

      <h1 className="page-title">{formattedDate}</h1>

      <section className="detail-section">
        <h2 className="detail-section__title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
          今日の体調
        </h2>
        <div className="mood-slider">
          <input
            type="range"
            min={MOOD_MIN}
            max={MOOD_MAX}
            value={mood}
            onChange={(e) => setMood(Number(e.target.value))}
            className="mood-slider__input"
            aria-label="体調スライダー"
          />
          <div className="mood-slider__labels">
            <span>{MOOD_MIN}</span>
            <span className="mood-slider__value">{mood} - {MOOD_LABELS[mood]}</span>
            <span>{MOOD_MAX}</span>
          </div>
        </div>
      </section>

      <section className="detail-section">
        <h2 className="detail-section__title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          メモ
        </h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="detail-textarea"
          placeholder="今日の体調や気になることをメモしましょう..."
          rows={4}
        />
      </section>

      <section className="detail-section">
        <h2 className="detail-section__title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
          薬の摂取状況
        </h2>
        {medications.length === 0 ? (
          <p className="detail-section__empty">この日の薬の予定はありません</p>
        ) : (
          <div className="medication-checklist">
            {medications.map((medication) => (
              <label key={medication.id} className={`med-check ${takenMedications.includes(medication.id) ? 'med-check--taken' : ''}`}>
                <input
                  type="checkbox"
                  checked={takenMedications.includes(medication.id)}
                  onChange={() => toggleMedication(medication.id)}
                  className="med-check__input"
                />
                <span className="med-check__box">
                  {takenMedications.includes(medication.id) && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <span className="med-check__name">{medication.name}（{medication.doseAmount || medication.dose} {medication.unit}）</span>
              </label>
            ))}
          </div>
        )}
      </section>

      <button className="btn btn--primary btn--full" onClick={handleSave}>保存する</button>
    </div>
  );
};

export default DayDetailsPage;
