import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDebouncedValue } from '@mantine/hooks';
import { api } from '../lib/api';

interface CrudListResult<T> {
  data: T[];
  total: number;
}

/**
 * One hook to back every module's list screen: GET {endpoint}?page=&search=&filters...
 * paired with delete mutation. Create/update forms use their own useMutation
 * per screen (payload shapes differ), but list + delete are identical everywhere.
 */
export function useCrudList<T>(endpoint: string, pageSize = 20) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string | null>>({});
  const [debouncedSearch] = useDebouncedValue(search, 350);
  const queryClient = useQueryClient();

  const query = useQuery<CrudListResult<T>>({
    queryKey: [endpoint, page, debouncedSearch, filters],
    queryFn: async () => {
      const { data } = await api.get(endpoint, {
        params: { page, per_page: pageSize, search: debouncedSearch || undefined, ...filters },
      });
      return { data: data.data, total: data.meta?.total ?? data.data.length };
    },
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`${endpoint}/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [endpoint] }),
  });

  function onSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function onFilterChange(key: string, value: string | null) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  return {
    rows: query.data?.data ?? [],
    totalCount: query.data?.total ?? 0,
    loading: query.isLoading || query.isFetching,
    page,
    pageSize,
    search,
    filters,
    setPage,
    onSearchChange,
    onFilterChange,
    deleteRow: deleteMutation.mutate,
    refetch: query.refetch,
  };
}
