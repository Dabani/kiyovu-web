import { useState } from 'react';
import { Modal, TextInput, Select, Textarea, Checkbox, Button, Group, Stack, Title, Badge } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';

const ENDPOINT = '/security-incident-reports';

interface IncidentReport {
  id: number;
  incident_date: string;
  event_description: string;
  reported_by_name: string;
  coordinated_with_law_enforcement: boolean;
  coordinated_with_stadium_authorities: boolean;
  status_id: number;
  status?: { label_en: string };
}

export function SecurityIncidentReportsPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<IncidentReport>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const statuses = useLookupSelect('statuses', i18n.language);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<IncidentReport | null>(null);

  const form = useForm({
    initialValues: {
      incident_date: '', event_description: '', incident_description: '', reported_by_name: '',
      reported_on: '', coordinated_with_law_enforcement: false, coordinated_with_stadium_authorities: false,
      action_taken: '', status_id: '',
    },
    validate: {
      incident_date: (v) => (v ? null : 'Required'),
      event_description: (v) => (v ? null : 'Required'),
      incident_description: (v) => (v ? null : 'Required'),
      reported_by_name: (v) => (v ? null : 'Required'),
      reported_on: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: IncidentReport) {
    setEditing(row);
    form.setValues({
      incident_date: row.incident_date, event_description: row.event_description, incident_description: '',
      reported_by_name: row.reported_by_name, reported_on: '',
      coordinated_with_law_enforcement: row.coordinated_with_law_enforcement,
      coordinated_with_stadium_authorities: row.coordinated_with_stadium_authorities,
      action_taken: '', status_id: String(row.status_id),
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      update.mutate(
        {
          id: editing.id,
          payload: {
            action_taken: values.action_taken || null,
            coordinated_with_law_enforcement: values.coordinated_with_law_enforcement,
            coordinated_with_stadium_authorities: values.coordinated_with_stadium_authorities,
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

  const columns: DataTableColumn<IncidentReport>[] = [
    { key: 'incident_date', header: 'Incident Date' },
    { key: 'event_description', header: 'Event' },
    { key: 'reported_by_name', header: 'Reported By' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">SEC-001 — Security Incident Register</Title>
      <DataTable<IncidentReport>
        title="Security Incident Register"
        moduleKey="security-incident-reports"
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Incident' : 'New Security Incident (SEC-001)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <Group grow>
                  <TextInput type="date" label="Incident Date" required {...form.getInputProps('incident_date')} />
                  <TextInput label="Event Description" required {...form.getInputProps('event_description')} />
                </Group>
                <Textarea label="Incident Description" required minRows={3} {...form.getInputProps('incident_description')} />
                <TextInput label="Reported By (Safety & Security Officer)" required {...form.getInputProps('reported_by_name')} />
                <TextInput type="date" label="Reported On (within 24 hours)" required {...form.getInputProps('reported_on')} />
              </>
            )}
            <Group grow>
              <Checkbox label="Coordinated with law enforcement" {...form.getInputProps('coordinated_with_law_enforcement', { type: 'checkbox' })} />
              <Checkbox label="Coordinated with stadium authorities" {...form.getInputProps('coordinated_with_stadium_authorities', { type: 'checkbox' })} />
            </Group>
            <Textarea label="Action Taken" minRows={2} {...form.getInputProps('action_taken')} />
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
