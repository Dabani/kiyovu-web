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

const ENDPOINT = '/hr-appointment-recommendations';

interface Recommendation {
  id: number;
  vacancy_title: string;
  ranking_notes: string;
  submitted_on: string;
  executive_organ_decision_date: string | null;
  board_approval_required: boolean;
  board_approved: boolean;
  status_id: number;
  position?: { label_en: string };
  recommendedCandidate?: { label: string };
  status?: { label_en: string };
}

export function HrAppointmentRecommendationsPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<Recommendation>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const positions = useLookupSelect('hq-positions', i18n.language);
  const statuses = useLookupSelect('statuses', i18n.language);
  const candidates = useCandidateOptions();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Recommendation | null>(null);

  const form = useForm({
    initialValues: {
      vacancy_title: '', position_id: '', recommended_candidate_id: '', ranking_notes: '',
      submitted_on: '', status_id: '', executive_organ_decision_date: '',
      board_approval_required: false, board_approved: false,
    },
    validate: {
      vacancy_title: (v) => (v ? null : 'Required'),
      position_id: (v) => (v ? null : 'Required'),
      recommended_candidate_id: (v) => (v ? null : 'Required'),
      ranking_notes: (v) => (v ? null : 'Required'),
      submitted_on: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: Recommendation) {
    setEditing(row);
    form.setValues({
      vacancy_title: row.vacancy_title, position_id: '', recommended_candidate_id: '',
      ranking_notes: row.ranking_notes, submitted_on: row.submitted_on, status_id: String(row.status_id),
      executive_organ_decision_date: row.executive_organ_decision_date ?? '',
      board_approval_required: row.board_approval_required, board_approved: row.board_approved,
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      update.mutate(
        {
          id: editing.id,
          payload: {
            ranking_notes: values.ranking_notes, status_id: values.status_id,
            executive_organ_decision_date: values.executive_organ_decision_date || null,
            board_approval_required: values.board_approval_required, board_approved: values.board_approved,
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

  const columns: DataTableColumn<Recommendation>[] = [
    { key: 'vacancy_title', header: 'Vacancy' },
    { key: 'position', header: 'Position', render: (r) => r.position?.label_en ?? '—', exportValue: (r) => r.position?.label_en ?? '' },
    { key: 'recommendedCandidate', header: 'Recommended Candidate', render: (r) => r.recommendedCandidate?.label ?? '—', exportValue: (r) => r.recommendedCandidate?.label ?? '' },
    { key: 'submitted_on', header: 'Submitted On' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">HR-007 — Appointment Recommendations</Title>
      <DataTable<Recommendation>
        title="Appointment Recommendations"
        moduleKey="hr-appointment-recommendations"
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Recommendation' : 'New Appointment Recommendation (HR-007)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <TextInput label="Vacancy Title" required {...form.getInputProps('vacancy_title')} />
                <Select label="Position" data={positions.data} required {...form.getInputProps('position_id')} />
                <Select label="Recommended Candidate" data={candidates.data ?? []} required searchable {...form.getInputProps('recommended_candidate_id')} />
                <TextInput type="date" label="Submitted On" required {...form.getInputProps('submitted_on')} />
              </>
            )}
            <Textarea label="Ranking Notes (full ranked list + reasoning)" required minRows={4} {...form.getInputProps('ranking_notes')} />
            <Checkbox label="Board of Directors approval required (key appointment)" {...form.getInputProps('board_approval_required', { type: 'checkbox' })} />
            {form.values.board_approval_required && (
              <Checkbox label="Board approved" {...form.getInputProps('board_approved', { type: 'checkbox' })} />
            )}
            <Select label="Status" data={statuses.data} required {...form.getInputProps('status_id')} />
            {editing && <TextInput type="date" label="Executive Organ Decision Date" {...form.getInputProps('executive_organ_decision_date')} />}
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
