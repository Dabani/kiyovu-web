import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useRoleOptions() {
  return useQuery({
    queryKey: ['roles-picker'],
    queryFn: async () => {
      const { data } = await api.get('/roles');
      return data.map((r: { id: number; name: string }) => ({ value: r.name, label: r.name }));
    },
    staleTime: 5 * 60 * 1000,
  });
}
