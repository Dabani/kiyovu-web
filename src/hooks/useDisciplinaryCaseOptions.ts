import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useDisciplinaryCaseOptions() {
  return useQuery({
    queryKey: ['disciplinary-cases-picker'],
    queryFn: async () => {
      const { data } = await api.get('/disciplinary-cases', { params: { per_page: 200 } });
      return data.data.map((c: { id: number; respondent_name: string; initiated_on: string }) => ({
        value: String(c.id),
        label: `${c.respondent_name} (${c.initiated_on})`,
      }));
    },
    staleTime: 60 * 1000,
  });
}
