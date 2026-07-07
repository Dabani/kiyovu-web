import { useState } from 'react';
import { Modal, TextInput, Select, Textarea, Button, Group, Stack, Title, Badge, NumberInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';

const ENDPOINT = '/commission-annual-work-plans';

interface WorkPlan {
  id: number;
  plan_year: number;
  objectives: string;
  submitted_on: string;
  executive_organ_approved_on: string | null;
  status_id: number;
  pillar?: { label_en: string };
  status?: { label_en: string };
}

export function CommissionAnnualWorkPlansPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<WorkPlan>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const pillars = useLookupSelect('commission-pillars', i18n.language);
  const statuses = useLookupSelect('statuses', i18n.language);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<WorkPlan | null>(null);

  const form = useForm({
    initialValues: { pillar_id: '', plan_year: new Date().getFullYear(), objectives: '', submitted_on: '', executive_organ_approved_on: '', status_id: '' },
    validate: {
      pillar_id: (v) => (v ? null : 'Required'),
      objectives: (v) => (v ? null : 'Required'),
      submitted_on: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: WorkPlan) {
    setEditing(row);
    form.setValues({
      pillar_id: '', plan_year: row.plan_year, objectives: row.objectives, submitted_on: row.submitted_on,
      executive_organ_approved_on: row.executive_organ_approved_on ?? '', status_id: String(row.status_id),
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      update.mutate(
        { id: editing.id, payload: { objectives: values.objectives, executive_organ_approved_on: values.executive_organ_approved_on || null, status_id: values.status_id } },
        { onSuccess: () => setModalOpen(false) }
      );
    } else {
      create.mutate(values, { onSuccess: () => setModalOpen(false) });
    }
  }

  async function handleReport(period: ReportPeriod) {
    await downloadReport(ENDPOINT, { period: period.kind });
  }

  const columns: DataTableColumn<WorkPlan>[] = [
    { key: 'pillar', header: 'Pillar', render: (r) => r.pillar?.label_en ?? '—', exportValue: (r) => r.pillar?.label_en ?? '' },
    { key: 'plan_year', header: 'Year' },
    { key: 'submitted_on', header: 'Submitted On' },
    { key: 'executive_organ_approved_on', header: 'EO Approved On' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">COMM-001 — Commission Annual Work Plans</Title>
      <DataTable<WorkPlan>
        title="Annual Work Plans"
        moduleKey="commission-annual-work-plans"
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
          { key: 'pillar_id', label: 'Pillar', options: pillars.data },
          { key: 'status_id', label: 'Status', options: statuses.data },
        ]}
        activeFilters={list.filters}
        onFilterChange={list.onFilterChange}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={(row) => list.deleteRow(row.id)}
        onGenerateReport={handleReport}
      />

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Work Plan' : 'New Annual Work Plan (COMM-001)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <Group grow>
                <Select label="Commission Pillar" data={pillars.data} required {...form.getInputProps('pillar_id')} />
                <NumberInput label="Plan Year" required min={2020} max={2100} {...form.getInputProps('plan_year')} />
              </Group>
            )}
            <Textarea label="Objectives" required minRows={4} {...form.getInputProps('objectives')} />
            {!editing && <TextInput type="date" label="Submitted On" required {...form.getInputProps('submitted_on')} />}
            {editing && <TextInput type="date" label="Executive Organ Approved On (before start of year)" {...form.getInputProps('executive_organ_approved_on')} />}
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
