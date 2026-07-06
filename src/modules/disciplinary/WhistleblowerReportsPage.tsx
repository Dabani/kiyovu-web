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

const ENDPOINT = '/whistleblower-reports';

interface WhistleblowerReport {
  id: number;
  is_anonymous: boolean;
  reporter_name: string | null;
  reported_on: string;
  description: string;
  referred_to: string | null;
  status_id: number;
  category?: { label_en: string };
  status?: { label_en: string };
}

export function WhistleblowerReportsPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<WhistleblowerReport>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const categories = useLookupSelect('whistleblower-categories', i18n.language);
  const statuses = useLookupSelect('statuses', i18n.language);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<WhistleblowerReport | null>(null);

  const form = useForm({
    initialValues: {
      category_id: '', is_anonymous: false, reporter_name: '', reported_on: '', description: '',
      status_id: '', receipt_acknowledged_on: '', initial_assessment_completed_on: '', referred_to: '',
    },
    validate: {
      category_id: (v) => (v ? null : 'Required'),
      reported_on: (v) => (v ? null : 'Required'),
      description: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: WhistleblowerReport) {
    setEditing(row);
    form.setValues({
      category_id: '', is_anonymous: row.is_anonymous, reporter_name: row.reporter_name ?? '',
      reported_on: row.reported_on, description: row.description, status_id: String(row.status_id),
      receipt_acknowledged_on: '', initial_assessment_completed_on: '', referred_to: row.referred_to ?? '',
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
            referred_to: values.referred_to || null, status_id: values.status_id,
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

  const columns: DataTableColumn<WhistleblowerReport>[] = [
    { key: 'category', header: 'Category', render: (r) => r.category?.label_en ?? '—', exportValue: (r) => r.category?.label_en ?? '' },
    {
      key: 'is_anonymous', header: 'Reporter',
      render: (r) => (r.is_anonymous ? <Badge color="gray">Anonymous</Badge> : <span>{r.reporter_name}</span>),
      exportValue: (r) => (r.is_anonymous ? 'Anonymous' : r.reporter_name ?? ''),
    },
    { key: 'reported_on', header: 'Reported On' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">DISC-005 — Whistleblower Reports</Title>
      <Alert icon={<IconShieldCheck size={16} />} color="kiyovuGreen" mb="md" variant="light">
        Reports may be submitted anonymously. Retaliation against a whistleblower is itself a disciplinary offence (Art. 274).
      </Alert>
      <DataTable<WhistleblowerReport>
        title="Whistleblower Reports"
        moduleKey="whistleblower-reports"
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
          { key: 'category_id', label: 'Category', options: categories.data },
          { key: 'status_id', label: 'Status', options: statuses.data },
        ]}
        activeFilters={list.filters}
        onFilterChange={list.onFilterChange}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={(row) => list.deleteRow(row.id)}
        onGenerateReport={handleReport}
      />

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Report' : 'New Whistleblower Report (DISC-005)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <Select label="Category" data={categories.data} required {...form.getInputProps('category_id')} />
                <Checkbox label="Submit anonymously" {...form.getInputProps('is_anonymous', { type: 'checkbox' })} />
                {!form.values.is_anonymous && (
                  <TextInput label="Reporter Name" {...form.getInputProps('reporter_name')} />
                )}
                <TextInput type="date" label="Reported On" required {...form.getInputProps('reported_on')} />
                <Textarea label="Description" required minRows={4} {...form.getInputProps('description')} />
              </>
            )}
            {editing && (
              <>
                <Group grow>
                  <TextInput type="date" label="Receipt Acknowledged On (within 7 days)" {...form.getInputProps('receipt_acknowledged_on')} />
                  <TextInput type="date" label="Initial Assessment Completed On (within 30 days)" {...form.getInputProps('initial_assessment_completed_on')} />
                </Group>
                <TextInput label="Referred To" placeholder="CRO / Board / Audit Organ / Authorities" {...form.getInputProps('referred_to')} />
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
