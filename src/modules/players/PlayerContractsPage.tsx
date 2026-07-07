import { useState } from 'react';
import { Modal, TextInput, Select, Textarea, Button, Group, Stack, Title, Badge, NumberInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';
import { usePlayerOptions } from '../../hooks/usePlayerOptions';

const ENDPOINT = '/player-contracts';

interface Contract {
  id: number;
  term_start: string;
  term_end: string;
  base_salary_rwf: number;
  ceo_signed_on: string | null;
  sporting_director_signed_on: string | null;
  status_id: number;
  player?: { label: string };
  status?: { label_en: string };
}

export function PlayerContractsPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<Contract>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const statuses = useLookupSelect('statuses', i18n.language);
  const players = usePlayerOptions();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Contract | null>(null);

  const form = useForm({
    initialValues: {
      player_id: '', term_start: '', term_end: '', base_salary_rwf: '', bonuses_notes: '',
      benefits_notes: '', player_obligations: '', organisation_obligations: '', termination_grounds: '',
      dispute_resolution_mechanism: '', status_id: '', ceo_signed_on: '', sporting_director_signed_on: '',
    },
    validate: {
      player_id: (v) => (v ? null : 'Required'),
      term_start: (v) => (v ? null : 'Required'),
      term_end: (v) => (v ? null : 'Required'),
      base_salary_rwf: (v) => (v !== '' ? null : 'Required'),
      player_obligations: (v) => (v ? null : 'Required'),
      organisation_obligations: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: Contract) {
    setEditing(row);
    form.setValues({
      player_id: '', term_start: row.term_start, term_end: row.term_end, base_salary_rwf: String(row.base_salary_rwf),
      bonuses_notes: '', benefits_notes: '', player_obligations: '', organisation_obligations: '',
      termination_grounds: '', dispute_resolution_mechanism: '', status_id: String(row.status_id),
      ceo_signed_on: row.ceo_signed_on ?? '', sporting_director_signed_on: row.sporting_director_signed_on ?? '',
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      update.mutate(
        {
          id: editing.id,
          payload: {
            ceo_signed_on: values.ceo_signed_on || null, sporting_director_signed_on: values.sporting_director_signed_on || null,
            status_id: values.status_id,
          },
        },
        { onSuccess: () => setModalOpen(false) }
      );
    } else {
      create.mutate(values, { onSuccess: () => setModalOpen(false) });
    }
  }

  async function handleReport(period: ReportPeriod) {
    await downloadReport(ENDPOINT, { period: period.kind });
  }

  const columns: DataTableColumn<Contract>[] = [
    { key: 'player', header: 'Player', render: (r) => r.player?.label ?? '—', exportValue: (r) => r.player?.label ?? '' },
    { key: 'term_start', header: 'Term Start' },
    { key: 'term_end', header: 'Term End' },
    { key: 'base_salary_rwf', header: 'Base Salary (RWF)' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">PLAYER-001 — Player Contracts</Title>
      <DataTable<Contract>
        title="Player Contracts"
        moduleKey="player-contracts"
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Contract' : 'New Player Contract (PLAYER-001)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <Select label="Player" data={players.data ?? []} required searchable {...form.getInputProps('player_id')} />
                <Group grow>
                  <TextInput type="date" label="Term Start" required {...form.getInputProps('term_start')} />
                  <TextInput type="date" label="Term End" required {...form.getInputProps('term_end')} />
                </Group>
                <NumberInput label="Base Salary (RWF, monthly)" required min={0} {...form.getInputProps('base_salary_rwf')} />
                <Textarea label="Bonuses" minRows={2} {...form.getInputProps('bonuses_notes')} />
                <Textarea label="Benefits" minRows={2} {...form.getInputProps('benefits_notes')} />
                <Textarea label="Player Obligations" required minRows={2} {...form.getInputProps('player_obligations')} />
                <Textarea label="Organisation Obligations" required minRows={2} {...form.getInputProps('organisation_obligations')} />
                <Textarea label="Termination Grounds" minRows={2} {...form.getInputProps('termination_grounds')} />
                <Textarea label="Dispute Resolution Mechanism" minRows={2} {...form.getInputProps('dispute_resolution_mechanism')} />
              </>
            )}
            {editing && (
              <Group grow>
                <TextInput type="date" label="CEO Signed On" {...form.getInputProps('ceo_signed_on')} />
                <TextInput type="date" label="Sporting Director Signed On" {...form.getInputProps('sporting_director_signed_on')} />
              </Group>
            )}
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
