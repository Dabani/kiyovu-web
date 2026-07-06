import { useState } from 'react';
import { Modal, TextInput, Select, Textarea, Checkbox, Button, Group, Stack, Title, Badge } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';

const ENDPOINT = '/hr-conflict-of-interest-declarations';

interface Declaration {
  id: number;
  declarant_name: string;
  declaration_date: string;
  conflict_description: string;
  recusal_required: boolean;
  reviewed_by_name: string | null;
  next_annual_update_due: string | null;
  status_id: number;
  position?: { label_en: string };
  status?: { label_en: string };
}

export function HrConflictOfInterestPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<Declaration>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const positions = useLookupSelect('hq-positions', i18n.language);
  const statuses = useLookupSelect('statuses', i18n.language);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Declaration | null>(null);

  const form = useForm({
    initialValues: {
      declarant_name: '', position_id: '', declaration_date: '', conflict_description: '',
      recusal_required: false, reviewed_by_name: '', status_id: '',
    },
    validate: {
      declarant_name: (v) => (v ? null : 'Required'),
      declaration_date: (v) => (v ? null : 'Required'),
      conflict_description: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: Declaration) {
    setEditing(row);
    form.setValues({
      declarant_name: row.declarant_name, position_id: '', declaration_date: row.declaration_date,
      conflict_description: row.conflict_description, recusal_required: row.recusal_required,
      reviewed_by_name: row.reviewed_by_name ?? '', status_id: String(row.status_id),
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      update.mutate(
        {
          id: editing.id,
          payload: {
            conflict_description: values.conflict_description, recusal_required: values.recusal_required,
            reviewed_by_name: values.reviewed_by_name || null, status_id: values.status_id,
          },
        },
        { onSuccess: () => setModalOpen(false) }
      );
    } else {
      create.mutate({ ...values, position_id: values.position_id || null }, { onSuccess: () => setModalOpen(false) });
    }
  }

  async function handleReport(period: ReportPeriod) {
    await downloadReport(ENDPOINT, { period: period.kind });
  }

  const columns: DataTableColumn<Declaration>[] = [
    { key: 'declarant_name', header: 'Declarant' },
    { key: 'position', header: 'Position', render: (r) => r.position?.label_en ?? '—', exportValue: (r) => r.position?.label_en ?? '' },
    { key: 'declaration_date', header: 'Declaration Date' },
    {
      key: 'recusal_required', header: 'Recusal Required',
      render: (r) => (r.recusal_required ? <Badge color="orange">Yes</Badge> : <Badge color="gray">No</Badge>),
      exportValue: (r) => (r.recusal_required ? 'Yes' : 'No'),
    },
    { key: 'next_annual_update_due', header: 'Next Review Due' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">HR-003 — Conflict of Interest Declarations</Title>
      <DataTable<Declaration>
        title="Conflict of Interest Declarations"
        moduleKey="hr-conflict-of-interest-declarations"
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Declaration' : 'New Conflict of Interest Declaration (HR-003)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <TextInput label="Declarant Name" required {...form.getInputProps('declarant_name')} />
                <Select label="Position" data={positions.data} clearable {...form.getInputProps('position_id')} />
                <TextInput type="date" label="Declaration Date" required {...form.getInputProps('declaration_date')} />
              </>
            )}
            <Textarea label="Conflict Description" required minRows={3} {...form.getInputProps('conflict_description')} />
            <Checkbox label="Recusal from related deliberations required" {...form.getInputProps('recusal_required', { type: 'checkbox' })} />
            {editing && <TextInput label="Reviewed By" {...form.getInputProps('reviewed_by_name')} />}
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
