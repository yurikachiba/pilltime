import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useMedications } from '../hooks/useMedications';
import { NOTIFICATION_MESSAGES } from '../constants';
import { requestNotificationPermission, updateNotificationSchedules, showNotificationViaSW } from '../notifications';
import { api } from '../api/client';
import MedicationCard from '../components/MedicationCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const TodayMeds = () => {
  const { medications, setMedications, loading, error } = useMedications();
  const [notificationSettings, setNotificationSettings] = useState(() => {
    const saved = localStorage.getItem('pilltime_notification_settings');
    return saved ? JSON.parse(saved) : {};
  });
  const [takenMeds, setTakenMeds] = useState(() => {
    const saved = localStorage.getItem(`takenMeds_${new Date().toISOString().split('T')[0]}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [prnLogs, setPrnLogs] = useState({});

  const today = new Date().toISOString().split('T')[0];

  // 定時薬と頓服薬を分離
  const scheduledMeds = medications.filter((med) => med.frequency !== 'prn');
  const prnMeds = medications.filter((med) => med.frequency === 'prn');

  const hasPrnMeds = prnMeds.length > 0;

  // 頓服ログを取得
  useEffect(() => {
    const fetchPrnLogs = async () => {
      try {
        const logs = await api.get(`/api/prn-logs/${today}`);
        setPrnLogs(logs);
      } catch {
        // ignore
      }
    };
    if (hasPrnMeds) {
      fetchPrnLogs();
    }
  }, [today, hasPrnMeds]);

  useEffect(() => {
    if (medications.length > 0) {
      setNotificationSettings((prev) => {
        const updated = { ...prev };
        let changed = false;
        for (const med of medications) {
          if (!updated[med.id]) {
            updated[med.id] = { on: true, messageType: 'default' };
            changed = true;
          }
        }
        return changed ? updated : prev;
      });
    }
  }, [medications]);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    localStorage.setItem(`takenMeds_${today}`, JSON.stringify(takenMeds));
  }, [takenMeds, today]);

  // 通知設定をlocalStorageに永続化
  useEffect(() => {
    if (Object.keys(notificationSettings).length > 0) {
      localStorage.setItem('pilltime_notification_settings', JSON.stringify(notificationSettings));
    }
  }, [notificationSettings]);

  // 通知スケジュールをService Workerに同期
  useEffect(() => {
    if (medications.length > 0 && Object.keys(notificationSettings).length > 0) {
      updateNotificationSchedules(medications, notificationSettings);
    }
  }, [medications, notificationSettings]);

  const handleNotification = useCallback((med) => {
    if (Notification.permission === 'granted') {
      const messageType = notificationSettings[med.id]?.messageType || 'default';
      const message = NOTIFICATION_MESSAGES[messageType] || NOTIFICATION_MESSAGES.default;
      showNotificationViaSW(message, {
        body: `${med.name}を${med.doseAmount} ${med.unit}服用してください`,
        icon: '/logo192.png',
        badge: '/favicon-32x32.png',
        vibrate: [200, 100, 200, 100, 200],
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

  const handlePrnLog = useCallback(async (medId) => {
    try {
      const now = new Date();
      const timestamp = now.toISOString();
      await api.post('/api/prn-log', {
        medicationId: medId,
        timestamp,
        date: today,
      });
      setPrnLogs((prev) => ({
        ...prev,
        [medId]: [...(prev[medId] || []), { timestamp, date: today }],
      }));
    } catch {
      // ignore
    }
  }, [today]);

  const handleDeletePrnLog = useCallback(async (medId, timestamp) => {
    try {
      await api.delete('/api/prn-log', { medicationId: medId, timestamp });
      setPrnLogs((prev) => ({
        ...prev,
        [medId]: (prev[medId] || []).filter((log) => log.timestamp !== timestamp),
      }));
    } catch {
      // ignore
    }
  }, []);

  const takenCount = takenMeds.length;
  const totalCount = scheduledMeds.length;
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
        <div className="today-meds__title-row">
          <h1 className="page-title">今日のお薬</h1>
          <div className="today-meds__links">
            <Link to="/records" className="today-meds__link" aria-label="記録">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </Link>
            <Link to="/data" className="today-meds__link" aria-label="データ管理">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v18" />
                <rect x="4" y="8" width="6" height="7" rx="1" />
                <rect x="14" y="5" width="6" height="10" rx="1" />
              </svg>
            </Link>
          </div>
        </div>
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
        <>
          {scheduledMeds.length > 0 && (
            <div className="med-list">
              {scheduledMeds.map((med) => (
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

          {prnMeds.length > 0 && (
            <div className="prn-section">
              <h2 className="prn-section__title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 8v4l3 3" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
                頓服薬
              </h2>
              <div className="prn-list">
                {prnMeds.map((med) => {
                  const logs = prnLogs[med.id] || [];
                  return (
                    <div key={med.id} className="prn-card">
                      <div className="prn-card__header">
                        <div className="prn-card__info">
                          <h3 className="prn-card__name">{med.name}</h3>
                          <p className="prn-card__dose">1回 {med.doseAmount} {med.unit}</p>
                        </div>
                        <button
                          className="prn-card__log-btn"
                          onClick={() => handlePrnLog(med.id)}
                        >
                          服用した
                        </button>
                      </div>
                      {logs.length > 0 && (
                        <div className="prn-card__logs">
                          <p className="prn-card__logs-title">今日の服用記録（{logs.length}回）</p>
                          <ul className="prn-card__log-list">
                            {logs.map((log) => (
                              <li key={log.timestamp} className="prn-card__log-item">
                                <span className="prn-card__log-time">
                                  {new Date(log.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <button
                                  className="prn-card__log-delete"
                                  onClick={() => handleDeletePrnLog(med.id, log.timestamp)}
                                  aria-label="この記録を削除"
                                  title="削除"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                  </svg>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TodayMeds;
