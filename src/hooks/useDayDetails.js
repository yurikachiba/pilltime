import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export function useDayDetails(date) {
  const [mood, setMood] = useState(5);
  const [notes, setNotes] = useState('');
  const [medications, setMedications] = useState([]);
  const [takenMedications, setTakenMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!date) return;
    async function fetchDetails() {
      setLoading(true);
      try {
        const data = await api.get(`/api/day-details/${date}`);
        setNotes(data.notes || '');
        setMedications(data.medications || []);
        setTakenMedications(data.takenMedications || []);
        if (data.mood) setMood(data.mood);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [date]);

  const toggleMedication = useCallback((medicationId) => {
    setTakenMedications((prev) =>
      prev.includes(medicationId)
        ? prev.filter((id) => id !== medicationId)
        : [...prev, medicationId]
    );
  }, []);

  const save = useCallback(async () => {
    const data = { date, mood, notes, takenMedications };
    return api.post('/api/save-day-details', data);
  }, [date, mood, notes, takenMedications]);

  return {
    mood, setMood,
    notes, setNotes,
    medications,
    takenMedications, toggleMedication,
    loading, error,
    save,
  };
}
