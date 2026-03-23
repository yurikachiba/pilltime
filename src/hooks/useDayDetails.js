import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export function useDayDetails(date) {
  const [mood, setMood] = useState(5);
  const [notes, setNotes] = useState('');
  const [takenMedications, setTakenMedications] = useState([]);
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
      setTakenMedications(data.takenMedications || []);
      if (data.mood) setMood(data.mood);
    }
  }, [data, date]);

  const toggleMedication = useCallback((medicationId) => {
    setTakenMedications((prev) => {
      const updated = prev.includes(medicationId)
        ? prev.filter((id) => id !== medicationId)
        : [...prev, medicationId];
      // takenMeds_{DATE} にも即座に同期（今日のお薬・カレンダーとの整合性）
      if (date) {
        localStorage.setItem(`takenMeds_${date}`, JSON.stringify(updated));
        try {
          const allDetails = JSON.parse(localStorage.getItem('pilltime_day_details') || '{}');
          if (!allDetails[date]) allDetails[date] = {};
          allDetails[date].takenMedications = updated;
          localStorage.setItem('pilltime_day_details', JSON.stringify(allDetails));
        } catch {
          // ignore
        }
      }
      return updated;
    });
  }, [date]);

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
