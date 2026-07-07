import { useState } from 'react';
import { Modal, Select, Textarea, Checkbox, Button, Group, Stack, Title, Badge, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';
import { usePlayerOptions } from '../../hooks/usePlayerOptions';

const ENDPOINT = '/anti-doping-declarations';

interface Declaration {
  id: number;
  declaration_date: string;
  wada_list_acknowledged: boolean;
  tue_application_filed: boolean;
  status_id: number;
  player?: { label: string };
  status?: { label_en: string };
}

export function AntiDopingDeclarationsPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<Declaration>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const statuses = useLookupSelect('statuses', i18n.language);
  const players = usePlayerOptions();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Declaration | null>(null);

  const form = useForm({
    initialValues: { player_id: '', declaration_date: '', wada_list_acknowledged: false, tue_application_filed: false, tue_notes: '', status_id: '' },
    validate: {
      player_id: (v) => (v ? null : 'Required'),
      declaration_date: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: Declaration) {
    setEditing(row);
    form.setValues({
      player_id: '', declaration_date: row.declaration_date, wada_list_acknowledged: row.wada_list_acknowledged,
      tue_application_filed: row.tue_application_filed, tue_notes: '', status_id: String(row.status_id),
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      update.mutate(
        { id: editing.id, payload: { tue_application_filed: values.tue_application_filed, tue_notes: values.tue_notes || null, status_id: values.status_id } },
        { onSuccess: () => setModalOpen(false) }
      );
    } else {
      create.mutate(values, { onSuccess: () => setModalOpen(false) });
    }
  }

  async function handleReport(period: ReportPeriod) {
    await downloadReport(ENDPOINT, { period: period.kind });
  }

  const columns: DataTableColumn<Declaration>[] = [
    { key: 'player', header: 'Player', render: (r) => r.player?.label ?? '—', exportValue: (r) => r.player?.label ?? '' },
    { key: 'declaration_date', header: 'Declaration Date' },
    {
      key: 'wada_list_acknowledged', header: 'WADA List Acknowledged',
      render: (r) => (r.wada_list_acknowledged ? <Badge color="kiyovuGreen">Yes</Badge> : <Badge color="gray">No</Badge>),
      exportValue: (r) => (r.wada_list_acknowledged ? 'Yes' : 'No'),
    },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">PLAYER-004 — Anti-Doping Declarations</Title>
      <DataTable<Declaration>
        title="Anti-Doping Declarations"
        moduleKey="anti-doping-declarations"
        columns={columns}
        rows={list.rows}
        totalCount={list.totalCount}
        page={list.page}
        pageSize={list.pageSize}
        loading={list.loading}
        search={list.search}
        onSearchChange={list.onSearchChange}
        onPageChange={list.setPage}
        filters={[{ key: 'status_id', label: 'Status', options: statuses.data }]}
        activeFilters={list.filters}
        onFilterChange={list.onFilterChange}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={(row) => list.deleteRow(row.id)}
        onGenerateReport={handleReport}
      />

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Declaration' : 'New Anti-Doping Declaration (PLAYER-004)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <Select label="Player" data={players.data ?? []} required searchable {...form.getInputProps('player_id')} />
                <TextInput type="date" label="Declaration Date" required {...form.getInputProps('declaration_date')} />
                <Checkbox label="WADA Prohibited List acknowledged" {...form.getInputProps('wada_list_acknowledged', { type: 'checkbox' })} />
              </>
            )}
            <Checkbox label="TUE (Therapeutic Use Exemption) application filed" {...form.getInputProps('tue_application_filed', { type: 'checkbox' })} />
            {form.values.tue_application_filed && <Textarea label="TUE Notes" minRows={2} {...form.getInputProps('tue_notes')} />}
            <Select label="Status" data={statuses.data} required {...form.getInputProps('status_id')} />
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
