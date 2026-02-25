// PillTime Service Worker - バックグラウンド通知 & PWAキャッシュ

const CACHE_NAME = 'pilltime-v1';

// プリキャッシュするアセット（CRAのビルド成果物はハッシュ付きなのでランタイムキャッシュで対応）
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
];

// インストール時にプリキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// アクティベート時に古いキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// fetchイベント: Network First（JS/CSS）、Cache First（静的アセット）
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // API呼び出しはキャッシュしない
  if (request.url.includes('/api/')) return;

  // ナビゲーションリクエスト（HTML）はNetwork First + オフラインフォールバック
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // その他の静的アセットはStale While Revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});

// ---------- 通知スケジューラ ----------

// スケジュールされた通知のチェック間隔 (ms)
const CHECK_INTERVAL = 30 * 1000; // 30秒ごとにチェック

let checkTimer = null;

function startNotificationChecker() {
  if (checkTimer) return;
  checkTimer = setInterval(() => {
    checkAndFireNotifications();
  }, CHECK_INTERVAL);
  // 起動直後もチェック
  checkAndFireNotifications();
}

function stopNotificationChecker() {
  if (checkTimer) {
    clearInterval(checkTimer);
    checkTimer = null;
  }
}

async function checkAndFireNotifications() {
  try {
    const allClients = await self.clients.matchAll({ type: 'window' });

    // スケジュールデータを取得するためにクライアントにメッセージを送る
    // クライアントがない場合はIndexedDBから直接読む
    if (allClients.length > 0) {
      allClients[0].postMessage({ type: 'REQUEST_SCHEDULES' });
    } else {
      // バックグラウンドでIndexedDBから読む
      const schedules = await getSchedulesFromIDB();
      await processSchedules(schedules);
    }
  } catch (e) {
    // エラーは静かに無視
  }
}

async function processSchedules(schedules) {
  if (!schedules || !Array.isArray(schedules) || schedules.length === 0) return;

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const today = now.toISOString().split('T')[0];

  const firedKey = `fired_${today}`;
  const fired = await getFromIDB(firedKey) || [];

  for (const schedule of schedules) {
    const fireId = `${schedule.medId}_${schedule.time}`;
    if (fired.includes(fireId)) continue;
    if (schedule.time !== currentTime) continue;

    await self.registration.showNotification(schedule.title, {
      body: schedule.body,
      icon: '/logo192.png',
      badge: '/favicon-32x32.png',
      tag: fireId,
      vibrate: [200, 100, 200, 100, 200],
      requireInteraction: true,
      data: { medId: schedule.medId, url: '/' },
    });

    fired.push(fireId);
    await saveToIDB(firedKey, fired);
  }
}

// ---------- IndexedDB ヘルパー ----------

function openIDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('pilltime_sw', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('kv')) {
        db.createObjectStore('kv');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getFromIDB(key) {
  const db = await openIDB();
  return new Promise((resolve) => {
    const tx = db.transaction('kv', 'readonly');
    const store = tx.objectStore('kv');
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

async function saveToIDB(key, value) {
  const db = await openIDB();
  return new Promise((resolve) => {
    const tx = db.transaction('kv', 'readwrite');
    const store = tx.objectStore('kv');
    store.put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

async function getSchedulesFromIDB() {
  return (await getFromIDB('notification_schedules')) || [];
}

// ---------- メッセージハンドラ ----------

self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};

  if (type === 'UPDATE_SCHEDULES') {
    // スケジュールデータをIDBに保存
    saveToIDB('notification_schedules', data);
  }

  if (type === 'SCHEDULES_RESPONSE') {
    // クライアントからの応答もIDBに保存しておく（次回バックグラウンドで使えるように）
    saveToIDB('notification_schedules', data);
    processSchedules(data);
  }

  if (type === 'START_CHECKER') {
    startNotificationChecker();
  }

  if (type === 'STOP_CHECKER') {
    stopNotificationChecker();
  }

  if (type === 'RESET_FIRED') {
    const today = new Date().toISOString().split('T')[0];
    saveToIDB(`fired_${today}`, []);
  }
});

// 通知クリック
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// 起動時にチェッカーを開始
startNotificationChecker();
