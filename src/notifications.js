// Service Worker 登録 & 通知スケジュール管理

let swRegistration = null;

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;

  try {
    swRegistration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    // controllerが使えるようになるまで待つ（skipWaiting + clients.claim の反映待ち）
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) => {
        navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
        // 5秒でタイムアウト
        setTimeout(resolve, 5000);
      });
    }

    // Service Workerにチェッカー開始を指示
    sendToSW({ type: 'START_CHECKER' });

    // Periodic Background Syncを登録（対応ブラウザのみ）
    try {
      if ('periodicSync' in swRegistration) {
        await swRegistration.periodicSync.register('check-medications', {
          minInterval: 60 * 1000, // 最短1分間隔
        });
      }
    } catch {
      // Periodic Sync非対応 or 権限なし - setIntervalフォールバックで対応
    }

    // 保存済みスケジュールがあればSWに即送信（controller確立後に確実に届ける）
    const saved = getSchedulesFromStorage();
    if (saved.length > 0) {
      sendToSW({ type: 'UPDATE_SCHEDULES', data: saved });
    }

    // アプリ復帰時にService Workerへ即時チェックを指示
    // iOSではSWのsetIntervalがバックグラウンドで停止するため、
    // 復帰時に見逃した通知をまとめて発火させる
    const triggerCheck = () => {
      sendToSW({ type: 'CHECK_NOW' });
    };
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') triggerCheck();
    });
    window.addEventListener('focus', triggerCheck);

    // Service Workerからのメッセージに応答
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'REQUEST_SCHEDULES') {
        const schedules = getSchedulesFromStorage();
        sendToSW({ type: 'SCHEDULES_RESPONSE', data: schedules });
      }

      // 通知から服用記録された場合、Reactコンポーネントに通知
      if (event.data?.type === 'MED_TAKEN_FROM_NOTIFICATION') {
        const medId = event.data.medId;
        window.dispatchEvent(new CustomEvent('med-taken-from-notification', { detail: { medId } }));
      }
    });

    return swRegistration;
  } catch (e) {
    return null;
  }
}

export function sendToSW(message) {
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage(message);
  } else if (swRegistration?.active) {
    // controllerがnullでもactiveなSWがあればそちらに送る
    swRegistration.active.postMessage(message);
  }
}

function getSchedulesFromStorage() {
  try {
    const raw = localStorage.getItem('pilltime_notification_schedules');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * お薬リストと通知設定からスケジュールを構築してService Workerに送る
 */
export function updateNotificationSchedules(medications, notificationSettings) {
  const schedules = [];

  for (const med of medications) {
    const settings = notificationSettings[med.id];
    if (!settings?.on) continue;

    const messageType = settings.messageType || 'default';
    const times = med.selectedTimes?.length > 0 ? med.selectedTimes : med.time ? [med.time] : [];

    for (const time of times) {
      if (!time) continue;
      const timeIndex = times.indexOf(time);
      const dose = med.doseAmounts?.[timeIndex] ?? med.doseAmount;
      schedules.push({
        medId: med.id,
        time,
        title: `${med.name} ${dose}${med.unit}`,
        body: getNotificationTitle(messageType),
      });
    }
  }

  // localStorageにも保存（Service Workerがバックグラウンドで読む用）
  localStorage.setItem('pilltime_notification_schedules', JSON.stringify(schedules));

  // Service Workerに即座に送信
  sendToSW({ type: 'UPDATE_SCHEDULES', data: schedules });

  return schedules;
}

function getNotificationTitle(messageType) {
  const titles = {
    default: 'お薬の時間です',
    reminder: 'お薬を忘れずに',
  };
  return titles[messageType] || titles.default;
}

/**
 * Service Worker経由で通知を表示（テスト通知用）
 */
export async function showNotificationViaSW(title, options) {
  if (!swRegistration) {
    swRegistration = await navigator.serviceWorker?.ready;
  }
  if (swRegistration) {
    return swRegistration.showNotification(title, options);
  }
}

/**
 * 通知権限を要求
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  return Notification.requestPermission();
}
