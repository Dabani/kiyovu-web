import { useState } from 'react';
import { Modal, TextInput, Select, Checkbox, Button, Group, Stack, Title, Badge } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';

const ENDPOINT = '/guest-registers';

interface Guest {
  id: number;
  match_date: string;
  event_description: string;
  guest_name: string;
  guest_organization: string | null;
  is_partner_guest: boolean;
  host_name: string;
  ceo_approved_on: string | null;
  guest_signed: boolean;
  status_id: number;
  status?: { label_en: string };
}

export function GuestRegisterPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<Guest>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const statuses = useLookupSelect('statuses', i18n.language);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Guest | null>(null);

  const form = useForm({
    initialValues: {
      match_date: '', event_description: '', guest_name: '', guest_organization: '',
      is_partner_guest: false, host_name: '', ceo_approved_on: '', guest_signed: false, status_id: '',
    },
    validate: {
      match_date: (v) => (v ? null : 'Required'),
      event_description: (v) => (v ? null : 'Required'),
      guest_name: (v) => (v ? null : 'Required'),
      host_name: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: Guest) {
    setEditing(row);
    form.setValues({
      match_date: row.match_date, event_description: row.event_description, guest_name: row.guest_name,
      guest_organization: row.guest_organization ?? '', is_partner_guest: row.is_partner_guest,
      host_name: row.host_name, ceo_approved_on: row.ceo_approved_on ?? '', guest_signed: row.guest_signed,
      status_id: String(row.status_id),
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      update.mutate(
        { id: editing.id, payload: { ceo_approved_on: values.ceo_approved_on || null, guest_signed: values.guest_signed, status_id: values.status_id } },
        { onSuccess: () => setModalOpen(false) }
      );
    } else {
      create.mutate({ ...values, guest_organization: values.guest_organization || null }, { onSuccess: () => setModalOpen(false) });
    }
  }

  async function handleReport(period: ReportPeriod) {
    await downloadReport(ENDPOINT, { period: period.kind });
  }

  const columns: DataTableColumn<Guest>[] = [
    { key: 'match_date', header: 'Match Date' },
    { key: 'guest_name', header: 'Guest' },
    { key: 'guest_organization', header: 'Organization' },
    { key: 'host_name', header: 'Host' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">OPS-001 — Guest Register</Title>
      <DataTable<Guest>
        title="Hospitality & VIP Guest Register"
        moduleKey="guest-registers"
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Guest' : 'New Guest Entry (OPS-001)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <Group grow>
                  <TextInput type="date" label="Match Date" required {...form.getInputProps('match_date')} />
                  <TextInput label="Event Description" required {...form.getInputProps('event_description')} />
                </Group>
                <Group grow>
                  <TextInput label="Guest Name" required {...form.getInputProps('guest_name')} />
                  <TextInput label="Guest Organization" {...form.getInputProps('guest_organization')} />
                </Group>
                <Checkbox label="Partner guest (hosted by Marketing & Commercial Director)" {...form.getInputProps('is_partner_guest', { type: 'checkbox' })} />
                <TextInput label="Host Name" required {...form.getInputProps('host_name')} />
              </>
            )}
            <TextInput type="date" label="CEO Approved On (≥48 hrs before match)" {...form.getInputProps('ceo_approved_on')} />
            {editing && <Checkbox label="Guest signed the register" {...form.getInputProps('guest_signed', { type: 'checkbox' })} />}
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
