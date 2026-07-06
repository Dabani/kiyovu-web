import { useState } from 'react';
import { Modal, TextInput, Select, Textarea, Checkbox, Button, Group, Stack, Title, Badge, NumberInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';

const ENDPOINT = '/recruitment-candidates';

interface Candidate {
  id: number;
  vacancy_title: string;
  full_name: string;
  phone: string;
  email: string | null;
  application_date: string;
  shortlisted: boolean;
  shortlist_score: number | null;
  shortlisting_notes: string | null;
  status_id: number;
  position?: { label_en: string };
  status?: { label_en: string };
}

export function RecruitmentCandidatesPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<Candidate>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const positions = useLookupSelect('hq-positions', i18n.language);
  const statuses = useLookupSelect('statuses', i18n.language, 'recruitment_candidates');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Candidate | null>(null);

  const form = useForm({
    initialValues: {
      vacancy_title: '', position_id: '', full_name: '', phone: '', email: '',
      application_date: '', vacancy_published_on: '', vacancy_closing_date: '',
      status_id: '', shortlisted: false, shortlist_score: '', shortlisting_notes: '', shortlisted_on: '',
    },
    validate: {
      vacancy_title: (v) => (v ? null : 'Required'),
      position_id: (v) => (v ? null : 'Required'),
      full_name: (v) => (v ? null : 'Required'),
      phone: (v) => (v ? null : 'Required'),
      application_date: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: Candidate) {
    setEditing(row);
    form.setValues({
      vacancy_title: row.vacancy_title, position_id: '', full_name: row.full_name,
      phone: row.phone, email: row.email ?? '', application_date: row.application_date,
      vacancy_published_on: '', vacancy_closing_date: '', status_id: String(row.status_id),
      shortlisted: row.shortlisted, shortlist_score: row.shortlist_score ? String(row.shortlist_score) : '',
      shortlisting_notes: row.shortlisting_notes ?? '', shortlisted_on: '',
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      update.mutate(
        {
          id: editing.id,
          payload: {
            status_id: values.status_id, shortlisted: values.shortlisted,
            shortlist_score: values.shortlist_score || null, shortlisting_notes: values.shortlisting_notes || null,
            shortlisted_on: values.shortlisted_on || null,
          },
        },
        { onSuccess: () => setModalOpen(false) }
      );
    } else {
      create.mutate({ ...values, email: values.email || null }, { onSuccess: () => setModalOpen(false) });
    }
  }

  async function handleReport(period: ReportPeriod) {
    await downloadReport(ENDPOINT, { period: period.kind });
  }

  const columns: DataTableColumn<Candidate>[] = [
    { key: 'full_name', header: 'Candidate' },
    { key: 'vacancy_title', header: 'Vacancy' },
    { key: 'position', header: 'Position', render: (r) => r.position?.label_en ?? '—', exportValue: (r) => r.position?.label_en ?? '' },
    {
      key: 'shortlisted', header: 'Shortlisted',
      render: (r) => (r.shortlisted ? <Badge color="kiyovuGreen">Yes ({r.shortlist_score ?? '—'})</Badge> : <Badge color="gray">No</Badge>),
      exportValue: (r) => (r.shortlisted ? `Yes (${r.shortlist_score ?? ''})` : 'No'),
    },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">HR-005 — Shortlisting Criteria & Scores</Title>
      <DataTable<Candidate>
        title="Recruitment Candidates"
        moduleKey="recruitment-candidates"
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Shortlisting' : 'New Candidate Application (HR-005)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <TextInput label="Vacancy Title" required {...form.getInputProps('vacancy_title')} />
                <Select label="Position" data={positions.data} required {...form.getInputProps('position_id')} />
                <Group grow>
                  <TextInput label="Candidate Full Name" required {...form.getInputProps('full_name')} />
                  <TextInput label="Phone" required {...form.getInputProps('phone')} />
                </Group>
                <TextInput label="Email" {...form.getInputProps('email')} />
                <Group grow>
                  <TextInput type="date" label="Application Date" required {...form.getInputProps('application_date')} />
                  <TextInput type="date" label="Vacancy Closing Date (min. 14 days)" {...form.getInputProps('vacancy_closing_date')} />
                </Group>
              </>
            )}
            <Select label="Status" data={statuses.data} required {...form.getInputProps('status_id')} />
            {editing && (
              <>
                <Checkbox label="Shortlisted (min. 3 candidates per position, Art. 138)" {...form.getInputProps('shortlisted', { type: 'checkbox' })} />
                <Group grow>
                  <NumberInput label="Shortlist Score" min={0} max={100} {...form.getInputProps('shortlist_score')} />
                  <TextInput type="date" label="Shortlisted On" {...form.getInputProps('shortlisted_on')} />
                </Group>
                <Textarea label="Shortlisting Notes" minRows={2} {...form.getInputProps('shortlisting_notes')} />
              </>
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
