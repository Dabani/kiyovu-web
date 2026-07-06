import { useState } from 'react';
import { Modal, Select, Textarea, Button, Group, Stack, Title, Badge, Checkbox, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';
import { useMemberOptions } from '../../hooks/useMemberOptions';

const ENDPOINT = '/member-information-requests';

interface InfoRequest {
  id: number;
  information_requested: string;
  requested_on: string;
  responded_on: string | null;
  response_notes: string | null;
  denial_reason: string | null;
  appealed_to_board: boolean;
  status_id: number;
  member?: { label: string };
  status?: { label_en: string };
}


export function MemberInformationRequestsPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<InfoRequest>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const statuses = useLookupSelect('statuses', i18n.language);
  const members = useMemberOptions();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<InfoRequest | null>(null);

  const form = useForm({
    initialValues: {
      member_id: '', information_requested: '', requested_on: '', status_id: '',
      responded_on: '', response_notes: '', denial_reason: '', appealed_to_board: false,
    },
    validate: {
      member_id: (v) => (v ? null : 'Required'),
      information_requested: (v) => (v ? null : 'Required'),
      requested_on: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: InfoRequest) {
    setEditing(row);
    form.setValues({
      member_id: '', // member is fixed after creation, not re-editable
      information_requested: row.information_requested,
      requested_on: row.requested_on,
      status_id: String(row.status_id),
      responded_on: row.responded_on ?? '',
      response_notes: row.response_notes ?? '',
      denial_reason: row.denial_reason ?? '',
      appealed_to_board: row.appealed_to_board,
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      const { member_id: _memberId, requested_on: _requestedOn, ...editablePayload } = values;
      update.mutate({ id: editing.id, payload: editablePayload }, { onSuccess: () => setModalOpen(false) });
    } else {
      create.mutate(values, { onSuccess: () => setModalOpen(false) });
    }
  }

  async function handleReport(period: ReportPeriod) {
    await downloadReport(ENDPOINT, { period: period.kind });
  }

  const columns: DataTableColumn<InfoRequest>[] = [
    { key: 'member', header: 'Member', render: (r) => r.member?.label ?? '—', exportValue: (r) => r.member?.label ?? '' },
    { key: 'information_requested', header: 'Information Requested' },
    { key: 'requested_on', header: 'Requested On' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
    { key: 'responded_on', header: 'Responded On' },
  ];

  return (
    <>
      <Title order={2} mb="md">MEM-003 — Member Information Requests</Title>
      <DataTable<InfoRequest>
        title="Information Requests"
        moduleKey="member-information-requests"
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Request' : 'New Information Request (MEM-003)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <Select label="Member" data={members.data ?? []} required searchable {...form.getInputProps('member_id')} />
            )}
            <Textarea label="Information Requested" required minRows={2} {...form.getInputProps('information_requested')} />
            {!editing && <TextInput type="date" label="Requested On" required {...form.getInputProps('requested_on')} />}
            <Select label="Status" data={statuses.data} required {...form.getInputProps('status_id')} />
            {editing && (
              <>
                <TextInput type="date" label="Responded On" {...form.getInputProps('responded_on')} />
                <Textarea label="Response Notes" minRows={2} {...form.getInputProps('response_notes')} />
                <Textarea label="Denial Reason (if rejected)" minRows={2} {...form.getInputProps('denial_reason')} />
                <Checkbox label="Appealed to Board of Directors" {...form.getInputProps('appealed_to_board', { type: 'checkbox' })} />
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
