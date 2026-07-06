import { useState } from 'react';
import { Modal, TextInput, Select, Textarea, Checkbox, Button, Group, Stack, Title, NumberInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useNominationOptions } from '../../hooks/useNominationOptions';

const ENDPOINT = '/election-tally-sheets';

interface TallySheet {
  id: number;
  election_date: string;
  votes_received: number;
  invalid_ballots_count: number;
  independent_observer_present: boolean;
  observer_names: string | null;
  nomination?: { candidate_full_name: string };
}

export function ElectionTallySheetsPage() {
  const { t } = useTranslation();
  const list = useCrudList<TallySheet>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const nominations = useNominationOptions();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TallySheet | null>(null);

  const form = useForm({
    initialValues: {
      nomination_id: '', election_date: '', votes_received: '', invalid_ballots_count: 0,
      independent_observer_present: false, observer_names: '',
    },
    validate: {
      nomination_id: (v) => (v ? null : 'Required'),
      election_date: (v) => (v ? null : 'Required'),
      votes_received: (v) => (v !== '' ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: TallySheet) {
    setEditing(row);
    form.setValues({
      nomination_id: '', election_date: row.election_date, votes_received: String(row.votes_received),
      invalid_ballots_count: row.invalid_ballots_count, independent_observer_present: row.independent_observer_present,
      observer_names: row.observer_names ?? '',
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      const { nomination_id: _n, election_date: _d, ...editable } = values;
      update.mutate({ id: editing.id, payload: editable }, { onSuccess: () => setModalOpen(false) });
    } else {
      create.mutate(values, { onSuccess: () => setModalOpen(false) });
    }
  }

  async function handleReport(period: ReportPeriod) {
    await downloadReport(ENDPOINT, { period: period.kind });
  }

  const columns: DataTableColumn<TallySheet>[] = [
    { key: 'nomination', header: 'Candidate', render: (r) => r.nomination?.candidate_full_name ?? '—', exportValue: (r) => r.nomination?.candidate_full_name ?? '' },
    { key: 'election_date', header: 'Election Date' },
    { key: 'votes_received', header: 'Votes Received' },
    { key: 'invalid_ballots_count', header: 'Invalid Ballots' },
  ];

  return (
    <>
      <Title order={2} mb="md">ELEC-002 — Tally Sheets</Title>
      <DataTable<TallySheet>
        title="Tally Sheets"
        moduleKey="election-tally-sheets"
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Tally Sheet' : 'New Tally Sheet (ELEC-002)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <Select label="Candidate (Nomination)" data={nominations.data ?? []} required searchable {...form.getInputProps('nomination_id')} />
                <TextInput type="date" label="Election Date" required {...form.getInputProps('election_date')} />
              </>
            )}
            <Group grow>
              <NumberInput label="Votes Received" required min={0} {...form.getInputProps('votes_received')} />
              <NumberInput label="Invalid Ballots (position total)" min={0} {...form.getInputProps('invalid_ballots_count')} />
            </Group>
            <Checkbox label="Independent observer present" {...form.getInputProps('independent_observer_present', { type: 'checkbox' })} />
            {form.values.independent_observer_present && (
              <Textarea label="Observer Names" minRows={2} {...form.getInputProps('observer_names')} />
            )}
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
