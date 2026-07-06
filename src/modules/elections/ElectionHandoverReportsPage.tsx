import { useState } from 'react';
import { Modal, TextInput, Select, Textarea, Checkbox, Button, Group, Stack, Title, Badge } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';

const ENDPOINT = '/election-handover-reports';

interface HandoverReport {
  id: number;
  outgoing_official_name: string;
  incoming_official_name: string;
  handover_date: string;
  access_and_assets_transferred: boolean;
  outgoing_signed: boolean;
  incoming_signed: boolean;
  status_id: number;
  position?: { label_en: string };
  status?: { label_en: string };
}

export function ElectionHandoverReportsPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<HandoverReport>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const positions = useLookupSelect('elected-positions', i18n.language);
  const statuses = useLookupSelect('statuses', i18n.language);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<HandoverReport | null>(null);

  const form = useForm({
    initialValues: {
      position_id: '', outgoing_official_name: '', incoming_official_name: '', handover_date: '',
      outstanding_matters: '', key_contacts: '', pending_decisions: '',
      access_and_assets_transferred: false, outgoing_signed: false, incoming_signed: false, status_id: '',
    },
    validate: {
      position_id: (v) => (v ? null : 'Required'),
      outgoing_official_name: (v) => (v ? null : 'Required'),
      incoming_official_name: (v) => (v ? null : 'Required'),
      handover_date: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: HandoverReport) {
    setEditing(row);
    form.setValues({
      position_id: '', outgoing_official_name: row.outgoing_official_name,
      incoming_official_name: row.incoming_official_name, handover_date: row.handover_date,
      outstanding_matters: '', key_contacts: '', pending_decisions: '',
      access_and_assets_transferred: row.access_and_assets_transferred,
      outgoing_signed: row.outgoing_signed, incoming_signed: row.incoming_signed,
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
            outstanding_matters: values.outstanding_matters || null, key_contacts: values.key_contacts || null,
            pending_decisions: values.pending_decisions || null,
            access_and_assets_transferred: values.access_and_assets_transferred,
            outgoing_signed: values.outgoing_signed, incoming_signed: values.incoming_signed,
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

  const columns: DataTableColumn<HandoverReport>[] = [
    { key: 'position', header: 'Position', render: (r) => r.position?.label_en ?? '—', exportValue: (r) => r.position?.label_en ?? '' },
    { key: 'outgoing_official_name', header: 'Outgoing' },
    { key: 'incoming_official_name', header: 'Incoming' },
    { key: 'handover_date', header: 'Handover Date' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">ELEC-004 — Handover Reports</Title>
      <DataTable<HandoverReport>
        title="Handover Reports"
        moduleKey="election-handover-reports"
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Handover Report' : 'New Handover Report (ELEC-004)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <Select label="Position" data={positions.data} required {...form.getInputProps('position_id')} />
                <Group grow>
                  <TextInput label="Outgoing Official" required {...form.getInputProps('outgoing_official_name')} />
                  <TextInput label="Incoming Official" required {...form.getInputProps('incoming_official_name')} />
                </Group>
                <TextInput type="date" label="Handover Date (within 30 days of certification)" required {...form.getInputProps('handover_date')} />
              </>
            )}
            <Textarea label="Outstanding Matters" minRows={2} {...form.getInputProps('outstanding_matters')} />
            <Textarea label="Key Contacts" minRows={2} {...form.getInputProps('key_contacts')} />
            <Textarea label="Pending Decisions" minRows={2} {...form.getInputProps('pending_decisions')} />
            <Group grow>
              <Checkbox label="Access & assets transferred" {...form.getInputProps('access_and_assets_transferred', { type: 'checkbox' })} />
              <Checkbox label="Outgoing signed" {...form.getInputProps('outgoing_signed', { type: 'checkbox' })} />
              <Checkbox label="Incoming signed" {...form.getInputProps('incoming_signed', { type: 'checkbox' })} />
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
