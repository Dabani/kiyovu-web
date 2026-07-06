import { useState } from 'react';
import { Modal, TextInput, Select, Textarea, Checkbox, Button, Group, Stack, Title, Badge, NumberInput, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useCandidateOptions } from '../../hooks/useCandidateOptions';

const ENDPOINT = '/hr-interview-scores';

interface InterviewScore {
  id: number;
  interview_date: string;
  technical_competence_score: number;
  values_alignment_score: number;
  position_specific_score: number;
  interviewer_notes: string | null;
  recommended_to_proceed: boolean;
  candidate?: { label: string };
}

export function HrInterviewScoresPage() {
  const { t } = useTranslation();
  const list = useCrudList<InterviewScore>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const candidates = useCandidateOptions();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<InterviewScore | null>(null);

  const form = useForm({
    initialValues: {
      candidate_id: '', interview_date: '', technical_competence_score: '',
      values_alignment_score: '', position_specific_score: '', interviewer_notes: '',
      recommended_to_proceed: false,
    },
    validate: {
      candidate_id: (v) => (v ? null : 'Required'),
      interview_date: (v) => (v ? null : 'Required'),
      technical_competence_score: (v) => (v !== '' ? null : 'Required'),
      values_alignment_score: (v) => (v !== '' ? null : 'Required'),
      position_specific_score: (v) => (v !== '' ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: InterviewScore) {
    setEditing(row);
    form.setValues({
      candidate_id: '', interview_date: row.interview_date,
      technical_competence_score: String(row.technical_competence_score),
      values_alignment_score: String(row.values_alignment_score),
      position_specific_score: String(row.position_specific_score),
      interviewer_notes: row.interviewer_notes ?? '', recommended_to_proceed: row.recommended_to_proceed,
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      const { candidate_id: _c, interview_date: _d, ...editable } = values;
      update.mutate({ id: editing.id, payload: editable }, { onSuccess: () => setModalOpen(false) });
    } else {
      create.mutate(values, { onSuccess: () => setModalOpen(false) });
    }
  }

  async function handleReport(period: ReportPeriod) {
    await downloadReport(ENDPOINT, { period: period.kind });
  }

  const columns: DataTableColumn<InterviewScore>[] = [
    { key: 'candidate', header: 'Candidate', render: (r) => r.candidate?.label ?? '—', exportValue: (r) => r.candidate?.label ?? '' },
    { key: 'interview_date', header: 'Interview Date' },
    {
      key: 'total', header: 'Total Score (/30)',
      render: (r) => <Text fw={600}>{(Number(r.technical_competence_score) + Number(r.values_alignment_score) + Number(r.position_specific_score)).toFixed(1)}</Text>,
      exportValue: (r) => Number(r.technical_competence_score) + Number(r.values_alignment_score) + Number(r.position_specific_score),
    },
    {
      key: 'recommended_to_proceed', header: 'Recommended',
      render: (r) => (r.recommended_to_proceed ? <Badge color="kiyovuGreen">Yes</Badge> : <Badge color="gray">No</Badge>),
      exportValue: (r) => (r.recommended_to_proceed ? 'Yes' : 'No'),
    },
  ];

  return (
    <>
      <Title order={2} mb="md">HR-006 — Interview Scoring Matrix</Title>
      <DataTable<InterviewScore>
        title="Interview Scores"
        moduleKey="hr-interview-scores"
        columns={columns}
        rows={list.rows}
        totalCount={list.totalCount}
        page={list.page}
        pageSize={list.pageSize}
        loading={list.loading}
        search={list.search}
        onSearchChange={list.onSearchChange}
        onPageChange={list.setPage}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={(row) => list.deleteRow(row.id)}
        onGenerateReport={handleReport}
      />

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Interview Score' : 'New Interview Score (HR-006)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <Select label="Candidate" data={candidates.data ?? []} required searchable {...form.getInputProps('candidate_id')} />
                <TextInput type="date" label="Interview Date" required {...form.getInputProps('interview_date')} />
              </>
            )}
            <Group grow>
              <NumberInput label="Technical Competence (0-10)" required min={0} max={10} step={0.5} {...form.getInputProps('technical_competence_score')} />
              <NumberInput label="Values Alignment (0-10)" required min={0} max={10} step={0.5} {...form.getInputProps('values_alignment_score')} />
              <NumberInput label="Position-Specific (0-10)" required min={0} max={10} step={0.5} {...form.getInputProps('position_specific_score')} />
            </Group>
            <Textarea label="Interviewer Notes" minRows={3} {...form.getInputProps('interviewer_notes')} />
            <Checkbox label="Recommended to proceed" {...form.getInputProps('recommended_to_proceed', { type: 'checkbox' })} />
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
