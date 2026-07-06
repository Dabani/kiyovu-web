import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useCandidateOptions() {
  return useQuery({
    queryKey: ['recruitment-candidates-picker'],
    queryFn: async () => {
      const { data } = await api.get('/recruitment-candidates', { params: { per_page: 200 } });
      return data.data.map((c: { id: number; full_name: string; vacancy_title: string }) => ({
        value: String(c.id),
        label: `${c.full_name} — ${c.vacancy_title}`,
      }));
    },
    staleTime: 60 * 1000,
  });
}
