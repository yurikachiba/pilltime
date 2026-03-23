import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export function useDayDetails(date) {
  const [mood, setMood] = useState(5);
  const [notes, setNotes] = useState('');
  const [takenMedications, setTakenMedications] = useState([]);

  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['dayDetails', date],
    queryFn: () => api.get(`/api/day-details/${date}`),
    enabled: !!date,
    onSuccess: (data) => {
      setNotes(data.notes || '');
      setTakenMedications(data.takenMedications || []);
      if (data.mood) setMood(data.mood);
    },
  });

  const medications = data?.medications || [];

  // onSuccessが非推奨の場合のフォールバック
  // data変更時にstateを同期
  const prevDateRef = { current: null };
  if (data && date !== prevDateRef.current) {
    prevDateRef.current = date;
    if (data.notes !== undefined && notes !== data.notes) setNotes(data.notes || '');
    if (data.takenMedications !== undefined) {
      const newTaken = data.takenMedications || [];
      if (JSON.stringify(newTaken) !== JSON.stringify(takenMedications)) {
        setTakenMedications(newTaken);
      }
    }
    if (data.mood && mood !== data.mood) setMood(data.mood);
  }

  const toggleMedication = useCallback((medicationId) => {
    setTakenMedications((prev) =>
      prev.includes(medicationId)
        ? prev.filter((id) => id !== medicationId)
        : [...prev, medicationId]
    );
  }, []);

  const save = useCallback(async () => {
    const payload = { date, mood, notes, takenMedications };
    return api.post('/api/save-day-details', payload);
  }, [date, mood, notes, takenMedications]);

  return {
    mood, setMood,
    notes, setNotes,
    medications,
    takenMedications, toggleMedication,
    loading, error: error?.message || null,
    save,
  };
}
