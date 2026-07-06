import { useState } from 'react';
import { Modal, TextInput, Select, Textarea, Checkbox, Button, Group, Stack, Title, Badge } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';

const ENDPOINT = '/disciplinary-cases';

interface DisciplinaryCase {
  id: number;
  respondent_name: string;
  complainant_name: string | null;
  incident_description: string;
  initiated_on: string;
  receipt_acknowledged_on: string | null;
  jurisdiction_confirmed: boolean | null;
  prima_facie_case: boolean | null;
  status_id: number;
  caseSource?: { label_en: string };
  status?: { label_en: string };
}

export function DisciplinaryCasesPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<DisciplinaryCase>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const sources = useLookupSelect('disciplinary-case-sources', i18n.language);
  const statuses = useLookupSelect('statuses', i18n.language);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DisciplinaryCase | null>(null);

  const form = useForm({
    initialValues: {
      case_source_id: '', respondent_name: '', complainant_name: '', incident_description: '',
      initiated_on: '', status_id: '', receipt_acknowledged_on: '',
      preliminary_review_completed_on: '', jurisdiction_confirmed: false,
      prima_facie_case: false, investigation_completed_on: '',
    },
    validate: {
      case_source_id: (v) => (v ? null : 'Required'),
      respondent_name: (v) => (v ? null : 'Required'),
      incident_description: (v) => (v ? null : 'Required'),
      initiated_on: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: DisciplinaryCase) {
    setEditing(row);
    form.setValues({
      case_source_id: '', respondent_name: row.respondent_name, complainant_name: row.complainant_name ?? '',
      incident_description: row.incident_description, initiated_on: row.initiated_on, status_id: String(row.status_id),
      receipt_acknowledged_on: row.receipt_acknowledged_on ?? '', preliminary_review_completed_on: '',
      jurisdiction_confirmed: row.jurisdiction_confirmed ?? false, prima_facie_case: row.prima_facie_case ?? false,
      investigation_completed_on: '',
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
            preliminary_review_completed_on: values.preliminary_review_completed_on || null,
            jurisdiction_confirmed: values.jurisdiction_confirmed,
            prima_facie_case: values.prima_facie_case,
            investigation_completed_on: values.investigation_completed_on || null,
            status_id: values.status_id,
          },
        },
        { onSuccess: () => setModalOpen(false) }
      );
    } else {
      create.mutate({ ...values, complainant_name: values.complainant_name || null }, { onSuccess: () => setModalOpen(false) });
    }
  }

  async function handleReport(period: ReportPeriod) {
    await downloadReport(ENDPOINT, { period: period.kind });
  }

  const columns: DataTableColumn<DisciplinaryCase>[] = [
    { key: 'respondent_name', header: 'Respondent' },
    { key: 'caseSource', header: 'Source', render: (r) => r.caseSource?.label_en ?? '—', exportValue: (r) => r.caseSource?.label_en ?? '' },
    { key: 'initiated_on', header: 'Initiated On' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">DISC-001 — Disciplinary Cases</Title>
      <DataTable<DisciplinaryCase>
        title="Disciplinary Cases"
        moduleKey="disciplinary-cases"
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
          { key: 'case_source_id', label: 'Source', options: sources.data },
          { key: 'status_id', label: 'Status', options: statuses.data },
        ]}
        activeFilters={list.filters}
        onFilterChange={list.onFilterChange}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={(row) => list.deleteRow(row.id)}
        onGenerateReport={handleReport}
      />

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Case' : 'New Disciplinary Case (DISC-001)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <Select label="Case Source" data={sources.data} required {...form.getInputProps('case_source_id')} />
                <TextInput label="Respondent Name" required {...form.getInputProps('respondent_name')} />
                <TextInput label="Complainant Name (optional)" {...form.getInputProps('complainant_name')} />
                <Textarea label="Incident Description" required minRows={3} {...form.getInputProps('incident_description')} />
                <TextInput type="date" label="Initiated On" required {...form.getInputProps('initiated_on')} />
              </>
            )}
            {editing && (
              <>
                <Group grow>
                  <TextInput type="date" label="Receipt Acknowledged On (within 7 days)" {...form.getInputProps('receipt_acknowledged_on')} />
                  <TextInput type="date" label="Preliminary Review Completed On (within 14 days)" {...form.getInputProps('preliminary_review_completed_on')} />
                </Group>
                <Group grow>
                  <Checkbox label="Jurisdiction confirmed" {...form.getInputProps('jurisdiction_confirmed', { type: 'checkbox' })} />
                  <Checkbox label="Prima facie case established" {...form.getInputProps('prima_facie_case', { type: 'checkbox' })} />
                </Group>
                <TextInput type="date" label="Investigation Completed On (within 30 days)" {...form.getInputProps('investigation_completed_on')} />
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
