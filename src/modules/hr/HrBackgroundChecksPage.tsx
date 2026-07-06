import { useState } from 'react';
import { Modal, TextInput, Select, Textarea, Checkbox, Button, Group, Stack, Title, Badge } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';
import { useCandidateOptions } from '../../hooks/useCandidateOptions';

const ENDPOINT = '/hr-background-checks';

interface BackgroundCheck {
  id: number;
  subject_name: string;
  role_involves_minors: boolean;
  consent_given_on: string;
  verification_notes: string | null;
  cleared_by_name: string | null;
  cleared_on: string | null;
  outcome_status_id: number;
  position?: { label_en: string };
  outcomeStatus?: { label_en: string };
}

export function HrBackgroundChecksPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<BackgroundCheck>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const positions = useLookupSelect('hq-positions', i18n.language);
  const statuses = useLookupSelect('statuses', i18n.language);
  const candidates = useCandidateOptions();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BackgroundCheck | null>(null);

  const form = useForm({
    initialValues: {
      candidate_id: '', subject_name: '', position_id: '', role_involves_minors: false,
      consent_given_on: '', verification_notes: '', outcome_status_id: '',
      cleared_by_name: '', cleared_on: '',
    },
    validate: {
      subject_name: (v) => (v ? null : 'Required'),
      consent_given_on: (v) => (v ? null : 'Required'),
      outcome_status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: BackgroundCheck) {
    setEditing(row);
    form.setValues({
      candidate_id: '', subject_name: row.subject_name, position_id: '',
      role_involves_minors: row.role_involves_minors, consent_given_on: row.consent_given_on,
      verification_notes: row.verification_notes ?? '', outcome_status_id: String(row.outcome_status_id),
      cleared_by_name: row.cleared_by_name ?? '', cleared_on: row.cleared_on ?? '',
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      update.mutate(
        {
          id: editing.id,
          payload: {
            verification_notes: values.verification_notes || null, outcome_status_id: values.outcome_status_id,
            cleared_by_name: values.cleared_by_name || null, cleared_on: values.cleared_on || null,
          },
        },
        { onSuccess: () => setModalOpen(false) }
      );
    } else {
      create.mutate({ ...values, candidate_id: values.candidate_id || null, position_id: values.position_id || null }, { onSuccess: () => setModalOpen(false) });
    }
  }

  async function handleReport(period: ReportPeriod) {
    await downloadReport(ENDPOINT, { period: period.kind });
  }

  const columns: DataTableColumn<BackgroundCheck>[] = [
    { key: 'subject_name', header: 'Subject' },
    { key: 'position', header: 'Position', render: (r) => r.position?.label_en ?? '—', exportValue: (r) => r.position?.label_en ?? '' },
    {
      key: 'role_involves_minors', header: 'Involves Minors',
      render: (r) => (r.role_involves_minors ? <Badge color="orange">Yes</Badge> : <Badge color="gray">No</Badge>),
      exportValue: (r) => (r.role_involves_minors ? 'Yes' : 'No'),
    },
    { key: 'outcomeStatus', header: 'Outcome', render: (r) => <Badge>{r.outcomeStatus?.label_en}</Badge>, exportValue: (r) => r.outcomeStatus?.label_en ?? '' },
    { key: 'cleared_on', header: 'Cleared On' },
  ];

  return (
    <>
      <Title order={2} mb="md">HR-002 — Background Check Consents</Title>
      <DataTable<BackgroundCheck>
        title="Background Checks"
        moduleKey="hr-background-checks"
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
          { key: 'outcome_status_id', label: 'Outcome', options: statuses.data },
        ]}
        activeFilters={list.filters}
        onFilterChange={list.onFilterChange}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={(row) => list.deleteRow(row.id)}
        onGenerateReport={handleReport}
      />

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Background Check' : 'New Background Check Consent (HR-002)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <Select label="Link to Recruitment Candidate (optional)" data={candidates.data ?? []} searchable clearable {...form.getInputProps('candidate_id')} />
                <TextInput label="Subject Name" required {...form.getInputProps('subject_name')} />
                <Select label="Position" data={positions.data} clearable {...form.getInputProps('position_id')} />
                <Checkbox label="Role involves contact with minors (mandatory enhanced check, Art. 111)" {...form.getInputProps('role_involves_minors', { type: 'checkbox' })} />
                <TextInput type="date" label="Consent Given On" required {...form.getInputProps('consent_given_on')} />
              </>
            )}
            <Textarea label="Verification Notes" minRows={2} {...form.getInputProps('verification_notes')} />
            <Select label="Outcome" data={statuses.data} required {...form.getInputProps('outcome_status_id')} />
            {editing && (
              <Group grow>
                <TextInput label="Cleared By" {...form.getInputProps('cleared_by_name')} />
                <TextInput type="date" label="Cleared On" {...form.getInputProps('cleared_on')} />
              </Group>
            )}
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
