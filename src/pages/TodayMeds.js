import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useMedications } from '../hooks/useMedications';
import { NOTIFICATION_MESSAGES } from '../constants';
import MedicationCard from '../components/MedicationCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const TodayMeds = () => {
  const { medications, setMedications, loading, error } = useMedications();
  const [notificationSettings, setNotificationSettings] = useState({});
  const [takenMeds, setTakenMeds] = useState(() => {
    const saved = localStorage.getItem(`takenMeds_${new Date().toISOString().split('T')[0]}`);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (medications.length > 0) {
      const initialSettings = medications.reduce((acc, med) => {
        acc[med.id] = { on: true, messageType: 'default' };
        return acc;
      }, {});
      setNotificationSettings(initialSettings);
    }
  }, [medications]);

  useEffect(() => {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`takenMeds_${today}`, JSON.stringify(takenMeds));
  }, [takenMeds]);

  const handleNotification = useCallback((med) => {
    if (Notification.permission === 'granted') {
      const messageType = notificationSettings[med.id]?.messageType || 'default';
      const message = NOTIFICATION_MESSAGES[messageType] || NOTIFICATION_MESSAGES.default;
      new Notification(message, {
        body: `${med.name}を${med.doseAmount || med.dose} ${med.unit}服用してください`,
        icon: '/pill-icon.png',
      });
    }
  }, [notificationSettings]);

  const toggleNotification = useCallback((id) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [id]: { ...prev[id], on: !prev[id]?.on },
    }));
  }, []);

  const handleTimeChange = useCallback((id, event) => {
    const newTime = event.target.value;
    setMedications((prev) =>
      prev.map((med) => (med.id === id ? { ...med, time: newTime } : med))
    );
  }, [setMedications]);

  const handleMessageTypeChange = useCallback((id, event) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [id]: { ...prev[id], messageType: event.target.value },
    }));
  }, []);

  const handleMarkTaken = useCallback((id) => {
    setTakenMeds((prev) =>
      prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id]
    );
  }, []);

  const takenCount = takenMeds.length;
  const totalCount = medications.length;
  const progress = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

  if (loading) return <LoadingSpinner message="お薬情報を読み込み中..." />;

  if (error) {
    return (
      <div className="error-message">
        <p>データの取得に失敗しました</p>
        <p className="error-message__detail">{error}</p>
      </div>
    );
  }

  return (
    <div className="today-meds">
      <Helmet>
        <title>今日のお薬 - PillTime</title>
        <meta name="description" content="今日服用するお薬の一覧と服用管理" />
      </Helmet>

      <div className="today-meds__header">
        <h1 className="page-title">今日のお薬</h1>
        <p className="today-meds__date">
          {new Date().toLocaleDateString('ja-JP', {
            year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
          })}
        </p>
      </div>

      {totalCount > 0 && (
        <div className="progress-bar">
          <div className="progress-bar__track">
            <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="progress-bar__label">{takenCount}/{totalCount} 服用済み ({progress}%)</p>
        </div>
      )}

      {medications.length === 0 ? (
        <EmptyState
          icon={
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          }
          title="お薬が登録されていません"
          description="まずはお薬を追加してみましょう"
          action={<Link to="/add-task" className="btn btn--primary">お薬を追加する</Link>}
        />
      ) : (
        <div className="med-list">
          {medications.map((med) => (
            <MedicationCard
              key={med.id}
              med={med}
              notificationOn={notificationSettings[med.id]?.on || false}
              messageType={notificationSettings[med.id]?.messageType || 'default'}
              onToggleNotification={toggleNotification}
              onTimeChange={handleTimeChange}
              onMessageTypeChange={handleMessageTypeChange}
              onNotify={handleNotification}
              onMarkTaken={handleMarkTaken}
              isTaken={takenMeds.includes(med.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TodayMeds;
