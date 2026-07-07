import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useFanClubOptions() {
  return useQuery({
    queryKey: ['fan-clubs-picker'],
    queryFn: async () => {
      const { data } = await api.get('/fan-clubs', { params: { per_page: 200 } });
      return data.data.map((f: { id: number; proposed_name: string }) => ({
        value: String(f.id),
        label: f.proposed_name,
      }));
    },
    staleTime: 60 * 1000,
  });
}
