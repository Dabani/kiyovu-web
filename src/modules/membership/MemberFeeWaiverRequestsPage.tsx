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

const ENDPOINT = '/member-fee-waiver-requests';

interface WaiverRequest {
  id: number;
  hardship_justification: string;
  requested_on: string;
  reviewed_on: string | null;
  valid_until: string | null;
  status_id: number;
  member?: { label: string };
  status?: { label_en: string };
}

export function MemberFeeWaiverRequestsPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<WaiverRequest>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const statuses = useLookupSelect('statuses', i18n.language);
  const members = useMemberOptions();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<WaiverRequest | null>(null);

  const form = useForm({
    initialValues: { member_id: '', requested_on: '', hardship_justification: '', status_id: '', reviewed_on: '', valid_until: '' },
    validate: {
      member_id: (v) => (v ? null : 'Required'),
      requested_on: (v) => (v ? null : 'Required'),
      hardship_justification: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: WaiverRequest) {
    setEditing(row);
    form.setValues({
      member_id: '', requested_on: row.requested_on, hardship_justification: row.hardship_justification,
      status_id: String(row.status_id), reviewed_on: row.reviewed_on ?? '', valid_until: row.valid_until ?? '',
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      update.mutate(
        {
          id: editing.id,
          payload: {
            hardship_justification: values.hardship_justification, status_id: values.status_id,
            reviewed_on: values.reviewed_on || null, valid_until: values.valid_until || null,
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

  const columns: DataTableColumn<WaiverRequest>[] = [
    { key: 'member', header: 'Member', render: (r) => r.member?.label ?? '—', exportValue: (r) => r.member?.label ?? '' },
    { key: 'hardship_justification', header: 'Justification' },
    { key: 'requested_on', header: 'Requested On' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
    { key: 'valid_until', header: 'Valid Until (Art. 15(3) — annual renewal)' },
  ];

  return (
    <>
      <Title order={2} mb="md">MEM-005 — Fee Waiver Requests</Title>
      <DataTable<WaiverRequest>
        title="Fee Waiver Requests"
        moduleKey="member-fee-waiver-requests"
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Request' : 'New Fee Waiver Request (MEM-005)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && <Select label="Member" data={members.data ?? []} required searchable {...form.getInputProps('member_id')} />}
            <Textarea label="Hardship Justification" required minRows={3} {...form.getInputProps('hardship_justification')} />
            {!editing && <TextInput type="date" label="Requested On" required {...form.getInputProps('requested_on')} />}
            <Select label="Status" data={statuses.data} required {...form.getInputProps('status_id')} />
            {editing && (
              <Group grow>
                <TextInput type="date" label="Reviewed On" {...form.getInputProps('reviewed_on')} />
                <TextInput type="date" label="Valid Until" {...form.getInputProps('valid_until')} />
              </Group>
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
