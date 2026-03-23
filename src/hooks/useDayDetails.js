import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export function useDayDetails(date) {
  const [mood, setMood] = useState(5);
  const [notes, setNotes] = useState('');
  const [records, setRecords] = useState([]);
  const syncedDateRef = useRef(null);

  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['dayDetails', date],
    queryFn: () => api.get(`/api/day-details/${date}`),
    enabled: !!date,
  });

  const medications = data?.medications || [];

  // dateが変わった時だけfetchデータをstateに同期
  useEffect(() => {
    if (data && date && syncedDateRef.current !== date) {
      syncedDateRef.current = date;
      setNotes(data.notes || '');
      setRecords(data.records || []);
      if (data.mood) setMood(data.mood);
    }
  }, [data, date]);

  // 定時薬の服用/スキップをトグル
  const toggleMedication = useCallback(async (med) => {
    const existing = records.find(
      (r) => r.name === med.name && r.time === (med.time || '') && r.status === 'taken' && r.type === 'scheduled'
    );
    if (existing) {
      await api.delete('/api/record', { date, recordId: existing.id });
      setRecords((prev) => prev.filter((r) => r.id !== existing.id));
    } else {
      const record = await api.post('/api/record', {
        date,
        name: med.name,
        doseAmount: med.doseAmount,
        unit: med.unit,
        time: med.time || '',
        status: 'taken',
        type: 'scheduled',
      });
      setRecords((prev) => [...prev, record]);
    }
  }, [date, records]);

  const save = useCallback(async () => {
    const payload = { date, mood, notes };
    return api.post('/api/save-day-details', payload);
  }, [date, mood, notes]);

  return {
    mood, setMood,
    notes, setNotes,
    medications,
    records,
    toggleMedication,
    loading, error: error?.message || null,
    save,
  };
}
