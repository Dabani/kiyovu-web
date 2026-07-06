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

const ENDPOINT = '/member-inactive-status-requests';

interface InactiveRequest {
  id: number;
  reason: string;
  requested_on: string;
  effective_from: string;
  max_end_date: string;
  reverted_to_active_on: string | null;
  status_id: number;
  member?: { label: string };
  status?: { label_en: string };
}

export function MemberInactiveStatusRequestsPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<InactiveRequest>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const statuses = useLookupSelect('statuses', i18n.language);
  const members = useMemberOptions();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<InactiveRequest | null>(null);

  const form = useForm({
    initialValues: { member_id: '', requested_on: '', reason: '', effective_from: '', status_id: '', reverted_to_active_on: '' },
    validate: {
      member_id: (v) => (v ? null : 'Required'),
      requested_on: (v) => (v ? null : 'Required'),
      reason: (v) => (v ? null : 'Required'),
      effective_from: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: InactiveRequest) {
    setEditing(row);
    form.setValues({
      member_id: '', requested_on: row.requested_on, reason: row.reason,
      effective_from: row.effective_from, status_id: String(row.status_id),
      reverted_to_active_on: row.reverted_to_active_on ?? '',
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      update.mutate(
        { id: editing.id, payload: { reason: values.reason, status_id: values.status_id, reverted_to_active_on: values.reverted_to_active_on || null } },
        { onSuccess: () => setModalOpen(false) }
      );
    } else {
      create.mutate(values, { onSuccess: () => setModalOpen(false) });
    }
  }

  async function handleReport(period: ReportPeriod) {
    await downloadReport(ENDPOINT, { period: period.kind });
  }

  const columns: DataTableColumn<InactiveRequest>[] = [
    { key: 'member', header: 'Member', render: (r) => r.member?.label ?? '—', exportValue: (r) => r.member?.label ?? '' },
    { key: 'reason', header: 'Reason' },
    { key: 'effective_from', header: 'Effective From' },
    { key: 'max_end_date', header: 'Max End Date (Art. 17 cap)' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">MEM-004 — Inactive Status Requests</Title>
      <DataTable<InactiveRequest>
        title="Inactive Status Requests"
        moduleKey="member-inactive-status-requests"
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Request' : 'New Inactive Status Request (MEM-004)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && <Select label="Member" data={members.data ?? []} required searchable {...form.getInputProps('member_id')} />}
            <Textarea label="Reason" required minRows={2} {...form.getInputProps('reason')} />
            {!editing && (
              <Group grow>
                <TextInput type="date" label="Requested On" required {...form.getInputProps('requested_on')} />
                <TextInput type="date" label="Effective From" required {...form.getInputProps('effective_from')} />
              </Group>
            )}
            <Select label="Status" data={statuses.data} required {...form.getInputProps('status_id')} />
            {editing && <TextInput type="date" label="Reverted to Active On" {...form.getInputProps('reverted_to_active_on')} />}
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
