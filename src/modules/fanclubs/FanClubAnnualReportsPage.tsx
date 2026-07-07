import { useState } from 'react';
import { Modal, TextInput, Select, Textarea, Button, Group, Stack, Title, Badge, NumberInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';
import { useFanClubOptions } from '../../hooks/useFanClubOptions';

const ENDPOINT = '/fan-club-annual-reports';

interface AnnualReport {
  id: number;
  report_year: number;
  activities_summary: string;
  submitted_on: string;
  status_id: number;
  fanClub?: { label: string };
  status?: { label_en: string };
}

export function FanClubAnnualReportsPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<AnnualReport>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const statuses = useLookupSelect('statuses', i18n.language);
  const fanClubs = useFanClubOptions();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AnnualReport | null>(null);

  const form = useForm({
    initialValues: {
      fan_club_id: '', report_year: new Date().getFullYear(), activities_summary: '',
      membership_highlights: '', financial_highlights: '', submitted_on: '', status_id: '',
    },
    validate: {
      fan_club_id: (v) => (v ? null : 'Required'),
      activities_summary: (v) => (v ? null : 'Required'),
      submitted_on: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: AnnualReport) {
    setEditing(row);
    form.setValues({
      fan_club_id: '', report_year: row.report_year, activities_summary: row.activities_summary,
      membership_highlights: '', financial_highlights: '', submitted_on: row.submitted_on,
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
            activities_summary: values.activities_summary, membership_highlights: values.membership_highlights || null,
            financial_highlights: values.financial_highlights || null, status_id: values.status_id,
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

  const columns: DataTableColumn<AnnualReport>[] = [
    { key: 'fanClub', header: 'Fan Club', render: (r) => r.fanClub?.label ?? '—', exportValue: (r) => r.fanClub?.label ?? '' },
    { key: 'report_year', header: 'Year' },
    { key: 'submitted_on', header: 'Submitted On' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">FAN-003 — Fan Club Annual Reports</Title>
      <DataTable<AnnualReport>
        title="Annual Reports"
        moduleKey="fan-club-annual-reports"
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Report' : 'New Annual Report (FAN-003)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <Select label="Fan Club" data={fanClubs.data ?? []} required searchable {...form.getInputProps('fan_club_id')} />
                <NumberInput label="Report Year" required min={2020} max={2100} {...form.getInputProps('report_year')} />
              </>
            )}
            <Textarea label="Activities Summary" required minRows={3} {...form.getInputProps('activities_summary')} />
            <Textarea label="Membership Highlights" minRows={2} {...form.getInputProps('membership_highlights')} />
            <Textarea label="Financial Highlights" minRows={2} {...form.getInputProps('financial_highlights')} />
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
