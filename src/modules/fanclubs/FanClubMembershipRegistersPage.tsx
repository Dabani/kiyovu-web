import { useState } from 'react';
import { Modal, TextInput, Select, Checkbox, Button, Group, Stack, Title, Badge, NumberInput, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';
import { useFanClubOptions } from '../../hooks/useFanClubOptions';

const ENDPOINT = '/fan-club-membership-registers';

interface Register {
  id: number;
  quarter: number;
  register_year: number;
  active_member_count: number;
  audited: boolean;
  status_id: number;
  fanClub?: { label: string };
  status?: { label_en: string };
}

const QUARTER_OPTIONS = [
  { value: '1', label: 'Q1' }, { value: '2', label: 'Q2' },
  { value: '3', label: 'Q3' }, { value: '4', label: 'Q4' },
];

export function FanClubMembershipRegistersPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<Register>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const statuses = useLookupSelect('statuses', i18n.language);
  const fanClubs = useFanClubOptions();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Register | null>(null);

  const form = useForm({
    initialValues: {
      fan_club_id: '', quarter: '1', register_year: new Date().getFullYear(), active_member_count: '',
      submitted_on: '', audited: false, audited_on: '', status_id: '',
    },
    validate: {
      fan_club_id: (v) => (v ? null : 'Required'),
      active_member_count: (v) => (v !== '' ? null : 'Required'),
      submitted_on: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  const memberCount = Number(form.values.active_member_count) || 0;
  const expectedContribution = memberCount >= 50 ? memberCount * 1000 : 50000;

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: Register) {
    setEditing(row);
    form.setValues({
      fan_club_id: '', quarter: String(row.quarter), register_year: row.register_year,
      active_member_count: String(row.active_member_count), submitted_on: '', audited: row.audited,
      audited_on: '', status_id: String(row.status_id),
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      update.mutate(
        {
          id: editing.id,
          payload: {
            active_member_count: values.active_member_count, audited: values.audited,
            audited_on: values.audited_on || null, status_id: values.status_id,
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

  const columns: DataTableColumn<Register>[] = [
    { key: 'fanClub', header: 'Fan Club', render: (r) => r.fanClub?.label ?? '—', exportValue: (r) => r.fanClub?.label ?? '' },
    { key: 'quarter', header: 'Quarter', render: (r) => `Q${r.quarter} ${r.register_year}`, exportValue: (r) => `Q${r.quarter} ${r.register_year}` },
    { key: 'active_member_count', header: 'Active Members' },
    {
      key: 'audited', header: 'Audited',
      render: (r) => (r.audited ? <Badge color="kiyovuGreen">Yes</Badge> : <Badge color="gray">No</Badge>),
      exportValue: (r) => (r.audited ? 'Yes' : 'No'),
    },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">FAN-008 — Membership Registers</Title>
      <DataTable<Register>
        title="Quarterly Membership Registers"
        moduleKey="fan-club-membership-registers"
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Register' : 'New Membership Register (FAN-008)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <Select label="Fan Club" data={fanClubs.data ?? []} required searchable {...form.getInputProps('fan_club_id')} />
                <Group grow>
                  <Select label="Quarter" data={QUARTER_OPTIONS} required {...form.getInputProps('quarter')} />
                  <NumberInput label="Year" required min={2020} max={2100} {...form.getInputProps('register_year')} />
                </Group>
              </>
            )}
            <NumberInput label="Active Member Count" required min={0} {...form.getInputProps('active_member_count')} />
            <Text size="xs" c="dimmed">
              Expected monthly contribution (Art. 183): RWF {expectedContribution.toLocaleString()}
              {memberCount >= 50 ? ' (RWF 1,000 × member count)' : ' (flat minimum, under 50 members)'}
            </Text>
            {!editing && <TextInput type="date" label="Submitted On" required {...form.getInputProps('submitted_on')} />}
            {editing && (
              <Group grow>
                <Checkbox label="Audited by SLO" {...form.getInputProps('audited', { type: 'checkbox' })} />
                {form.values.audited && <TextInput type="date" label="Audited On" {...form.getInputProps('audited_on')} />}
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
