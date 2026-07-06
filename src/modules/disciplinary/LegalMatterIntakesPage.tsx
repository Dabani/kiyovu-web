import { useState } from 'react';
import { Modal, TextInput, Select, Textarea, Button, Group, Stack, Title, Badge } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';

const ENDPOINT = '/legal-matter-intakes';

interface LegalIntake {
  id: number;
  matter_description: string;
  notified_by_name: string;
  notified_on: string;
  deadline_date: string | null;
  reported_to_president: boolean;
  status_id: number;
  forum?: { label_en: string };
  urgency?: { label_en: string };
  status?: { label_en: string };
}

export function LegalMatterIntakesPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<LegalIntake>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const forums = useLookupSelect('legal-forums', i18n.language);
  const urgencies = useLookupSelect('legal-urgency', i18n.language);
  const statuses = useLookupSelect('statuses', i18n.language);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LegalIntake | null>(null);

  const form = useForm({
    initialValues: {
      matter_description: '', notified_by_name: '', notified_by_role: '', notified_on: '',
      status_id: '', forum_id: '', urgency_id: '', classified_on: '', deadline_date: '',
    },
    validate: {
      matter_description: (v) => (v ? null : 'Required'),
      notified_by_name: (v) => (v ? null : 'Required'),
      notified_on: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: LegalIntake) {
    setEditing(row);
    form.setValues({
      matter_description: row.matter_description, notified_by_name: row.notified_by_name, notified_by_role: '',
      notified_on: row.notified_on, status_id: String(row.status_id), forum_id: '', urgency_id: '',
      classified_on: '', deadline_date: row.deadline_date ?? '',
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      update.mutate(
        {
          id: editing.id,
          payload: {
            forum_id: values.forum_id || null, urgency_id: values.urgency_id || null,
            classified_on: values.classified_on || null, deadline_date: values.deadline_date || null,
            status_id: values.status_id,
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

  const columns: DataTableColumn<LegalIntake>[] = [
    { key: 'notified_by_name', header: 'Notified By' },
    { key: 'notified_on', header: 'Notified On' },
    { key: 'forum', header: 'Forum', render: (r) => r.forum?.label_en ?? '—', exportValue: (r) => r.forum?.label_en ?? '' },
    { key: 'urgency', header: 'Urgency', render: (r) => r.urgency?.label_en ?? '—', exportValue: (r) => r.urgency?.label_en ?? '' },
    {
      key: 'reported_to_president', header: 'Reported to President',
      render: (r) => (r.reported_to_president ? <Badge color="orange">Yes</Badge> : <Badge color="gray">No</Badge>),
      exportValue: (r) => (r.reported_to_president ? 'Yes' : 'No'),
    },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">LEG-001 — Legal Matter Intake</Title>
      <DataTable<LegalIntake>
        title="Legal Matter Intakes"
        moduleKey="legal-matter-intakes"
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
          { key: 'forum_id', label: 'Forum', options: forums.data },
          { key: 'status_id', label: 'Status', options: statuses.data },
        ]}
        activeFilters={list.filters}
        onFilterChange={list.onFilterChange}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={(row) => list.deleteRow(row.id)}
        onGenerateReport={handleReport}
      />

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Matter' : 'New Legal Matter Intake (LEG-001)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <Textarea label="Matter Description" required minRows={3} {...form.getInputProps('matter_description')} />
                <Group grow>
                  <TextInput label="Notified By" required {...form.getInputProps('notified_by_name')} />
                  <TextInput label="Role" {...form.getInputProps('notified_by_role')} />
                </Group>
                <TextInput type="date" label="Notified On (within 48 hours)" required {...form.getInputProps('notified_on')} />
              </>
            )}
            <Group grow>
              <Select label="Forum" data={forums.data} clearable {...form.getInputProps('forum_id')} />
              <Select label="Urgency" data={urgencies.data} clearable {...form.getInputProps('urgency_id')} />
            </Group>
            <Group grow>
              <TextInput type="date" label="Classified On (within 5 days)" {...form.getInputProps('classified_on')} />
              <TextInput type="date" label="Deadline Date" {...form.getInputProps('deadline_date')} />
            </Group>
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
