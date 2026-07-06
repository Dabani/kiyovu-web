import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useMemberOptions() {
  return useQuery({
    queryKey: ['members-picker'],
    queryFn: async () => {
      const { data } = await api.get('/members', { params: { per_page: 200 } });
      return data.data.map((m: { id: number; full_name: string }) => ({ value: String(m.id), label: m.full_name }));
    },
    staleTime: 60 * 1000,
  });
}
