import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function usePlayerOptions() {
  return useQuery({
    queryKey: ['players-picker'],
    queryFn: async () => {
      const { data } = await api.get('/players', { params: { per_page: 200 } });
      return data.data.map((p: { id: number; full_name: string; is_minor: boolean }) => ({
        value: String(p.id),
        label: `${p.full_name}${p.is_minor ? ' (Minor)' : ''}`,
      }));
    },
    staleTime: 60 * 1000,
  });
}
