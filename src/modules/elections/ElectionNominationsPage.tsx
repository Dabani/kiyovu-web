import { useState } from 'react';
import { Modal, TextInput, Select, Textarea, Checkbox, Button, Group, Stack, Title, Badge, NumberInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';

const ENDPOINT = '/election-nominations';

interface Nomination {
  id: number;
  election_cycle_year: number;
  candidate_full_name: string;
  statement_of_intent: string;
  eligibility_approved: boolean | null;
  nominated_on: string;
  status_id: number;
  position?: { label_en: string };
  status?: { label_en: string };
}

export function ElectionNominationsPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<Nomination>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const positions = useLookupSelect('elected-positions', i18n.language);
  const statuses = useLookupSelect('statuses', i18n.language);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Nomination | null>(null);

  const form = useForm({
    initialValues: {
      election_cycle_year: new Date().getFullYear(), position_id: '', candidate_full_name: '',
      statement_of_intent: '', eligibility_declaration_signed: false,
      no_disqualifying_convictions_declared: false, legal_representative_limit_confirmed: false,
      criminal_record_certificate_date: '', nominated_on: '', status_id: '',
      eligibility_determined_on: '', eligibility_approved: false, eligibility_notes: '',
    },
    validate: {
      position_id: (v) => (v ? null : 'Required'),
      candidate_full_name: (v) => (v ? null : 'Required'),
      statement_of_intent: (v) => {
        if (!v) return 'Required';
        const words = v.trim().split(/\s+/).length;
        return words > 500 ? `Exceeds 500-word limit (currently ${words})` : null;
      },
      nominated_on: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: Nomination) {
    setEditing(row);
    form.setValues({
      election_cycle_year: row.election_cycle_year, position_id: '', candidate_full_name: row.candidate_full_name,
      statement_of_intent: row.statement_of_intent, eligibility_declaration_signed: false,
      no_disqualifying_convictions_declared: false, legal_representative_limit_confirmed: false,
      criminal_record_certificate_date: '', nominated_on: row.nominated_on, status_id: String(row.status_id),
      eligibility_determined_on: '', eligibility_approved: row.eligibility_approved ?? false, eligibility_notes: '',
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      update.mutate(
        {
          id: editing.id,
          payload: {
            statement_of_intent: values.statement_of_intent,
            eligibility_determined_on: values.eligibility_determined_on || null,
            eligibility_approved: values.eligibility_approved,
            eligibility_notes: values.eligibility_notes || null,
            status_id: values.status_id,
          },
        },
        { onSuccess: () => setModalOpen(false) }
      );
    } else {
      create.mutate({ ...values, criminal_record_certificate_date: values.criminal_record_certificate_date || null }, { onSuccess: () => setModalOpen(false) });
    }
  }

  async function handleReport(period: ReportPeriod) {
    await downloadReport(ENDPOINT, { period: period.kind });
  }

  const wordCount = form.values.statement_of_intent.trim() ? form.values.statement_of_intent.trim().split(/\s+/).length : 0;

  const columns: DataTableColumn<Nomination>[] = [
    { key: 'candidate_full_name', header: 'Candidate' },
    { key: 'position', header: 'Position', render: (r) => r.position?.label_en ?? '—', exportValue: (r) => r.position?.label_en ?? '' },
    { key: 'election_cycle_year', header: 'Cycle Year' },
    { key: 'nominated_on', header: 'Nominated On' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">ELEC-001 — Election Nominations</Title>
      <DataTable<Nomination>
        title="Nominations"
        moduleKey="election-nominations"
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Nomination' : 'New Nomination (ELEC-001)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <Group grow>
                  <NumberInput label="Election Cycle Year" required min={2020} max={2100} {...form.getInputProps('election_cycle_year')} />
                  <Select label="Position" data={positions.data} required {...form.getInputProps('position_id')} />
                </Group>
                <TextInput label="Candidate Full Name" required {...form.getInputProps('candidate_full_name')} />
              </>
            )}
            <Textarea
              label={`Statement of Intent (max 500 words — ${wordCount}/500)`}
              required minRows={4} {...form.getInputProps('statement_of_intent')}
            />
            {!editing && (
              <>
                <Group grow>
                  <Checkbox label="Eligibility declaration signed" {...form.getInputProps('eligibility_declaration_signed', { type: 'checkbox' })} />
                  <Checkbox label="No disqualifying convictions" {...form.getInputProps('no_disqualifying_convictions_declared', { type: 'checkbox' })} />
                </Group>
                <Checkbox label="Legal representative limit confirmed (≤2 other organisations)" {...form.getInputProps('legal_representative_limit_confirmed', { type: 'checkbox' })} />
                <TextInput type="date" label="Criminal Record Certificate Date (President/VP only)" {...form.getInputProps('criminal_record_certificate_date')} />
                <TextInput type="date" label="Nominated On" required {...form.getInputProps('nominated_on')} />
              </>
            )}
            <Select label="Status" data={statuses.data} required {...form.getInputProps('status_id')} />
            {editing && (
              <>
                <Group grow>
                  <TextInput type="date" label="Eligibility Determined On" {...form.getInputProps('eligibility_determined_on')} />
                  <Checkbox label="Eligibility Approved" mt="lg" {...form.getInputProps('eligibility_approved', { type: 'checkbox' })} />
                </Group>
                <Textarea label="Eligibility Notes" minRows={2} {...form.getInputProps('eligibility_notes')} />
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
