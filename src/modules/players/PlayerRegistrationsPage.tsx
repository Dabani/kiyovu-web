import { useState } from 'react';
import { Modal, TextInput, Select, Checkbox, Button, Group, Stack, Title, Badge } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';

const ENDPOINT = '/players';

interface Player {
  id: number;
  full_name: string;
  date_of_birth: string;
  position: string;
  ferwafa_registration_number: string | null;
  registration_date: string;
  medical_clearance_certified: boolean;
  is_minor: boolean;
  status_id: number;
  team?: { label_en: string };
  status?: { label_en: string };
}

export function PlayerRegistrationsPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<Player>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const teams = useLookupSelect('player-teams', i18n.language);
  const statuses = useLookupSelect('statuses', i18n.language);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Player | null>(null);

  const form = useForm({
    initialValues: {
      full_name: '', date_of_birth: '', nationality: '', position: '', team_id: '',
      national_id_or_passport: '', ferwafa_registration_number: '', registration_date: '',
      medical_clearance_certified: false, medical_clearance_date: '',
      guardian_name: '', guardian_phone: '', status_id: '',
    },
    validate: {
      full_name: (v) => (v ? null : 'Required'),
      date_of_birth: (v) => (v ? null : 'Required'),
      nationality: (v) => (v ? null : 'Required'),
      position: (v) => (v ? null : 'Required'),
      team_id: (v) => (v ? null : 'Required'),
      national_id_or_passport: (v) => (v ? null : 'Required'),
      registration_date: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: Player) {
    setEditing(row);
    form.setValues({
      full_name: row.full_name, date_of_birth: row.date_of_birth, nationality: '', position: row.position,
      team_id: '', national_id_or_passport: '', ferwafa_registration_number: row.ferwafa_registration_number ?? '',
      registration_date: row.registration_date, medical_clearance_certified: row.medical_clearance_certified,
      medical_clearance_date: '', guardian_name: '', guardian_phone: '', status_id: String(row.status_id),
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      update.mutate(
        {
          id: editing.id,
          payload: {
            ferwafa_registration_number: values.ferwafa_registration_number || null,
            medical_clearance_certified: values.medical_clearance_certified,
            medical_clearance_date: values.medical_clearance_date || null,
            guardian_name: values.guardian_name || null, guardian_phone: values.guardian_phone || null,
            status_id: values.status_id,
          },
        },
        { onSuccess: () => setModalOpen(false) }
      );
    } else {
      create.mutate({ ...values, ferwafa_registration_number: values.ferwafa_registration_number || null }, { onSuccess: () => setModalOpen(false) });
    }
  }

  async function handleReport(period: ReportPeriod) {
    await downloadReport(ENDPOINT, { period: period.kind });
  }

  const columns: DataTableColumn<Player>[] = [
    { key: 'full_name', header: 'Player' },
    { key: 'team', header: 'Team', render: (r) => r.team?.label_en ?? '—', exportValue: (r) => r.team?.label_en ?? '' },
    { key: 'position', header: 'Position' },
    {
      key: 'is_minor', header: 'Minor',
      render: (r) => (r.is_minor ? <Badge color="orange">Minor</Badge> : <Badge color="gray">Adult</Badge>),
      exportValue: (r) => (r.is_minor ? 'Minor' : 'Adult'),
    },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">PLAYER-002 — Player Registrations</Title>
      <DataTable<Player>
        title="Player Registrations"
        moduleKey="players"
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
          { key: 'team_id', label: 'Team', options: teams.data },
          { key: 'status_id', label: 'Status', options: statuses.data },
        ]}
        activeFilters={list.filters}
        onFilterChange={list.onFilterChange}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={(row) => list.deleteRow(row.id)}
        onGenerateReport={handleReport}
      />

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Player' : 'New Player Registration (PLAYER-002)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <Group grow>
                  <TextInput label="Full Name" required {...form.getInputProps('full_name')} />
                  <TextInput type="date" label="Date of Birth" required {...form.getInputProps('date_of_birth')} />
                </Group>
                <Group grow>
                  <TextInput label="Nationality" required {...form.getInputProps('nationality')} />
                  <TextInput label="Position" required {...form.getInputProps('position')} />
                </Group>
                <Select label="Team" data={teams.data} required {...form.getInputProps('team_id')} />
                <TextInput label="National ID / Passport" required {...form.getInputProps('national_id_or_passport')} />
                <TextInput type="date" label="Registration Date" required {...form.getInputProps('registration_date')} />
              </>
            )}
            <TextInput label="FERWAFA Registration Number" {...form.getInputProps('ferwafa_registration_number')} />
            <Group grow>
              <Checkbox label="Medical clearance certified (Art. 74 of the Constitution)" mt="lg" {...form.getInputProps('medical_clearance_certified', { type: 'checkbox' })} />
              <TextInput type="date" label="Medical Clearance Date" {...form.getInputProps('medical_clearance_date')} />
            </Group>
            <Group grow>
              <TextInput label="Guardian Name (if minor)" {...form.getInputProps('guardian_name')} />
              <TextInput label="Guardian Phone" {...form.getInputProps('guardian_phone')} />
            </Group>
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
