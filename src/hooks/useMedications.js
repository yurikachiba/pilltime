import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export function useMedications() {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMedications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/api/medications');
      setMedications(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedications();
  }, [fetchMedications]);

  return { medications, setMedications, loading, error, refetch: fetchMedications };
}

export function useMedicationHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const data = await api.get('/api/medicationHistory');
        setHistory(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  return { history, loading, error };
}
