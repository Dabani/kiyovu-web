import { useState } from 'react';
import { Modal, Select, Textarea, TextInput, Button, Group, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { api } from '../../lib/api';

const ENDPOINT = '/honorary-nomination-dossiers';

interface Dossier {
  id: number;
  contributions_summary: string;
  justification: string;
  prepared_on: string;
  prepared_by_name: string;
  nomination?: { label: string };
}

function useNominationOptions() {
  return useQuery({
    queryKey: ['honorary-nominations-picker'],
    queryFn: async () => {
      const { data } = await api.get('/honorary-nominations', { params: { per_page: 200 } });
      return data.data.map((n: { id: number; nominee_name: string }) => ({ value: String(n.id), label: n.nominee_name }));
    },
    staleTime: 60 * 1000,
  });
}

export function HonoraryNominationDossiersPage() {
  const { t } = useTranslation();
  const list = useCrudList<Dossier>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const nominations = useNominationOptions();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Dossier | null>(null);

  const form = useForm({
    initialValues: { honorary_nomination_id: '', contributions_summary: '', justification: '', prepared_on: '', prepared_by_name: '' },
    validate: {
      honorary_nomination_id: (v) => (v ? null : 'Required'),
      contributions_summary: (v) => (v ? null : 'Required'),
      justification: (v) => (v ? null : 'Required'),
      prepared_on: (v) => (v ? null : 'Required'),
      prepared_by_name: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: Dossier) {
    setEditing(row);
    form.setValues({
      honorary_nomination_id: '', contributions_summary: row.contributions_summary,
      justification: row.justification, prepared_on: row.prepared_on, prepared_by_name: row.prepared_by_name,
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      const { honorary_nomination_id: _n, prepared_on: _d, ...editable } = values;
      update.mutate({ id: editing.id, payload: editable }, { onSuccess: () => setModalOpen(false) });
    } else {
      create.mutate(values, { onSuccess: () => setModalOpen(false) });
    }
  }

  async function handleReport(period: ReportPeriod) {
    await downloadReport(ENDPOINT, { period: period.kind });
  }

  const columns: DataTableColumn<Dossier>[] = [
    { key: 'nomination', header: 'Nominee', render: (r) => r.nomination?.label ?? '—', exportValue: (r) => r.nomination?.label ?? '' },
    { key: 'prepared_by_name', header: 'Prepared By' },
    { key: 'prepared_on', header: 'Prepared On' },
    { key: 'contributions_summary', header: 'Contributions Summary' },
  ];

  return (
    <>
      <Title order={2} mb="md">HON-002 — Honorary Nomination Dossiers</Title>
      <DataTable<Dossier>
        title="Nomination Dossiers"
        moduleKey="honorary-nomination-dossiers"
        columns={columns}
        rows={list.rows}
        totalCount={list.totalCount}
        page={list.page}
        pageSize={list.pageSize}
        loading={list.loading}
        search={list.search}
        onSearchChange={list.onSearchChange}
        onPageChange={list.setPage}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={(row) => list.deleteRow(row.id)}
        onGenerateReport={handleReport}
      />

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Dossier' : 'New Nomination Dossier (HON-002)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <Select label="Honorary Nomination" data={nominations.data ?? []} required searchable {...form.getInputProps('honorary_nomination_id')} />
                <TextInput type="date" label="Prepared On" required {...form.getInputProps('prepared_on')} />
              </>
            )}
            <TextInput label="Prepared By" required {...form.getInputProps('prepared_by_name')} />
            <Textarea label="Contributions Summary" required minRows={3} {...form.getInputProps('contributions_summary')} />
            <Textarea label="Justification" required minRows={3} {...form.getInputProps('justification')} />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
              <Button type="submit" color="kiyovuGreen" loading={create.isPending || update.isPending}>{t('common.save')}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
