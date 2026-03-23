import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

export function useMedications() {
  const queryClient = useQueryClient();
  const { data: medications = [], isLoading: loading, error } = useQuery({
    queryKey: ['medications'],
    queryFn: () => api.get('/api/medications'),
  });

  const setMedications = (updater) => {
    queryClient.setQueryData(['medications'], (prev) =>
      typeof updater === 'function' ? updater(prev || []) : updater
    );
  };

  const refetch = () => queryClient.invalidateQueries({ queryKey: ['medications'] });

  return { medications, setMedications, loading, error: error?.message || null, refetch };
}

export function useMedicationHistory() {
  const { data: history = [], isLoading: loading, error } = useQuery({
    queryKey: ['medicationHistory'],
    queryFn: () => api.get('/api/medicationHistory'),
  });

  return { history, loading, error: error?.message || null };
}
