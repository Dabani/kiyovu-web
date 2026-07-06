import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useNominationOptions() {
  return useQuery({
    queryKey: ['election-nominations-picker'],
    queryFn: async () => {
      const { data } = await api.get('/election-nominations', { params: { per_page: 200 } });
      return data.data.map((n: { id: number; candidate_full_name: string; election_cycle_year: number }) => ({
        value: String(n.id),
        label: `${n.candidate_full_name} (${n.election_cycle_year})`,
      }));
    },
    staleTime: 60 * 1000,
  });
}
