import { useState } from 'react';
import { Modal, TextInput, Select, Textarea, Button, Group, Stack, Title, Badge, NumberInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';

const ENDPOINT = '/commission-kpi-reports';

interface KpiReport {
  id: number;
  plan_year: number;
  kpis_established: string;
  established_on: string;
  mid_year_reviewed_on: string | null;
  year_end_reviewed_on: string | null;
  status_id: number;
  pillar?: { label_en: string };
  status?: { label_en: string };
}

export function CommissionKpiReportsPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<KpiReport>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const pillars = useLookupSelect('commission-pillars', i18n.language);
  const statuses = useLookupSelect('statuses', i18n.language);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<KpiReport | null>(null);

  const form = useForm({
    initialValues: {
      pillar_id: '', plan_year: new Date().getFullYear(), kpis_established: '', established_on: '',
      mid_year_review_notes: '', mid_year_reviewed_on: '', year_end_review_notes: '', year_end_reviewed_on: '',
      status_id: '',
    },
    validate: {
      pillar_id: (v) => (v ? null : 'Required'),
      kpis_established: (v) => (v ? null : 'Required'),
      established_on: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: KpiReport) {
    setEditing(row);
    form.setValues({
      pillar_id: '', plan_year: row.plan_year, kpis_established: row.kpis_established, established_on: row.established_on,
      mid_year_review_notes: '', mid_year_reviewed_on: row.mid_year_reviewed_on ?? '',
      year_end_review_notes: '', year_end_reviewed_on: row.year_end_reviewed_on ?? '',
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
            mid_year_review_notes: values.mid_year_review_notes || null,
            mid_year_reviewed_on: values.mid_year_reviewed_on || null,
            year_end_review_notes: values.year_end_review_notes || null,
            year_end_reviewed_on: values.year_end_reviewed_on || null,
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

  const columns: DataTableColumn<KpiReport>[] = [
    { key: 'pillar', header: 'Pillar', render: (r) => r.pillar?.label_en ?? '—', exportValue: (r) => r.pillar?.label_en ?? '' },
    { key: 'plan_year', header: 'Year' },
    { key: 'established_on', header: 'Established On' },
    { key: 'mid_year_reviewed_on', header: 'Mid-Year Reviewed' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">COMM-002 — Commission KPI Reports</Title>
      <DataTable<KpiReport>
        title="Annual KPI Reports"
        moduleKey="commission-kpi-reports"
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update KPI Report' : 'New KPI Report (COMM-002)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <Group grow>
                  <Select label="Commission Pillar" data={pillars.data} required {...form.getInputProps('pillar_id')} />
                  <NumberInput label="Plan Year" required min={2020} max={2100} {...form.getInputProps('plan_year')} />
                </Group>
                <Textarea label="KPIs Established" required minRows={4} {...form.getInputProps('kpis_established')} />
                <TextInput type="date" label="Established On (start of year)" required {...form.getInputProps('established_on')} />
              </>
            )}
            {editing && (
              <>
                <Group grow>
                  <TextInput type="date" label="Mid-Year Reviewed On" {...form.getInputProps('mid_year_reviewed_on')} />
                  <TextInput type="date" label="Year-End Reviewed On" {...form.getInputProps('year_end_reviewed_on')} />
                </Group>
                <Textarea label="Mid-Year Review Notes" minRows={2} {...form.getInputProps('mid_year_review_notes')} />
                <Textarea label="Year-End Review Notes" minRows={2} {...form.getInputProps('year_end_review_notes')} />
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
