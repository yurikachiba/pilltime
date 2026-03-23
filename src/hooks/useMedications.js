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


export function useAllRecords() {
  const { data: records = [], isLoading: loading, error } = useQuery({
    queryKey: ['allRecords'],
    queryFn: () => api.get('/api/all-records'),
  });

  return { records, loading, error: error?.message || null };
}
