import { useState } from 'react';
import { Modal, TextInput, Select, Button, Group, Stack, Title, Badge, NumberInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';
import { useFanClubOptions } from '../../hooks/useFanClubOptions';

const ENDPOINT = '/fan-club-financial-summaries';

interface FinancialSummary {
  id: number;
  report_year: number;
  total_income_rwf: number;
  total_expenses_rwf: number;
  closing_balance_rwf: number;
  status_id: number;
  fanClub?: { label: string };
  status?: { label_en: string };
}

export function FanClubFinancialSummariesPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<FinancialSummary>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const statuses = useLookupSelect('statuses', i18n.language);
  const fanClubs = useFanClubOptions();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FinancialSummary | null>(null);

  const form = useForm({
    initialValues: {
      fan_club_id: '', report_year: new Date().getFullYear(), total_income_rwf: '',
      total_expenses_rwf: '', closing_balance_rwf: '', submitted_on: '', status_id: '',
    },
    validate: {
      fan_club_id: (v) => (v ? null : 'Required'),
      total_income_rwf: (v) => (v !== '' ? null : 'Required'),
      total_expenses_rwf: (v) => (v !== '' ? null : 'Required'),
      closing_balance_rwf: (v) => (v !== '' ? null : 'Required'),
      submitted_on: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: FinancialSummary) {
    setEditing(row);
    form.setValues({
      fan_club_id: '', report_year: row.report_year, total_income_rwf: String(row.total_income_rwf),
      total_expenses_rwf: String(row.total_expenses_rwf), closing_balance_rwf: String(row.closing_balance_rwf),
      submitted_on: '', status_id: String(row.status_id),
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      update.mutate(
        {
          id: editing.id,
          payload: {
            total_income_rwf: values.total_income_rwf, total_expenses_rwf: values.total_expenses_rwf,
            closing_balance_rwf: values.closing_balance_rwf, status_id: values.status_id,
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

  const columns: DataTableColumn<FinancialSummary>[] = [
    { key: 'fanClub', header: 'Fan Club', render: (r) => r.fanClub?.label ?? '—', exportValue: (r) => r.fanClub?.label ?? '' },
    { key: 'report_year', header: 'Year' },
    { key: 'total_income_rwf', header: 'Income (RWF)' },
    { key: 'total_expenses_rwf', header: 'Expenses (RWF)' },
    { key: 'closing_balance_rwf', header: 'Closing Balance (RWF)' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">FAN-004 — Fan Club Financial Summaries</Title>
      <DataTable<FinancialSummary>
        title="Annual Financial Summaries"
        moduleKey="fan-club-financial-summaries"
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Summary' : 'New Financial Summary (FAN-004)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <Select label="Fan Club" data={fanClubs.data ?? []} required searchable {...form.getInputProps('fan_club_id')} />
                <NumberInput label="Report Year" required min={2020} max={2100} {...form.getInputProps('report_year')} />
              </>
            )}
            <Group grow>
              <NumberInput label="Total Income (RWF)" required min={0} {...form.getInputProps('total_income_rwf')} />
              <NumberInput label="Total Expenses (RWF)" required min={0} {...form.getInputProps('total_expenses_rwf')} />
            </Group>
            <NumberInput label="Closing Balance (RWF)" required {...form.getInputProps('closing_balance_rwf')} />
            {!editing && <TextInput type="date" label="Submitted On" required {...form.getInputProps('submitted_on')} />}
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
