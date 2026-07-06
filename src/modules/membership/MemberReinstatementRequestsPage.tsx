import { useState } from 'react';
import { Modal, Select, Textarea, TextInput, Button, Group, Stack, Title, Badge } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';
import { useMemberOptions } from '../../hooks/useMemberOptions';

const ENDPOINT = '/member-reinstatement-requests';

interface ReinstatementRequest {
  id: number;
  compliance_evidence: string;
  submitted_on: string;
  suspension_completed_on: string;
  cro_recommendation: string | null;
  decided_on: string | null;
  ongoing_conditions: string | null;
  status_id: number;
  member?: { label: string };
  status?: { label_en: string };
}

export function MemberReinstatementRequestsPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<ReinstatementRequest>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const statuses = useLookupSelect('statuses', i18n.language);
  const members = useMemberOptions();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ReinstatementRequest | null>(null);

  const form = useForm({
    initialValues: {
      member_id: '', submitted_on: '', suspension_completed_on: '', compliance_evidence: '',
      status_id: '', cro_recommendation: '', decided_on: '', ongoing_conditions: '',
    },
    validate: {
      member_id: (v) => (v ? null : 'Required'),
      submitted_on: (v) => (v ? null : 'Required'),
      suspension_completed_on: (v) => (v ? null : 'Required'),
      compliance_evidence: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: ReinstatementRequest) {
    setEditing(row);
    form.setValues({
      member_id: '', submitted_on: row.submitted_on, suspension_completed_on: row.suspension_completed_on,
      compliance_evidence: row.compliance_evidence, status_id: String(row.status_id),
      cro_recommendation: row.cro_recommendation ?? '', decided_on: row.decided_on ?? '',
      ongoing_conditions: row.ongoing_conditions ?? '',
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      update.mutate(
        {
          id: editing.id,
          payload: {
            cro_recommendation: values.cro_recommendation || null, status_id: values.status_id,
            decided_on: values.decided_on || null, ongoing_conditions: values.ongoing_conditions || null,
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

  const columns: DataTableColumn<ReinstatementRequest>[] = [
    { key: 'member', header: 'Member', render: (r) => r.member?.label ?? '—', exportValue: (r) => r.member?.label ?? '' },
    { key: 'suspension_completed_on', header: 'Suspension Completed' },
    { key: 'submitted_on', header: 'Submitted On' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
    { key: 'decided_on', header: 'Decided On' },
  ];

  return (
    <>
      <Title order={2} mb="md">MEM-007 — Reinstatement Requests</Title>
      <DataTable<ReinstatementRequest>
        title="Reinstatement Requests"
        moduleKey="member-reinstatement-requests"
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Request' : 'New Reinstatement Application (MEM-007)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && <Select label="Member" data={members.data ?? []} required searchable {...form.getInputProps('member_id')} />}
            {!editing && (
              <Group grow>
                <TextInput type="date" label="Suspension Completed On" required {...form.getInputProps('suspension_completed_on')} />
                <TextInput type="date" label="Submitted On" required {...form.getInputProps('submitted_on')} />
              </Group>
            )}
            <Textarea label="Compliance Evidence" required minRows={3} {...form.getInputProps('compliance_evidence')} />
            <Textarea label="CRO Recommendation" minRows={2} {...form.getInputProps('cro_recommendation')} />
            <Select label="Status" data={statuses.data} required {...form.getInputProps('status_id')} />
            {editing && (
              <>
                <TextInput type="date" label="Decided On" {...form.getInputProps('decided_on')} />
                <Textarea label="Ongoing Conditions" minRows={2} {...form.getInputProps('ongoing_conditions')} />
              </>
            )}
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
