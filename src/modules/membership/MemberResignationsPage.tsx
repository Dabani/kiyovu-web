import { useState } from 'react';
import { Modal, Select, Textarea, TextInput, Checkbox, Button, Group, Stack, Title, Badge } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';
import { useMemberOptions } from '../../hooks/useMemberOptions';

const ENDPOINT = '/member-resignations';

interface Resignation {
  id: number;
  resignation_letter: string;
  submitted_on: string;
  outstanding_obligations: boolean;
  outstanding_obligations_notes: string | null;
  ga_approval_date: string | null;
  status_id: number;
  member?: { label: string };
  status?: { label_en: string };
}

export function MemberResignationsPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<Resignation>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const statuses = useLookupSelect('statuses', i18n.language);
  const members = useMemberOptions();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Resignation | null>(null);

  const form = useForm({
    initialValues: {
      member_id: '', submitted_on: '', resignation_letter: '', outstanding_obligations: false,
      outstanding_obligations_notes: '', status_id: '', ga_approval_date: '',
    },
    validate: {
      member_id: (v) => (v ? null : 'Required'),
      submitted_on: (v) => (v ? null : 'Required'),
      resignation_letter: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: Resignation) {
    setEditing(row);
    form.setValues({
      member_id: '', submitted_on: row.submitted_on, resignation_letter: row.resignation_letter,
      outstanding_obligations: row.outstanding_obligations,
      outstanding_obligations_notes: row.outstanding_obligations_notes ?? '',
      status_id: String(row.status_id), ga_approval_date: row.ga_approval_date ?? '',
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      update.mutate(
        {
          id: editing.id,
          payload: {
            outstanding_obligations: values.outstanding_obligations,
            outstanding_obligations_notes: values.outstanding_obligations_notes || null,
            status_id: values.status_id, ga_approval_date: values.ga_approval_date || null,
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

  const columns: DataTableColumn<Resignation>[] = [
    { key: 'member', header: 'Member', render: (r) => r.member?.label ?? '—', exportValue: (r) => r.member?.label ?? '' },
    { key: 'submitted_on', header: 'Submitted On' },
    {
      key: 'outstanding_obligations', header: 'Outstanding Obligations',
      render: (r) => (r.outstanding_obligations ? <Badge color="orange">Yes</Badge> : <Badge color="gray">No</Badge>),
      exportValue: (r) => (r.outstanding_obligations ? 'Yes' : 'No'),
    },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
    { key: 'ga_approval_date', header: 'GA Approval Date' },
  ];

  return (
    <>
      <Title order={2} mb="md">MEM-006 — Member Resignations</Title>
      <DataTable<Resignation>
        title="Resignations"
        moduleKey="member-resignations"
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Resignation' : 'New Resignation Letter (MEM-006)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && <Select label="Member" data={members.data ?? []} required searchable {...form.getInputProps('member_id')} />}
            <Textarea label="Resignation Letter" required minRows={3} {...form.getInputProps('resignation_letter')} />
            {!editing && <TextInput type="date" label="Submitted On" required {...form.getInputProps('submitted_on')} />}
            <Checkbox label="Outstanding financial obligations" {...form.getInputProps('outstanding_obligations', { type: 'checkbox' })} />
            {form.values.outstanding_obligations && (
              <Textarea label="Obligation Notes" minRows={2} {...form.getInputProps('outstanding_obligations_notes')} />
            )}
            <Select label="Status" data={statuses.data} required {...form.getInputProps('status_id')} />
            {editing && <TextInput type="date" label="General Assembly Approval Date" {...form.getInputProps('ga_approval_date')} />}
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
