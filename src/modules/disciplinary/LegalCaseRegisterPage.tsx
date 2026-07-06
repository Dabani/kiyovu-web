import { useState } from 'react';
import { Modal, TextInput, Select, Textarea, Checkbox, Button, Group, Stack, Title, Badge } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';

const ENDPOINT = '/legal-case-register';

interface RegisterEntry {
  id: number;
  case_reference: string;
  opened_on: string;
  outcome: string | null;
  closed_on: string | null;
  reported_to_executive_organ_quarterly: boolean;
  reported_to_ga_annually: boolean;
  status_id: number;
  forum?: { label_en: string };
  classification?: { label_en: string };
  status?: { label_en: string };
}

export function LegalCaseRegisterPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<RegisterEntry>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const forums = useLookupSelect('legal-forums', i18n.language);
  const classifications = useLookupSelect('document-classifications', i18n.language);
  const statuses = useLookupSelect('statuses', i18n.language);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RegisterEntry | null>(null);

  const form = useForm({
    initialValues: {
      case_reference: '', forum_id: '', classification_id: '', opened_on: '', status_id: '',
      last_updated_on: '', outcome: '', closed_on: '',
      reported_to_executive_organ_quarterly: false, reported_to_ga_annually: false,
    },
    validate: {
      case_reference: (v) => (v ? null : 'Required'),
      forum_id: (v) => (v ? null : 'Required'),
      opened_on: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: RegisterEntry) {
    setEditing(row);
    form.setValues({
      case_reference: row.case_reference, forum_id: '', classification_id: '', opened_on: row.opened_on,
      status_id: String(row.status_id), last_updated_on: '', outcome: row.outcome ?? '', closed_on: row.closed_on ?? '',
      reported_to_executive_organ_quarterly: row.reported_to_executive_organ_quarterly,
      reported_to_ga_annually: row.reported_to_ga_annually,
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      update.mutate(
        {
          id: editing.id,
          payload: {
            last_updated_on: values.last_updated_on || null, outcome: values.outcome || null,
            closed_on: values.closed_on || null,
            reported_to_executive_organ_quarterly: values.reported_to_executive_organ_quarterly,
            reported_to_ga_annually: values.reported_to_ga_annually, status_id: values.status_id,
          },
        },
        { onSuccess: () => setModalOpen(false) }
      );
    } else {
      create.mutate({ ...values, classification_id: values.classification_id || null }, { onSuccess: () => setModalOpen(false) });
    }
  }

  async function handleReport(period: ReportPeriod) {
    await downloadReport(ENDPOINT, { period: period.kind });
  }

  const columns: DataTableColumn<RegisterEntry>[] = [
    { key: 'case_reference', header: 'Case Reference' },
    { key: 'forum', header: 'Forum', render: (r) => r.forum?.label_en ?? '—', exportValue: (r) => r.forum?.label_en ?? '' },
    { key: 'classification', header: 'Confidentiality', render: (r) => r.classification?.label_en ?? '—', exportValue: (r) => r.classification?.label_en ?? '' },
    { key: 'opened_on', header: 'Opened On' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">LEG-002 — Legal Case Register</Title>
      <DataTable<RegisterEntry>
        title="Legal Case Register"
        moduleKey="legal-case-register"
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Register Entry' : 'New Case Register Entry (LEG-002)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <TextInput label="Case Reference" required {...form.getInputProps('case_reference')} />
                <Group grow>
                  <Select label="Forum" data={forums.data} required {...form.getInputProps('forum_id')} />
                  <Select label="Confidentiality Classification" data={classifications.data} clearable {...form.getInputProps('classification_id')} />
                </Group>
                <TextInput type="date" label="Opened On" required {...form.getInputProps('opened_on')} />
              </>
            )}
            {editing && (
              <>
                <TextInput type="date" label="Last Updated On" {...form.getInputProps('last_updated_on')} />
                <Textarea label="Outcome" minRows={3} {...form.getInputProps('outcome')} />
                <TextInput type="date" label="Closed On" {...form.getInputProps('closed_on')} />
                <Group grow>
                  <Checkbox label="Reported to Executive Organ (quarterly)" {...form.getInputProps('reported_to_executive_organ_quarterly', { type: 'checkbox' })} />
                  <Checkbox label="Reported to GA (annually)" {...form.getInputProps('reported_to_ga_annually', { type: 'checkbox' })} />
                </Group>
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
