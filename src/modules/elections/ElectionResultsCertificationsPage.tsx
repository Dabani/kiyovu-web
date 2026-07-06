import { useState } from 'react';
import { Modal, TextInput, Select, Checkbox, Button, Group, Stack, Title, Badge, NumberInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';
import { useNominationOptions } from '../../hooks/useNominationOptions';

const ENDPOINT = '/election-results-certifications';

interface Certification {
  id: number;
  election_cycle_year: number;
  certified_on: string;
  filed_with_secretary_general: boolean;
  handover_date: string | null;
  status_id: number;
  position?: { label_en: string };
  winningNomination?: { candidate_full_name: string };
  status?: { label_en: string };
}

export function ElectionResultsCertificationsPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<Certification>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const positions = useLookupSelect('elected-positions', i18n.language);
  const statuses = useLookupSelect('statuses', i18n.language);
  const nominations = useNominationOptions();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Certification | null>(null);

  const form = useForm({
    initialValues: {
      election_cycle_year: new Date().getFullYear(), position_id: '', winning_nomination_id: '',
      was_tie_broken_by_lots: false, certified_on: '', commission_member_1_name: '',
      commission_member_2_name: '', commission_member_3_name: '', status_id: '',
      filed_with_secretary_general: false, handover_date: '',
    },
    validate: {
      position_id: (v) => (v ? null : 'Required'),
      winning_nomination_id: (v) => (v ? null : 'Required'),
      certified_on: (v) => (v ? null : 'Required'),
      commission_member_1_name: (v) => (v ? null : 'Required'),
      commission_member_2_name: (v) => (v ? null : 'Required'),
      commission_member_3_name: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: Certification) {
    setEditing(row);
    form.setValues({
      election_cycle_year: row.election_cycle_year, position_id: '', winning_nomination_id: '',
      was_tie_broken_by_lots: false, certified_on: row.certified_on, commission_member_1_name: '',
      commission_member_2_name: '', commission_member_3_name: '', status_id: String(row.status_id),
      filed_with_secretary_general: row.filed_with_secretary_general, handover_date: row.handover_date ?? '',
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      update.mutate(
        {
          id: editing.id,
          payload: {
            filed_with_secretary_general: values.filed_with_secretary_general,
            handover_date: values.handover_date || null, status_id: values.status_id,
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

  const columns: DataTableColumn<Certification>[] = [
    { key: 'position', header: 'Position', render: (r) => r.position?.label_en ?? '—', exportValue: (r) => r.position?.label_en ?? '' },
    { key: 'winningNomination', header: 'Winner', render: (r) => r.winningNomination?.candidate_full_name ?? '—', exportValue: (r) => r.winningNomination?.candidate_full_name ?? '' },
    { key: 'election_cycle_year', header: 'Cycle Year' },
    { key: 'certified_on', header: 'Certified On' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">ELEC-003 — Results Certification</Title>
      <DataTable<Certification>
        title="Results Certifications"
        moduleKey="election-results-certifications"
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
          { key: 'position_id', label: 'Position', options: positions.data },
          { key: 'status_id', label: 'Status', options: statuses.data },
        ]}
        activeFilters={list.filters}
        onFilterChange={list.onFilterChange}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={(row) => list.deleteRow(row.id)}
        onGenerateReport={handleReport}
      />

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Certification' : 'New Results Certification (ELEC-003)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <Group grow>
                  <NumberInput label="Election Cycle Year" required min={2020} max={2100} {...form.getInputProps('election_cycle_year')} />
                  <Select label="Position" data={positions.data} required {...form.getInputProps('position_id')} />
                </Group>
                <Select label="Winning Candidate" data={nominations.data ?? []} required searchable {...form.getInputProps('winning_nomination_id')} />
                <Checkbox label="Tie broken by draw of lots" {...form.getInputProps('was_tie_broken_by_lots', { type: 'checkbox' })} />
                <TextInput type="date" label="Certified On" required {...form.getInputProps('certified_on')} />
                <TextInput label="Electoral Commission Member 1" required {...form.getInputProps('commission_member_1_name')} />
                <TextInput label="Electoral Commission Member 2" required {...form.getInputProps('commission_member_2_name')} />
                <TextInput label="Electoral Commission Member 3" required {...form.getInputProps('commission_member_3_name')} />
              </>
            )}
            <Checkbox label="Filed with Secretary General" {...form.getInputProps('filed_with_secretary_general', { type: 'checkbox' })} />
            {editing && <TextInput type="date" label="Handover Date" {...form.getInputProps('handover_date')} />}
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
