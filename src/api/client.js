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

async function localRequest(endpoint, options = {}) {
  const method = options.method || 'GET';
  const body = options.body && typeof options.body === 'object' ? options.body : options.body ? JSON.parse(options.body) : null;

  // GET /api/medications
  if (method === 'GET' && endpoint === '/api/medications') {
    return getStored(STORAGE_KEYS.medications) || [];
  }

  // GET /api/medicationHistory
  if (method === 'GET' && endpoint === '/api/medicationHistory') {
    return getStored(STORAGE_KEYS.history) || [];
  }

  // GET /api/day-details/:date
  if (method === 'GET' && endpoint.startsWith('/api/day-details/')) {
    const date = endpoint.replace('/api/day-details/', '');
    const allDetails = getStored(STORAGE_KEYS.dayDetails) || {};
    const dayData = allDetails[date] || {};
    const medications = getStored(STORAGE_KEYS.medications) || [];
    return {
      mood: dayData.mood || 5,
      notes: dayData.notes || '',
      medications,
      takenMedications: dayData.takenMedications || [],
    };
  }

  // POST /api/tasks
  if (method === 'POST' && endpoint === '/api/tasks') {
    const medications = getStored(STORAGE_KEYS.medications) || [];
    const newMed = {
      id: generateId(),
      name: body.name,
      unit: body.unit,
      dose: body.selectedDosage,
      doseAmount: body.doseAmount || 1,
      frequency: body.frequency,
      selectedDays: body.selectedDays,
      selectedTimes: body.selectedTimes,
      intervalType: body.intervalType,
      intervalValue: body.intervalValue,
      endTime: body.endTime,
      startDate: body.startDate,
      time: body.selectedTimes?.[0] || '',
      createdAt: new Date().toISOString(),
    };
    medications.push(newMed);
    setStored(STORAGE_KEYS.medications, medications);

    // 履歴にも追加
    const history = getStored(STORAGE_KEYS.history) || [];
    history.unshift({
      name: body.name,
      date: new Date().toISOString().split('T')[0],
    });
    setStored(STORAGE_KEYS.history, history);

    return newMed;
  }

  // POST /api/save-day-details
  if (method === 'POST' && endpoint === '/api/save-day-details') {
    const allDetails = getStored(STORAGE_KEYS.dayDetails) || {};
    allDetails[body.date] = {
      mood: body.mood,
      notes: body.notes,
      takenMedications: body.takenMedications,
    };
    setStored(STORAGE_KEYS.dayDetails, allDetails);
    return { success: true };
  }

  // DELETE /api/medications/:id
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
  delete: (endpoint) => localRequest(endpoint, { method: 'DELETE' }),
};
