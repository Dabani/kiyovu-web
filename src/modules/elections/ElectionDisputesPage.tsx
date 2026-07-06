import { useState } from 'react';
import { Modal, TextInput, Select, Textarea, Checkbox, Button, Group, Stack, Title, Badge, NumberInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';

const ENDPOINT = '/election-disputes';

interface Dispute {
  id: number;
  election_cycle_year: number;
  submitted_by_name: string;
  submitted_on: string;
  grounds_detail: string;
  referred_to_cro: boolean;
  determination: string | null;
  determination_date: string | null;
  status_id: number;
  position?: { label_en: string };
  disputeGround?: { label_en: string };
  status?: { label_en: string };
}

export function ElectionDisputesPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<Dispute>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const positions = useLookupSelect('elected-positions', i18n.language);
  const grounds = useLookupSelect('dispute-grounds', i18n.language);
  const statuses = useLookupSelect('statuses', i18n.language);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Dispute | null>(null);

  const form = useForm({
    initialValues: {
      position_id: '', election_cycle_year: new Date().getFullYear(), dispute_ground_id: '',
      submitted_by_name: '', submitted_on: '', grounds_detail: '', referred_to_cro: false,
      determination: '', determination_date: '', status_id: '',
    },
    validate: {
      position_id: (v) => (v ? null : 'Required'),
      dispute_ground_id: (v) => (v ? null : 'Required'),
      submitted_by_name: (v) => (v ? null : 'Required'),
      submitted_on: (v) => (v ? null : 'Required'),
      grounds_detail: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: Dispute) {
    setEditing(row);
    form.setValues({
      position_id: '', election_cycle_year: row.election_cycle_year, dispute_ground_id: '',
      submitted_by_name: row.submitted_by_name, submitted_on: row.submitted_on,
      grounds_detail: row.grounds_detail, referred_to_cro: row.referred_to_cro,
      determination: row.determination ?? '', determination_date: row.determination_date ?? '',
      status_id: String(row.status_id),
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      update.mutate(
        {
          id: editing.id,
          payload: {
            referred_to_cro: values.referred_to_cro, determination: values.determination || null,
            determination_date: values.determination_date || null, status_id: values.status_id,
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

  const columns: DataTableColumn<Dispute>[] = [
    { key: 'position', header: 'Position', render: (r) => r.position?.label_en ?? '—', exportValue: (r) => r.position?.label_en ?? '' },
    { key: 'disputeGround', header: 'Ground', render: (r) => r.disputeGround?.label_en ?? '—', exportValue: (r) => r.disputeGround?.label_en ?? '' },
    { key: 'submitted_by_name', header: 'Submitted By' },
    { key: 'submitted_on', header: 'Submitted On' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">ELEC-005 — Election Disputes</Title>
      <DataTable<Dispute>
        title="Election Disputes"
        moduleKey="election-disputes"
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
          { key: 'position_id', label: 'Position', options: positions.data },
          { key: 'status_id', label: 'Status', options: statuses.data },
        ]}
        activeFilters={list.filters}
        onFilterChange={list.onFilterChange}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={(row) => list.deleteRow(row.id)}
        onGenerateReport={handleReport}
      />

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Dispute' : 'New Election Dispute (ELEC-005)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <Group grow>
                  <Select label="Position" data={positions.data} required {...form.getInputProps('position_id')} />
                  <NumberInput label="Election Cycle Year" required min={2020} max={2100} {...form.getInputProps('election_cycle_year')} />
                </Group>
                <Select label="Ground for Dispute" data={grounds.data} required {...form.getInputProps('dispute_ground_id')} />
                <TextInput label="Submitted By" required {...form.getInputProps('submitted_by_name')} />
                <TextInput type="date" label="Submitted On" required {...form.getInputProps('submitted_on')} />
                <Textarea label="Grounds Detail" required minRows={3} {...form.getInputProps('grounds_detail')} />
              </>
            )}
            <Checkbox label="Referred to Conflict Resolution Organ" {...form.getInputProps('referred_to_cro', { type: 'checkbox' })} />
            {editing && (
              <>
                <Textarea label="Determination" minRows={3} {...form.getInputProps('determination')} />
                <TextInput type="date" label="Determination Date" {...form.getInputProps('determination_date')} />
              </>
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
