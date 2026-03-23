const STORAGE_KEYS = {
  medications: 'pilltime_medications',
  history: 'pilltime_history',
  dayDetails: 'pilltime_day_details',
};

function getStored(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function setStored(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// 既存データに doseAmount / timesPerDay がない場合の補完
function normalizeMedication(med) {
  const normalized = { ...med };
  if (normalized.doseAmount == null) {
    normalized.doseAmount = 1;
  }
  if (normalized.timesPerDay == null) {
    normalized.timesPerDay = (normalized.frequency === 'daily' && normalized.dose > 0)
      ? normalized.dose
      : undefined;
  }
  return normalized;
}

// --- マイグレーション: 旧データ → 新データ ---
// 旧: takenMeds_{DATE}, skippedMeds_{DATE}, pilltime_prn_logs (薬IDに紐づいた記録)
// 新: pilltime_day_details[date].records (薬から独立した自己完結型の記録)
function migrateToRecords() {
  if (localStorage.getItem('pilltime_migration_records_v1')) return;

  const medications = (getStored(STORAGE_KEYS.medications) || []).map(normalizeMedication);
  const medMap = {};
  for (const med of medications) {
    medMap[med.id] = med;
  }

  const today = new Date().toISOString().split('T')[0];
  const migratedRecords = [];

  // takenMeds_{DATE} と skippedMeds_{DATE} を変換
  const keysToProcess = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('takenMeds_') || key.startsWith('skippedMeds_'))) {
      keysToProcess.push(key);
    }
  }

  for (const key of keysToProcess) {
    const isTaken = key.startsWith('takenMeds_');
    const date = key.replace(/^(takenMeds_|skippedMeds_)/, '');
    const status = isTaken ? 'taken' : 'skipped';

    try {
      const ids = JSON.parse(localStorage.getItem(key)) || [];
      for (const id of ids) {
        // 展開ID（例: med_0, med_1）をパース
        const { originalId, timeIndex } = parseExpandedId(id, medMap);
        const med = medMap[originalId];

        migratedRecords.push({
          id: generateId(),
          name: med?.name || '不明な薬',
          doseAmount: med?.doseAmounts?.[timeIndex] ?? med?.doseAmount ?? 1,
          unit: med?.unit || '',
          time: med?.selectedTimes?.[timeIndex] || med?.time || '',
          status,
          type: 'scheduled',
          timestamp: new Date(`${date}T00:00:00`).toISOString(),
        });
      }
    } catch {
      // 無視
    }
  }

  // pilltime_prn_logs を変換
  const prnLogs = getStored('pilltime_prn_logs') || {};
  for (const [medId, logs] of Object.entries(prnLogs)) {
    const med = medMap[medId];
    for (const log of logs) {
      migratedRecords.push({
        id: generateId(),
        name: med?.name || '不明な薬',
        doseAmount: med?.doseAmount ?? 1,
        unit: med?.unit || '',
        time: '',
        status: 'taken',
        type: 'prn',
        timestamp: log.timestamp,
      });
    }
  }

  // 既存の dayDetails から takenMedications を削除し、mood/notes は保持
  const allDetails = getStored(STORAGE_KEYS.dayDetails) || {};
  for (const date of Object.keys(allDetails)) {
    delete allDetails[date].takenMedications;
    if (!allDetails[date].records) {
      allDetails[date].records = [];
    }
  }

  // 移行した記録はすべて今日の日付に格納
  if (migratedRecords.length > 0) {
    if (!allDetails[today]) allDetails[today] = {};
    allDetails[today].records = [
      ...(allDetails[today].records || []),
      ...migratedRecords,
    ];
  }

  setStored(STORAGE_KEYS.dayDetails, allDetails);
  localStorage.setItem('pilltime_migration_records_v1', 'true');
}

// 展開ID（例: "abc123_0"）を元のIDとtimeIndexにパース
function parseExpandedId(id, medMap) {
  if (medMap[id]) return { originalId: id, timeIndex: 0 };
  const match = id.match(/^(.+)_(\d+)$/);
  if (match && medMap[match[1]]) {
    return { originalId: match[1], timeIndex: Number(match[2]) };
  }
  return { originalId: id, timeIndex: 0 };
}

// アプリ起動時にマイグレーション実行
migrateToRecords();

async function localRequest(endpoint, options = {}) {
  const method = options.method || 'GET';
  const body = options.body && typeof options.body === 'object' ? options.body : options.body ? JSON.parse(options.body) : null;

  // GET /api/medications
  if (method === 'GET' && endpoint === '/api/medications') {
    return (getStored(STORAGE_KEYS.medications) || []).map(normalizeMedication);
  }

  // GET /api/medicationHistory
  if (method === 'GET' && endpoint === '/api/medicationHistory') {
    return getStored(STORAGE_KEYS.history) || [];
  }

  // GET /api/all-records（全日付の服用記録を集約して返す）
  if (method === 'GET' && endpoint === '/api/all-records') {
    const allDetails = getStored(STORAGE_KEYS.dayDetails) || {};
    const allRecords = [];
    for (const [date, dayData] of Object.entries(allDetails)) {
      if (dayData.records && dayData.records.length > 0) {
        for (const record of dayData.records) {
          allRecords.push({ ...record, date });
        }
      }
    }
    // 新しい順にソート
    allRecords.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    return allRecords;
  }

  // GET /api/day-details/:date
  if (method === 'GET' && endpoint.startsWith('/api/day-details/')) {
    const date = endpoint.replace('/api/day-details/', '');
    const allDetails = getStored(STORAGE_KEYS.dayDetails) || {};
    const dayData = allDetails[date] || {};
    const medications = (getStored(STORAGE_KEYS.medications) || []).map(normalizeMedication);
    return {
      mood: dayData.mood || 5,
      notes: dayData.notes || '',
      records: dayData.records || [],
      medications,
    };
  }

  // POST /api/tasks
  if (method === 'POST' && endpoint === '/api/tasks') {
    const medications = getStored(STORAGE_KEYS.medications) || [];
    const newMed = {
      id: generateId(),
      name: body.name,
      unit: body.unit,
      doseAmount: body.doseAmount || 1,
      doseAmounts: body.doseAmounts || null,
      frequency: body.frequency,
      selectedTimes: body.selectedTimes,
      time: body.selectedTimes?.[0] || '',
      createdAt: new Date().toISOString(),
    };
    if (body.frequency === 'daily') {
      newMed.timesPerDay = body.timesPerDay || 1;
    }
    if (body.frequency === 'weekly') {
      newMed.selectedDays = body.selectedDays || [];
    }
    if (body.frequency === 'interval') {
      newMed.intervalType = body.intervalType;
      newMed.intervalValue = body.intervalValue;
      if (body.intervalType === 'hour') {
        newMed.endTime = body.endTime;
      }
      if (body.intervalType === 'day') {
        newMed.startDate = body.startDate;
      }
    }
    if (body.frequency === 'prn') {
      newMed.selectedTimes = [];
      newMed.time = '';
    }
    medications.push(newMed);
    setStored(STORAGE_KEYS.medications, medications);

    const history = getStored(STORAGE_KEYS.history) || [];
    history.unshift({
      name: body.name,
      date: new Date().toISOString().split('T')[0],
    });
    setStored(STORAGE_KEYS.history, history);

    return newMed;
  }

  // POST /api/save-day-details（体調・メモのみ保存）
  if (method === 'POST' && endpoint === '/api/save-day-details') {
    const allDetails = getStored(STORAGE_KEYS.dayDetails) || {};
    if (!allDetails[body.date]) allDetails[body.date] = {};
    allDetails[body.date].mood = body.mood;
    allDetails[body.date].notes = body.notes;
    setStored(STORAGE_KEYS.dayDetails, allDetails);
    return { success: true };
  }

  // POST /api/record（服用記録を追加）
  if (method === 'POST' && endpoint === '/api/record') {
    const allDetails = getStored(STORAGE_KEYS.dayDetails) || {};
    if (!allDetails[body.date]) allDetails[body.date] = {};
    if (!allDetails[body.date].records) allDetails[body.date].records = [];
    const record = {
      id: generateId(),
      name: body.name,
      doseAmount: body.doseAmount,
      unit: body.unit,
      time: body.time || '',
      status: body.status,
      type: body.type || 'scheduled',
      timestamp: body.timestamp || new Date().toISOString(),
    };
    allDetails[body.date].records.push(record);
    setStored(STORAGE_KEYS.dayDetails, allDetails);
    return record;
  }

  // DELETE /api/record（服用記録を削除）
  if (method === 'DELETE' && endpoint === '/api/record') {
    const allDetails = getStored(STORAGE_KEYS.dayDetails) || {};
    const dayData = allDetails[body.date];
    if (dayData && dayData.records) {
      dayData.records = dayData.records.filter((r) => r.id !== body.recordId);
      setStored(STORAGE_KEYS.dayDetails, allDetails);
    }
    return { success: true };
  }

  // PUT /api/medications/:id
  if (method === 'PUT' && endpoint.startsWith('/api/medications/')) {
    const id = endpoint.replace('/api/medications/', '');
    const medications = getStored(STORAGE_KEYS.medications) || [];
    const index = medications.findIndex((m) => m.id === id);
    if (index === -1) throw new Error('Medication not found');
    medications[index] = { ...medications[index], ...body, id };
    setStored(STORAGE_KEYS.medications, medications);
    return normalizeMedication(medications[index]);
  }

  // DELETE /api/medications/:id（記録は削除しない＝独立しているため）
  if (method === 'DELETE' && endpoint.startsWith('/api/medications/')) {
    const id = endpoint.replace('/api/medications/', '');
    const medications = (getStored(STORAGE_KEYS.medications) || []).filter((m) => m.id !== id);
    setStored(STORAGE_KEYS.medications, medications);
    return { success: true };
  }

  throw new Error(`Unknown endpoint: ${method} ${endpoint}`);
}

export const api = {
  get: (endpoint) => localRequest(endpoint),
  post: (endpoint, data) => localRequest(endpoint, { method: 'POST', body: data }),
  put: (endpoint, data) => localRequest(endpoint, { method: 'PUT', body: data }),
  delete: (endpoint, data) => localRequest(endpoint, { method: 'DELETE', body: data }),
};
