import { useState } from 'react';
import { Modal, Select, Textarea, Checkbox, Button, Group, Stack, Title, Badge, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';
import { useDisciplinaryCaseOptions } from '../../hooks/useDisciplinaryCaseOptions';

const ENDPOINT = '/disciplinary-decisions';

interface Decision {
  id: number;
  decision_date: string;
  case_summary: string;
  communicated_to_respondent: boolean;
  communicated_to_executive_organ: boolean;
  recorded_by_secretary_general: boolean;
  status_id: number;
  case?: { label: string };
  sanction?: { label_en: string };
  status?: { label_en: string };
}

export function DisciplinaryDecisionsPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<Decision>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const sanctions = useLookupSelect('disciplinary-sanctions', i18n.language);
  const statuses = useLookupSelect('statuses', i18n.language);
  const cases = useDisciplinaryCaseOptions();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Decision | null>(null);

  const form = useForm({
    initialValues: {
      case_id: '', decision_date: '', case_summary: '', findings_of_fact: '', rules_violated: '',
      reasoning: '', sanction_id: '', sanction_effective_date: '', appeal_deadline: '',
      communicated_to_respondent: false, communicated_to_executive_organ: false,
      recorded_by_secretary_general: false, status_id: '',
    },
    validate: {
      case_id: (v) => (v ? null : 'Required'),
      decision_date: (v) => (v ? null : 'Required'),
      case_summary: (v) => (v ? null : 'Required'),
      findings_of_fact: (v) => (v ? null : 'Required'),
      rules_violated: (v) => (v ? null : 'Required'),
      reasoning: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: Decision) {
    setEditing(row);
    form.setValues({
      case_id: '', decision_date: row.decision_date, case_summary: row.case_summary, findings_of_fact: '',
      rules_violated: '', reasoning: '', sanction_id: '', sanction_effective_date: '', appeal_deadline: '',
      communicated_to_respondent: row.communicated_to_respondent,
      communicated_to_executive_organ: row.communicated_to_executive_organ,
      recorded_by_secretary_general: row.recorded_by_secretary_general, status_id: String(row.status_id),
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      update.mutate(
        {
          id: editing.id,
          payload: {
            communicated_to_respondent: values.communicated_to_respondent,
            communicated_to_executive_organ: values.communicated_to_executive_organ,
            recorded_by_secretary_general: values.recorded_by_secretary_general,
            status_id: values.status_id,
          },
        },
        { onSuccess: () => setModalOpen(false) }
      );
    } else {
      create.mutate(
        { ...values, sanction_id: values.sanction_id || null, sanction_effective_date: values.sanction_effective_date || null, appeal_deadline: values.appeal_deadline || null },
        { onSuccess: () => setModalOpen(false) }
      );
    }
  }

  async function handleReport(period: ReportPeriod) {
    await downloadReport(ENDPOINT, { period: period.kind });
  }

  const columns: DataTableColumn<Decision>[] = [
    { key: 'case', header: 'Case', render: (r) => r.case?.label ?? '—', exportValue: (r) => r.case?.label ?? '' },
    { key: 'decision_date', header: 'Decision Date' },
    { key: 'sanction', header: 'Sanction', render: (r) => r.sanction?.label_en ?? '—', exportValue: (r) => r.sanction?.label_en ?? '' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">DISC-002 — Disciplinary Decisions</Title>
      <DataTable<Decision>
        title="Disciplinary Decisions"
        moduleKey="disciplinary-decisions"
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
          { key: 'sanction_id', label: 'Sanction', options: sanctions.data },
          { key: 'status_id', label: 'Status', options: statuses.data },
        ]}
        activeFilters={list.filters}
        onFilterChange={list.onFilterChange}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={(row) => list.deleteRow(row.id)}
        onGenerateReport={handleReport}
      />

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Decision' : 'New Disciplinary Decision (DISC-002)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <Select label="Case" data={cases.data ?? []} required searchable {...form.getInputProps('case_id')} />
                <TextInput type="date" label="Decision Date (within 7 days of hearing)" required {...form.getInputProps('decision_date')} />
                <Textarea label="Case Summary" required minRows={2} {...form.getInputProps('case_summary')} />
                <Textarea label="Findings of Fact" required minRows={3} {...form.getInputProps('findings_of_fact')} />
                <Textarea label="Rules Violated" required minRows={2} {...form.getInputProps('rules_violated')} />
                <Textarea label="Reasoning" required minRows={3} {...form.getInputProps('reasoning')} />
                <Select label="Sanction" data={sanctions.data} clearable {...form.getInputProps('sanction_id')} />
                <Group grow>
                  <TextInput type="date" label="Sanction Effective Date" {...form.getInputProps('sanction_effective_date')} />
                  <TextInput type="date" label="Appeal Deadline" {...form.getInputProps('appeal_deadline')} />
                </Group>
              </>
            )}
            {editing && (
              <Group grow>
                <Checkbox label="Communicated to respondent" {...form.getInputProps('communicated_to_respondent', { type: 'checkbox' })} />
                <Checkbox label="Communicated to Executive Organ" {...form.getInputProps('communicated_to_executive_organ', { type: 'checkbox' })} />
                <Checkbox label="Recorded by Secretary General" {...form.getInputProps('recorded_by_secretary_general', { type: 'checkbox' })} />
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
