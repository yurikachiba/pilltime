import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { useDayDetails } from '../hooks/useDayDetails';
import { useModal } from '../hooks/useModal';
import { MOOD_MIN, MOOD_MAX, MOOD_FACES } from '../constants';
import { expandMedsByTime } from '../utils/expandMedications';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

// SVGの顔アイコン（シンプルな線画）
const MoodFaceIcon = ({ type, size = 32 }) => {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const r = s / 2 - 2;
  const eyeY = cy - r * 0.15;
  const eyeLX = cx - r * 0.3;
  const eyeRX = cx + r * 0.3;
  const mouthY = cy + r * 0.3;

  let eyes = null;
  let mouth = null;

  switch (type) {
    case 'terrible':
      eyes = (
        <>
          <line x1={eyeLX - 2} y1={eyeY - 2} x2={eyeLX + 2} y2={eyeY + 2} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1={eyeLX + 2} y1={eyeY - 2} x2={eyeLX - 2} y2={eyeY + 2} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1={eyeRX - 2} y1={eyeY - 2} x2={eyeRX + 2} y2={eyeY + 2} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1={eyeRX + 2} y1={eyeY - 2} x2={eyeRX - 2} y2={eyeY + 2} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      );
      mouth = <path d={`M${cx - r * 0.3} ${mouthY + 3} Q${cx} ${mouthY - 4} ${cx + r * 0.3} ${mouthY + 3}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />;
      break;
    case 'bad':
      eyes = (
        <>
          <circle cx={eyeLX} cy={eyeY} r="2" fill="currentColor" />
          <circle cx={eyeRX} cy={eyeY} r="2" fill="currentColor" />
        </>
      );
      mouth = <path d={`M${cx - r * 0.25} ${mouthY + 2} Q${cx} ${mouthY - 3} ${cx + r * 0.25} ${mouthY + 2}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />;
      break;
    case 'neutral':
      eyes = (
        <>
          <circle cx={eyeLX} cy={eyeY} r="2" fill="currentColor" />
          <circle cx={eyeRX} cy={eyeY} r="2" fill="currentColor" />
        </>
      );
      mouth = <line x1={cx - r * 0.25} y1={mouthY} x2={cx + r * 0.25} y2={mouthY} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />;
      break;
    case 'good':
      eyes = (
        <>
          <circle cx={eyeLX} cy={eyeY} r="2" fill="currentColor" />
          <circle cx={eyeRX} cy={eyeY} r="2" fill="currentColor" />
        </>
      );
      mouth = <path d={`M${cx - r * 0.25} ${mouthY - 1} Q${cx} ${mouthY + 4} ${cx + r * 0.25} ${mouthY - 1}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />;
      break;
    case 'great':
      eyes = (
        <>
          <path d={`M${eyeLX - 3} ${eyeY} Q${eyeLX} ${eyeY - 4} ${eyeLX + 3} ${eyeY}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d={`M${eyeRX - 3} ${eyeY} Q${eyeRX} ${eyeY - 4} ${eyeRX + 3} ${eyeY}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      );
      mouth = <path d={`M${cx - r * 0.3} ${mouthY - 2} Q${cx} ${mouthY + 5} ${cx + r * 0.3} ${mouthY - 2}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />;
      break;
    default:
      break;
  }

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none">
      <circle cx={cx} cy={cy} r={r} stroke="currentColor" strokeWidth="2" fill="none" />
      {eyes}
      {mouth}
    </svg>
  );
};

const DayDetailsPage = () => {
  const { date } = useParams();
  const {
    mood, setMood,
    notes, setNotes,
    medications,
    records,
    toggleMedication,
    loading, error,
    save,
  } = useDayDetails(date);
  const modal = useModal();

  const scheduledMeds = expandMedsByTime(
    medications.filter((med) => med.frequency !== 'prn')
  );

  // 記録からスケジュール薬の服用状態を判定
  const isMedTaken = (med) =>
    records.some((r) => r.name === med.name && r.time === (med.time || '') && r.status === 'taken' && r.type === 'scheduled');

  // 頓服記録（記録から直接取得）
  const prnRecords = records.filter((r) => r.type === 'prn')
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

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
        <div className="mood-faces">
          {Array.from({ length: MOOD_MAX - MOOD_MIN + 1 }, (_, i) => i + MOOD_MIN).map((value) => {
            const face = MOOD_FACES[value];
            const isSelected = mood === value;
            return (
              <button
                key={value}
                type="button"
                className={`mood-face-btn ${isSelected ? 'mood-face-btn--selected' : ''}`}
                onClick={() => setMood(value)}
                aria-label={face.label}
              >
                <MoodFaceIcon type={face.icon} size={36} />
                <span className="mood-face-btn__label">{face.label}</span>
              </button>
            );
          })}
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

      {scheduledMeds.length > 0 && (
        <section className="detail-section">
          <h2 className="detail-section__title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
            薬の摂取状況
          </h2>
          <div className="medication-checklist">
            {scheduledMeds.map((medication) => {
              const taken = isMedTaken(medication);
              return (
                <label key={medication.id} className={`med-check ${taken ? 'med-check--taken' : ''}`}>
                  <input
                    type="checkbox"
                    checked={taken}
                    onChange={() => toggleMedication(medication)}
                    className="med-check__input"
                  />
                  <span className="med-check__box">
                    {taken && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  <span className="med-check__name">{medication.name}{medication.time ? ` ${medication.time}` : ''}（{medication.doseAmount} {medication.unit}）</span>
                </label>
              );
            })}
          </div>
        </section>
      )}

      {prnRecords.length > 0 && (
        <section className="detail-section">
          <h2 className="detail-section__title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 8v4l3 3" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            頓服薬の服用記録
          </h2>
          <div className="prn-detail-logs">
            {prnRecords.map((entry) => (
              <div key={entry.id} className="prn-detail-log">
                <span className="prn-detail-log__time">
                  {new Date(entry.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="prn-detail-log__name">{entry.name}</span>
                <span className="prn-detail-log__dose">{entry.doseAmount} {entry.unit}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <button className="btn btn--primary btn--full" onClick={handleSave}>保存する</button>
    </div>
  );
};

export default DayDetailsPage;
