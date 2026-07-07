import { useState } from 'react';
import { Modal, TextInput, Select, Textarea, Checkbox, Button, Group, Stack, Title, Badge } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';
import { useFanClubOptions } from '../../hooks/useFanClubOptions';

const ENDPOINT = '/fan-incident-reports';

interface IncidentReport {
  id: number;
  incident_date: string;
  description: string;
  documented_on: string;
  referred_to_law_enforcement: boolean;
  status_id: number;
  fanClub?: { label: string };
  incidentType?: { label_en: string };
  sanction?: { label_en: string };
  status?: { label_en: string };
}

export function FanIncidentReportsPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<IncidentReport>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const incidentTypes = useLookupSelect('incident-types', i18n.language);
  const sanctions = useLookupSelect('fan-sanctions', i18n.language);
  const statuses = useLookupSelect('statuses', i18n.language);
  const fanClubs = useFanClubOptions();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<IncidentReport | null>(null);

  const form = useForm({
    initialValues: {
      fan_club_id: '', incident_type_id: '', incident_date: '', description: '', documented_on: '',
      status_id: '', slo_investigation_report: '', slo_report_submitted_on: '',
      adjudicated_by_fan_discipline_commission: false, sanction_id: '', referred_to_law_enforcement: false,
    },
    validate: {
      incident_type_id: (v) => (v ? null : 'Required'),
      incident_date: (v) => (v ? null : 'Required'),
      description: (v) => (v ? null : 'Required'),
      documented_on: (v) => (v ? null : 'Required'),
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
      fan_club_id: '', incident_type_id: '', incident_date: row.incident_date, description: row.description,
      documented_on: row.documented_on, status_id: String(row.status_id), slo_investigation_report: '',
      slo_report_submitted_on: '', adjudicated_by_fan_discipline_commission: false, sanction_id: '',
      referred_to_law_enforcement: row.referred_to_law_enforcement,
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      update.mutate(
        {
          id: editing.id,
          payload: {
            slo_investigation_report: values.slo_investigation_report || null,
            slo_report_submitted_on: values.slo_report_submitted_on || null,
            adjudicated_by_fan_discipline_commission: values.adjudicated_by_fan_discipline_commission,
            sanction_id: values.sanction_id || null, referred_to_law_enforcement: values.referred_to_law_enforcement,
            status_id: values.status_id,
          },
        },
        { onSuccess: () => setModalOpen(false) }
      );
    } else {
      create.mutate({ ...values, fan_club_id: values.fan_club_id || null }, { onSuccess: () => setModalOpen(false) });
    }
  }

  async function handleReport(period: ReportPeriod) {
    await downloadReport(ENDPOINT, { period: period.kind });
  }

  const columns: DataTableColumn<IncidentReport>[] = [
    { key: 'fanClub', header: 'Fan Club', render: (r) => r.fanClub?.label ?? '—', exportValue: (r) => r.fanClub?.label ?? '' },
    { key: 'incidentType', header: 'Type', render: (r) => r.incidentType?.label_en ?? '—', exportValue: (r) => r.incidentType?.label_en ?? '' },
    { key: 'incident_date', header: 'Incident Date' },
    { key: 'sanction', header: 'Sanction', render: (r) => r.sanction?.label_en ?? '—', exportValue: (r) => r.sanction?.label_en ?? '' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">FAN-005 — Fan Incident Reports</Title>
      <DataTable<IncidentReport>
        title="Incident Reports"
        moduleKey="fan-incident-reports"
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
          { key: 'incident_type_id', label: 'Type', options: incidentTypes.data },
          { key: 'status_id', label: 'Status', options: statuses.data },
        ]}
        activeFilters={list.filters}
        onFilterChange={list.onFilterChange}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={(row) => list.deleteRow(row.id)}
        onGenerateReport={handleReport}
      />

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Incident' : 'New Incident Report (FAN-005)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <Select label="Fan Club (if applicable)" data={fanClubs.data ?? []} clearable searchable {...form.getInputProps('fan_club_id')} />
                <Select label="Incident Type" data={incidentTypes.data} required {...form.getInputProps('incident_type_id')} />
                <TextInput type="date" label="Incident Date" required {...form.getInputProps('incident_date')} />
                <Textarea label="Description" required minRows={3} {...form.getInputProps('description')} />
                <TextInput type="date" label="Documented On (within 24 hours)" required {...form.getInputProps('documented_on')} />
              </>
            )}
            {editing && (
              <>
                <Textarea label="SLO Investigation Report" minRows={3} {...form.getInputProps('slo_investigation_report')} />
                <TextInput type="date" label="SLO Report Submitted On (within 72 hours)" {...form.getInputProps('slo_report_submitted_on')} />
                <Checkbox label="Adjudicated by Fan Discipline Commission (else CRO)" {...form.getInputProps('adjudicated_by_fan_discipline_commission', { type: 'checkbox' })} />
                <Select label="Sanction" data={sanctions.data} clearable {...form.getInputProps('sanction_id')} />
                <Checkbox label="Referred to law enforcement" {...form.getInputProps('referred_to_law_enforcement', { type: 'checkbox' })} />
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
