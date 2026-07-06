import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useAssetOptions() {
  return useQuery({
    queryKey: ['asset-register-picker'],
    queryFn: async () => {
      const { data } = await api.get('/asset-register', { params: { per_page: 200 } });
      return data.data.map((a: { id: number; asset_tag: string; description: string }) => ({
        value: String(a.id),
        label: `${a.asset_tag} — ${a.description}`,
      }));
    },
    staleTime: 60 * 1000,
  });
}
