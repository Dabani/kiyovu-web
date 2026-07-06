import { useState } from 'react';
import { Modal, TextInput, Select, Textarea, Checkbox, Button, Group, Stack, Title, Badge } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';
import { useDisciplinaryCaseOptions } from '../../hooks/useDisciplinaryCaseOptions';

const ENDPOINT = '/disciplinary-notices';

interface Notice {
  id: number;
  issued_on: string;
  response_deadline: string | null;
  hearing_date: string | null;
  hearing_venue: string | null;
  respondent_acknowledged: boolean;
  status_id: number;
  case?: { label: string };
  noticeType?: { label_en: string };
  status?: { label_en: string };
}

export function DisciplinaryNoticesPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<Notice>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const noticeTypes = useLookupSelect('notice-types', i18n.language);
  const statuses = useLookupSelect('statuses', i18n.language);
  const cases = useDisciplinaryCaseOptions();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Notice | null>(null);

  const form = useForm({
    initialValues: {
      case_id: '', notice_type_id: '', issued_on: '', response_deadline: '', hearing_date: '',
      hearing_venue: '', allegations_summary: '', respondent_acknowledged: false,
      respondent_response_received_on: '', status_id: '',
    },
    validate: {
      case_id: (v) => (v ? null : 'Required'),
      notice_type_id: (v) => (v ? null : 'Required'),
      issued_on: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: Notice) {
    setEditing(row);
    form.setValues({
      case_id: '', notice_type_id: '', issued_on: row.issued_on, response_deadline: row.response_deadline ?? '',
      hearing_date: row.hearing_date ?? '', hearing_venue: row.hearing_venue ?? '', allegations_summary: '',
      respondent_acknowledged: row.respondent_acknowledged, respondent_response_received_on: '',
      status_id: String(row.status_id),
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      update.mutate(
        {
          id: editing.id,
          payload: {
            respondent_acknowledged: values.respondent_acknowledged,
            respondent_response_received_on: values.respondent_response_received_on || null,
            status_id: values.status_id,
          },
        },
        { onSuccess: () => setModalOpen(false) }
      );
    } else {
      create.mutate(
        { ...values, response_deadline: values.response_deadline || null, hearing_date: values.hearing_date || null },
        { onSuccess: () => setModalOpen(false) }
      );
    }
  }

  async function handleReport(period: ReportPeriod) {
    await downloadReport(ENDPOINT, { period: period.kind });
  }

  const columns: DataTableColumn<Notice>[] = [
    { key: 'case', header: 'Case', render: (r) => r.case?.label ?? '—', exportValue: (r) => r.case?.label ?? '' },
    { key: 'noticeType', header: 'Type', render: (r) => r.noticeType?.label_en ?? '—', exportValue: (r) => r.noticeType?.label_en ?? '' },
    { key: 'issued_on', header: 'Issued On' },
    { key: 'response_deadline', header: 'Response Deadline' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">DISC-003 — Disciplinary Notices</Title>
      <DataTable<Notice>
        title="Disciplinary Notices"
        moduleKey="disciplinary-notices"
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
          { key: 'notice_type_id', label: 'Type', options: noticeTypes.data },
          { key: 'status_id', label: 'Status', options: statuses.data },
        ]}
        activeFilters={list.filters}
        onFilterChange={list.onFilterChange}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={(row) => list.deleteRow(row.id)}
        onGenerateReport={handleReport}
      />

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Notice' : 'New Disciplinary Notice (DISC-003)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <Select label="Case" data={cases.data ?? []} required searchable {...form.getInputProps('case_id')} />
                <Select label="Notice Type" data={noticeTypes.data} required {...form.getInputProps('notice_type_id')} />
                <Group grow>
                  <TextInput type="date" label="Issued On" required {...form.getInputProps('issued_on')} />
                  <TextInput type="date" label="Response Deadline (min. 14 days)" {...form.getInputProps('response_deadline')} />
                </Group>
                <Group grow>
                  <TextInput type="date" label="Hearing Date" {...form.getInputProps('hearing_date')} />
                  <TextInput label="Hearing Venue" {...form.getInputProps('hearing_venue')} />
                </Group>
                <Textarea label="Allegations Summary" minRows={3} {...form.getInputProps('allegations_summary')} />
              </>
            )}
            {editing && (
              <>
                <Checkbox label="Respondent acknowledged notice" {...form.getInputProps('respondent_acknowledged', { type: 'checkbox' })} />
                <TextInput type="date" label="Respondent Response Received On" {...form.getInputProps('respondent_response_received_on')} />
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
