import { useState } from 'react';
import { Modal, TextInput, Select, Textarea, Checkbox, Button, Group, Stack, Title, Badge, NumberInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';
import { usePlayerOptions } from '../../hooks/usePlayerOptions';

const ENDPOINT = '/player-loan-agreements';

interface LoanAgreement {
  id: number;
  counterparty_club_name: string;
  start_date: string;
  end_date: string;
  executive_organ_approved: boolean;
  board_notified: boolean;
  status_id: number;
  player?: { label: string };
  direction?: { label_en: string };
  status?: { label_en: string };
}

export function PlayerLoanAgreementsPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<LoanAgreement>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const directions = useLookupSelect('loan-directions', i18n.language);
  const statuses = useLookupSelect('statuses', i18n.language);
  const players = usePlayerOptions();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LoanAgreement | null>(null);

  const form = useForm({
    initialValues: {
      player_id: '', direction_id: '', counterparty_club_name: '', start_date: '', end_date: '',
      compensation_rwf: '', obligations_notes: '', recall_provisions: '', status_id: '',
      executive_organ_approved: false, board_notified: false,
    },
    validate: {
      player_id: (v) => (v ? null : 'Required'),
      direction_id: (v) => (v ? null : 'Required'),
      counterparty_club_name: (v) => (v ? null : 'Required'),
      start_date: (v) => (v ? null : 'Required'),
      end_date: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: LoanAgreement) {
    setEditing(row);
    form.setValues({
      player_id: '', direction_id: '', counterparty_club_name: row.counterparty_club_name,
      start_date: row.start_date, end_date: row.end_date, compensation_rwf: '', obligations_notes: '',
      recall_provisions: '', status_id: String(row.status_id),
      executive_organ_approved: row.executive_organ_approved, board_notified: row.board_notified,
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      update.mutate(
        {
          id: editing.id,
          payload: { executive_organ_approved: values.executive_organ_approved, board_notified: values.board_notified, status_id: values.status_id },
        },
        { onSuccess: () => setModalOpen(false) }
      );
    } else {
      create.mutate({ ...values, compensation_rwf: values.compensation_rwf || null }, { onSuccess: () => setModalOpen(false) });
    }
  }

  async function handleReport(period: ReportPeriod) {
    await downloadReport(ENDPOINT, { period: period.kind });
  }

  const columns: DataTableColumn<LoanAgreement>[] = [
    { key: 'player', header: 'Player', render: (r) => r.player?.label ?? '—', exportValue: (r) => r.player?.label ?? '' },
    { key: 'direction', header: 'Direction', render: (r) => r.direction?.label_en ?? '—', exportValue: (r) => r.direction?.label_en ?? '' },
    { key: 'counterparty_club_name', header: 'Counterparty Club' },
    { key: 'start_date', header: 'Start Date' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">PLAYER-003 — Loan Agreements</Title>
      <DataTable<LoanAgreement>
        title="Loan Agreements"
        moduleKey="player-loan-agreements"
        columns={columns}
        rows={list.rows}
        totalCount={list.totalCount}
        page={list.page}
        pageSize={list.pageSize}
        loading={list.loading}
        search={list.search}
        onSearchChange={list.onSearchChange}
        onPageChange={list.setPage}
        filters={[
          { key: 'direction_id', label: 'Direction', options: directions.data },
          { key: 'status_id', label: 'Status', options: statuses.data },
        ]}
        activeFilters={list.filters}
        onFilterChange={list.onFilterChange}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={(row) => list.deleteRow(row.id)}
        onGenerateReport={handleReport}
      />

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Loan' : 'New Loan Agreement (PLAYER-003)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <Select label="Player" data={players.data ?? []} required searchable {...form.getInputProps('player_id')} />
                <Group grow>
                  <Select label="Direction" data={directions.data} required {...form.getInputProps('direction_id')} />
                  <TextInput label="Counterparty Club" required {...form.getInputProps('counterparty_club_name')} />
                </Group>
                <Group grow>
                  <TextInput type="date" label="Start Date" required {...form.getInputProps('start_date')} />
                  <TextInput type="date" label="End Date" required {...form.getInputProps('end_date')} />
                </Group>
                <NumberInput label="Compensation (RWF)" min={0} {...form.getInputProps('compensation_rwf')} />
                <Textarea label="Obligations Notes" minRows={2} {...form.getInputProps('obligations_notes')} />
                <Textarea label="Recall Provisions" minRows={2} {...form.getInputProps('recall_provisions')} />
              </>
            )}
            {editing && (
              <Group grow>
                <Checkbox label="Executive Organ approved (domestic)" {...form.getInputProps('executive_organ_approved', { type: 'checkbox' })} />
                <Checkbox label="Board notified (international)" {...form.getInputProps('board_notified', { type: 'checkbox' })} />
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
