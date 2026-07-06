import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { api } from '../lib/api';

export function useCrudMutations(endpoint: string) {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [endpoint] });

  const create = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post(endpoint, payload),
    onSuccess: () => {
      invalidate();
      notifications.show({ color: 'kiyovuGreen', message: 'Record created successfully.' });
    },
    onError: () => notifications.show({ color: 'red', message: 'Could not save the record.' }),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      api.put(`${endpoint}/${id}`, payload),
    onSuccess: () => {
      invalidate();
      notifications.show({ color: 'kiyovuGreen', message: 'Record updated successfully.' });
    },
    onError: () => notifications.show({ color: 'red', message: 'Could not save changes.' }),
  });

  return { create, update };
}

/** Triggers a browser download of a report PDF from a `{endpoint}/report` GET route. */
export async function downloadReport(endpoint: string, params: Record<string, unknown>) {
  const response = await api.get(`${endpoint}/report`, { params, responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'report.pdf');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
