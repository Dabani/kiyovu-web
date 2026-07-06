import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface LookupOption {
  id: number;
  code: string;
  label_en: string;
  label_fr: string;
  label_rw: string;
}

/**
 * Fetches a dropdown's options straight from its dedicated lu_* table via
 * GET /api/lookups/{key}. No hardcoded option lists anywhere in the app —
 * new values added in the DB (e.g. a new fee tier) show up with zero
 * frontend changes.
 */
export function useLookup(key: string, appliesTo?: string) {
  return useQuery<LookupOption[]>({
    queryKey: ['lookup', key, appliesTo],
    queryFn: async () => {
      const { data } = await api.get(`/lookups/${key}`, {
        params: appliesTo ? { applies_to: appliesTo } : undefined,
      });
      return data;
    },
    staleTime: 5 * 60 * 1000, // lookups change rarely; 5 min cache is safe
  });
}

/** Converts lookup rows into Mantine Select-ready { value, label } pairs, in the active locale. */
export function toSelectData(options: LookupOption[] | undefined, locale: string) {
  if (!options) return [];
  const field = `label_${locale}` as keyof LookupOption;
  return options.map((o) => ({ value: String(o.id), label: (o[field] as string) ?? o.label_en }));
}

/** One-call convenience: fetches a lookup and returns it pre-shaped for a Mantine <Select>. */
export function useLookupSelect(key: string, locale: string, appliesTo?: string) {
  const query = useLookup(key, appliesTo);
  return { data: toSelectData(query.data, locale), isLoading: query.isLoading, raw: query.data };
}
