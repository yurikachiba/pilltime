import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useMedications } from '../hooks/useMedications';
import { NOTIFICATION_MESSAGES } from '../constants';
import { requestNotificationPermission, updateNotificationSchedules, showNotificationViaSW } from '../notifications';
import { api } from '../api/client';
import { getScheduledMedsForDate } from '../utils/expandMedications';
import MedicationCard from '../components/MedicationCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

// iOSでSafari以外のブラウザを検出
function isIOSNonSafari() {
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  // iOSのSafariは "Safari" を含むが "CriOS"(Chrome) や "FxiOS"(Firefox) を含まない
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
  return isIOS && !isSafari;
}

// iOSでPWAとしてインストール済みかどうか
function isIOSStandalone() {
  return window.navigator.standalone === true;
}

// 記録からスケジュール薬の服用/スキップ状態を判定
function findRecord(records, name, time, status) {
  return records.find((r) =>
    r.name === name && r.time === (time || '') && r.status === status && r.type === 'scheduled'
  );
}

const TodayMeds = () => {
  const { medications, setMedications, loading, error, refetch } = useMedications();
  const navigate = useNavigate();
  const [notificationSettings, setNotificationSettings] = useState(() => {
    const saved = localStorage.getItem('pilltime_notification_settings');
    return saved ? JSON.parse(saved) : {};
  });
  const [records, setRecords] = useState([]);
  const [prnTimeInputs, setPrnTimeInputs] = useState({});
  const [showSafariBanner, setShowSafariBanner] = useState(() => {
    if (isIOSStandalone()) return false;
    if (localStorage.getItem('pilltime_safari_banner_dismissed')) return false;
    return isIOSNonSafari();
  });

  const today = new Date().toISOString().split('T')[0];

  // 今日の記録を取得
  const { data: dayData } = useQuery({
    queryKey: ['dayDetails', today],
    queryFn: () => api.get(`/api/day-details/${today}`),
  });

  useEffect(() => {
    if (dayData) setRecords(dayData.records || []);
  }, [dayData]);

  // 定時薬を時間ごとに展開 + 今日対象のもののみ + 時間順ソート
  const scheduledMeds = getScheduledMedsForDate(medications, today);
  const prnMeds = medications.filter((med) => med.frequency === 'prn');

  // 頓服の今日の記録
  const prnRecordsToday = records.filter((r) => r.type === 'prn');

  useEffect(() => {
    if (scheduledMeds.length > 0 || prnMeds.length > 0) {
      setNotificationSettings((prev) => {
        const updated = { ...prev };
        let changed = false;
        const allMeds = [...scheduledMeds, ...prnMeds];
        for (const med of allMeds) {
          if (!updated[med.id]) {
            updated[med.id] = { on: true, messageType: 'default' };
            changed = true;
          }
        }
        return changed ? updated : prev;
      });
    }
  }, [scheduledMeds, prnMeds]);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Service Workerからの服用通知を受け取る
  useEffect(() => {
    const handler = async (event) => {
      const { medId } = event.detail;
      // 薬情報を取得して記録を作成
      const allMeds = await api.get('/api/medications');
      const med = allMeds.find((m) => m.id === medId);
      if (med && !findRecord(records, med.name, med.time || '', 'taken')) {
        const record = await api.post('/api/record', {
          date: today,
          name: med.name,
          doseAmount: med.doseAmount,
          unit: med.unit,
          time: med.time || '',
          status: 'taken',
          type: 'scheduled',
        });
        setRecords((prev) => [...prev, record]);
      }
    };
    window.addEventListener('med-taken-from-notification', handler);
    return () => window.removeEventListener('med-taken-from-notification', handler);
  }, [today, records]);

  useEffect(() => {
    if (Object.keys(notificationSettings).length > 0) {
      localStorage.setItem('pilltime_notification_settings', JSON.stringify(notificationSettings));
    }
  }, [notificationSettings]);

  useEffect(() => {
    if (medications.length > 0 && Object.keys(notificationSettings).length > 0) {
      updateNotificationSchedules(medications, notificationSettings);
    }
  }, [medications, notificationSettings]);

  const handleNotification = useCallback((med) => {
    if (Notification.permission === 'granted') {
      const messageType = notificationSettings[med.id]?.messageType || 'default';
      const message = NOTIFICATION_MESSAGES[messageType] || NOTIFICATION_MESSAGES.default;
      const dose = med.doseAmounts ? med.doseAmounts.join('/') : med.doseAmount;
      showNotificationViaSW(`${med.name} ${dose}${med.unit}`, {
        body: message,
        icon: '/logo192.png',
        badge: '/favicon-32x32.png',
        vibrate: [200, 100, 200, 100, 300],
        requireInteraction: true,
        silent: false,
        actions: [
          { action: 'take', title: '飲んだ' },
        ],
        data: { medId: med.id, url: '/' },
      });
    }
  }, [notificationSettings]);

  const toggleNotification = useCallback((id) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [id]: { ...prev[id], on: !prev[id]?.on },
    }));
  }, []);

  const handleTimeChange = useCallback(async (id, event) => {
    const newTime = event.target.value;
    setMedications((prev) =>
      prev.map((med) => (med.id === id ? { ...med, time: newTime } : med))
    );
    const originalId = id.includes('_') ? id.split('_')[0] : id;
    const timeIndex = id.includes('_') ? Number(id.split('_')[1]) : 0;
    try {
      const allMeds = await api.get('/api/medications');
      const med = allMeds.find((m) => m.id === originalId);
      if (med) {
        const newSelectedTimes = [...(med.selectedTimes || [med.time])];
        newSelectedTimes[timeIndex] = newTime;
        const update = { selectedTimes: newSelectedTimes, time: newSelectedTimes[0] };
        await api.put(`/api/medications/${originalId}`, update);
      }
    } catch {
      // 無視
    }
  }, [setMedications]);

  const handleMessageTypeChange = useCallback((id, event) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [id]: { ...prev[id], messageType: event.target.value },
    }));
  }, []);

  const handleMarkTaken = useCallback(async (med) => {
    const existing = findRecord(records, med.name, med.time || '', 'taken');
    if (existing) {
      // 取り消し
      await api.delete('/api/record', { date: today, recordId: existing.id });
      setRecords((prev) => prev.filter((r) => r.id !== existing.id));
    } else {
      // スキップ記録があれば先に削除
      const skipRecord = findRecord(records, med.name, med.time || '', 'skipped');
      if (skipRecord) {
        await api.delete('/api/record', { date: today, recordId: skipRecord.id });
        setRecords((prev) => prev.filter((r) => r.id !== skipRecord.id));
      }
      // 服用記録を追加
      const record = await api.post('/api/record', {
        date: today,
        name: med.name,
        doseAmount: med.doseAmount,
        unit: med.unit,
        time: med.time || '',
        status: 'taken',
        type: 'scheduled',
      });
      setRecords((prev) => [...prev, record]);
    }
  }, [records, today]);

  const handleSkip = useCallback(async (med) => {
    const existing = findRecord(records, med.name, med.time || '', 'skipped');
    if (existing) {
      await api.delete('/api/record', { date: today, recordId: existing.id });
      setRecords((prev) => prev.filter((r) => r.id !== existing.id));
    } else {
      // 服用記録があれば先に削除
      const takenRecord = findRecord(records, med.name, med.time || '', 'taken');
      if (takenRecord) {
        await api.delete('/api/record', { date: today, recordId: takenRecord.id });
        setRecords((prev) => prev.filter((r) => r.id !== takenRecord.id));
      }
      const record = await api.post('/api/record', {
        date: today,
        name: med.name,
        doseAmount: med.doseAmount,
        unit: med.unit,
        time: med.time || '',
        status: 'skipped',
        type: 'scheduled',
      });
      setRecords((prev) => [...prev, record]);
    }
  }, [records, today]);

  const handleMarkAllTaken = useCallback(async () => {
    const allTaken = scheduledMeds.every((m) => findRecord(records, m.name, m.time || '', 'taken'));
    if (allTaken) {
      // 全取り消し
      const takenRecords = records.filter((r) => r.type === 'scheduled' && r.status === 'taken');
      for (const rec of takenRecords) {
        await api.delete('/api/record', { date: today, recordId: rec.id });
      }
      setRecords((prev) => prev.filter((r) => !(r.type === 'scheduled' && r.status === 'taken')));
    } else {
      // 未服用の薬を全て服用にする
      const newRecords = [];
      for (const med of scheduledMeds) {
        if (!findRecord(records, med.name, med.time || '', 'taken')) {
          // スキップがあれば削除
          const skipRecord = findRecord(records, med.name, med.time || '', 'skipped');
          if (skipRecord) {
            await api.delete('/api/record', { date: today, recordId: skipRecord.id });
          }
          const record = await api.post('/api/record', {
            date: today,
            name: med.name,
            doseAmount: med.doseAmount,
            unit: med.unit,
            time: med.time || '',
            status: 'taken',
            type: 'scheduled',
          });
          newRecords.push(record);
        }
      }
      setRecords((prev) => [
        ...prev.filter((r) => !(r.type === 'scheduled' && r.status === 'skipped')),
        ...newRecords,
      ]);
    }
  }, [scheduledMeds, records, today]);

  const handleDelete = useCallback(async (id) => {
    try {
      const originalId = id.includes('_') ? id.split('_')[0] : id;
      await api.delete(`/api/medications/${originalId}`);
      // 通知設定もクリーンアップ
      setNotificationSettings((prev) => {
        const updated = { ...prev };
        delete updated[originalId];
        Object.keys(updated).forEach((key) => {
          if (key.startsWith(`${originalId}_`)) delete updated[key];
        });
        return updated;
      });
      refetch();
    } catch {
      // 無視
    }
  }, [refetch]);

  const handleEdit = useCallback((med) => {
    const originalId = med._originalId || med.id;
    navigate(`/add-task?edit=${originalId}`);
  }, [navigate]);

  const handlePrnLog = useCallback(async (med) => {
    try {
      const inputTime = prnTimeInputs[med.id];
      let timestamp;
      if (inputTime) {
        const [h, m] = inputTime.split(':');
        const d = new Date();
        d.setHours(Number(h), Number(m), 0, 0);
        timestamp = d.toISOString();
      } else {
        timestamp = new Date().toISOString();
      }
      const record = await api.post('/api/record', {
        date: today,
        name: med.name,
        doseAmount: med.doseAmount,
        unit: med.unit,
        time: '',
        status: 'taken',
        type: 'prn',
        timestamp,
      });
      setRecords((prev) => [...prev, record]);
    } catch {
      // 無視
    }
  }, [today, prnTimeInputs]);

  const handleDeletePrnLog = useCallback(async (recordId) => {
    try {
      await api.delete('/api/record', { date: today, recordId });
      setRecords((prev) => prev.filter((r) => r.id !== recordId));
    } catch {
      // 無視
    }
  }, [today]);

  const isTaken = useCallback((med) => !!findRecord(records, med.name, med.time || '', 'taken'), [records]);
  const isSkipped = useCallback((med) => !!findRecord(records, med.name, med.time || '', 'skipped'), [records]);

  const takenCount = scheduledMeds.filter((m) => isTaken(m)).length;
  const skippedCount = scheduledMeds.filter((m) => isSkipped(m)).length;
  const totalCount = scheduledMeds.length;
  const handledCount = takenCount + skippedCount;
  const progress = totalCount > 0 ? Math.round((handledCount / totalCount) * 100) : 0;
  const allHandled = totalCount > 0 && handledCount === totalCount;

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

      {showSafariBanner && (
        <div className="safari-banner">
          <p className="safari-banner__text">
            通知を受け取るには、<strong>Safari</strong>でこのページを開いて「ホーム画面に追加」してください。
            iOSではSafari以外のブラウザでPWA通知が使えません。
          </p>
          <button
            className="safari-banner__close"
            onClick={() => {
              setShowSafariBanner(false);
              localStorage.setItem('pilltime_safari_banner_dismissed', '1');
            }}
            aria-label="閉じる"
          >
            &times;
          </button>
        </div>
      )}

      <div className="today-meds__header">
        <div className="today-meds__title-row">
          <h1 className="page-title">今日のお薬</h1>
          <div className="today-meds__links">
            <Link to="/records" className="today-meds__link" aria-label="記録">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span>記録</span>
            </Link>
            <Link to="/data" className="today-meds__link" aria-label="データ管理">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v18" />
                <rect x="4" y="8" width="6" height="7" rx="1" />
                <rect x="14" y="5" width="6" height="10" rx="1" />
              </svg>
              <span>データ</span>
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
          <p className="progress-bar__label">
            {takenCount}服用{skippedCount > 0 ? ` / ${skippedCount}スキップ` : ''} / {totalCount}件中 ({progress}%)
          </p>
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
            <>
              {scheduledMeds.length > 1 && (
                <button
                  type="button"
                  className={`btn btn--full ${allHandled ? 'btn--secondary' : 'btn--primary'}`}
                  style={{ marginBottom: '12px' }}
                  onClick={handleMarkAllTaken}
                >
                  {allHandled ? '全て取り消す' : '全部飲んだ'}
                </button>
              )}
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
                    onMarkTaken={() => handleMarkTaken(med)}
                    onSkip={() => handleSkip(med)}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    isTaken={isTaken(med)}
                    isSkipped={isSkipped(med)}
                  />
                ))}
              </div>
            </>
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
                  const logs = prnRecordsToday.filter((r) => r.name === med.name);
                  return (
                    <div key={med.id} className="prn-card">
                      <div className="prn-card__header">
                        <div className="prn-card__info">
                          <h3 className="prn-card__name">{med.name}</h3>
                          <p className="prn-card__dose">1回 {med.doseAmount} {med.unit}</p>
                        </div>
                        <div className="prn-card__controls">
                          <input
                            type="time"
                            className="prn-card__time-input"
                            value={prnTimeInputs[med.id] || ''}
                            onChange={(e) => setPrnTimeInputs((prev) => ({ ...prev, [med.id]: e.target.value }))}
                          />
                          <button
                            className="prn-card__log-btn"
                            onClick={() => handlePrnLog(med)}
                          >
                            {prnTimeInputs[med.id] ? `${prnTimeInputs[med.id]}に服用` : '今飲んだ'}
                          </button>
                          <button
                            type="button"
                            className="prn-card__edit-btn"
                            onClick={() => handleEdit(med)}
                          >
                            編集
                          </button>
                        </div>
                      </div>
                      {logs.length > 0 && (
                        <div className="prn-card__logs">
                          <p className="prn-card__logs-title">今日の服用記録（{logs.length}回）</p>
                          <ul className="prn-card__log-list">
                            {logs.map((log) => (
                              <li key={log.id} className="prn-card__log-item">
                                <span className="prn-card__log-time">
                                  {new Date(log.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <button
                                  className="prn-card__log-delete"
                                  onClick={() => handleDeletePrnLog(log.id)}
                                  aria-label="この記録を取消"
                                >
                                  取消
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
