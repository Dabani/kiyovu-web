import { useState } from 'react';
import { Modal, TextInput, Select, Textarea, Checkbox, Button, Group, Stack, Title, Badge, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { IconShieldCheck } from '@tabler/icons-react';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';

const ENDPOINT = '/safeguarding-concern-reports';

interface ConcernReport {
  id: number;
  is_anonymous: boolean;
  reporter_name: string | null;
  concern_date: string;
  risk_identified: boolean | null;
  accused_suspended_from_minors_contact: boolean;
  status_id: number;
  status?: { label_en: string };
}

export function SafeguardingConcernReportsPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<ConcernReport>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const statuses = useLookupSelect('statuses', i18n.language);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ConcernReport | null>(null);

  const form = useForm({
    initialValues: {
      is_anonymous: false, reporter_name: '', concern_date: '', description: '', subject_reference: '',
      status_id: '', receipt_acknowledged_on: '', initial_assessment_completed_on: '',
      risk_identified: false, reported_to_authorities_on: '', accused_suspended_from_minors_contact: false,
    },
    validate: {
      concern_date: (v) => (v ? null : 'Required'),
      description: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: ConcernReport) {
    setEditing(row);
    form.setValues({
      is_anonymous: row.is_anonymous, reporter_name: row.reporter_name ?? '', concern_date: row.concern_date,
      description: '', subject_reference: '', status_id: String(row.status_id),
      receipt_acknowledged_on: '', initial_assessment_completed_on: '', risk_identified: row.risk_identified ?? false,
      reported_to_authorities_on: '', accused_suspended_from_minors_contact: row.accused_suspended_from_minors_contact,
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      update.mutate(
        {
          id: editing.id,
          payload: {
            receipt_acknowledged_on: values.receipt_acknowledged_on || null,
            initial_assessment_completed_on: values.initial_assessment_completed_on || null,
            risk_identified: values.risk_identified, reported_to_authorities_on: values.reported_to_authorities_on || null,
            accused_suspended_from_minors_contact: values.accused_suspended_from_minors_contact, status_id: values.status_id,
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

  const columns: DataTableColumn<ConcernReport>[] = [
    { key: 'concern_date', header: 'Concern Date' },
    {
      key: 'reporter', header: 'Reporter',
      render: (r) => (r.is_anonymous ? <Badge color="gray">Anonymous</Badge> : <span>{r.reporter_name}</span>),
      exportValue: (r) => (r.is_anonymous ? 'Anonymous' : r.reporter_name ?? ''),
    },
    {
      key: 'risk_identified', header: 'Risk Identified',
      render: (r) => (r.risk_identified ? <Badge color="red">Yes</Badge> : <Badge color="gray">—</Badge>),
      exportValue: (r) => (r.risk_identified ? 'Yes' : ''),
    },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">SAFE-001 — Safeguarding Concern Reports</Title>
      <Alert icon={<IconShieldCheck size={16} />} color="kiyovuGreen" mb="md" variant="light">
        Report to the Child Safeguarding Officer immediately. Failure to report a safeguarding concern is itself a disciplinary offence (Art. 212).
      </Alert>
      <DataTable<ConcernReport>
        title="Safeguarding Concern Reports"
        moduleKey="safeguarding-concern-reports"
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Report' : 'New Safeguarding Concern (SAFE-001)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <Checkbox label="Submit anonymously" {...form.getInputProps('is_anonymous', { type: 'checkbox' })} />
                {!form.values.is_anonymous && <TextInput label="Reporter Name" {...form.getInputProps('reporter_name')} />}
                <TextInput type="date" label="Concern Date" required {...form.getInputProps('concern_date')} />
                <Textarea label="Description" required minRows={4} {...form.getInputProps('description')} />
                <TextInput label="Subject Reference (optional, kept minimal/sensitive)" {...form.getInputProps('subject_reference')} />
              </>
            )}
            {editing && (
              <>
                <Group grow>
                  <TextInput type="date" label="Receipt Acknowledged On (within 24 hrs)" {...form.getInputProps('receipt_acknowledged_on')} />
                  <TextInput type="date" label="Initial Assessment Completed On (within 72 hrs)" {...form.getInputProps('initial_assessment_completed_on')} />
                </Group>
                <Checkbox label="Risk to child identified" {...form.getInputProps('risk_identified', { type: 'checkbox' })} />
                {form.values.risk_identified && (
                  <TextInput type="date" label="Reported to Authorities On (within 24 hrs of assessment)" {...form.getInputProps('reported_to_authorities_on')} />
                )}
                <Checkbox label="Accused suspended from all contact with minors" {...form.getInputProps('accused_suspended_from_minors_contact', { type: 'checkbox' })} />
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
