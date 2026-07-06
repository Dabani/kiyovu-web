import { useState } from 'react';
import { Modal, Select, Textarea, TextInput, Checkbox, Button, Group, Stack, Title, Badge } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { notifications } from '@mantine/notifications';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';

const ENDPOINT = '/honorary-nominations';

interface Nomination {
  id: number;
  nominee_name: string;
  basis_for_nomination: string;
  executive_organ_endorsed: boolean;
  board_endorsed: boolean;
  nominated_on: string;
  ga_decision_date: string | null;
  conflict_of_interest_disclosed: boolean;
  conflict_of_interest_notes: string | null;
  status_id: number;
  nomineeType?: { label_en: string };
  status?: { label_en: string };
}

export function HonoraryNominationsPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<Nomination>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const statuses = useLookupSelect('statuses', i18n.language);
  const nomineeTypes = useLookupSelect('nominee-types', i18n.language);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Nomination | null>(null);

  const form = useForm({
    initialValues: {
      nominee_name: '', nominee_type_id: '', basis_for_nomination: '',
      executive_organ_endorsed: false, board_endorsed: false, nominated_on: '',
      status_id: '', ga_decision_date: '', conflict_of_interest_disclosed: false,
      conflict_of_interest_notes: '',
    },
    validate: {
      nominee_name: (v) => (v ? null : 'Required'),
      nominee_type_id: (v) => (v ? null : 'Required'),
      basis_for_nomination: (v) => (v ? null : 'Required'),
      nominated_on: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: Nomination) {
    setEditing(row);
    form.setValues({
      nominee_name: row.nominee_name, nominee_type_id: '', basis_for_nomination: row.basis_for_nomination,
      executive_organ_endorsed: row.executive_organ_endorsed, board_endorsed: row.board_endorsed,
      nominated_on: row.nominated_on, status_id: String(row.status_id),
      ga_decision_date: row.ga_decision_date ?? '', conflict_of_interest_disclosed: row.conflict_of_interest_disclosed,
      conflict_of_interest_notes: row.conflict_of_interest_notes ?? '',
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      const { nominee_name: _n, nominee_type_id: _t, nominated_on: _d, ...editable } = values;
      update.mutate(
        { id: editing.id, payload: editable },
        {
          onSuccess: () => setModalOpen(false),
          onError: (err) => {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            if (message) notifications.show({ color: 'red', message });
          },
        }
      );
    } else {
      create.mutate(values, { onSuccess: () => setModalOpen(false) });
    }
  }

  async function handleReport(period: ReportPeriod) {
    await downloadReport(ENDPOINT, { period: period.kind });
  }

  const columns: DataTableColumn<Nomination>[] = [
    { key: 'nominee_name', header: 'Nominee' },
    { key: 'nomineeType', header: 'Type', render: (r) => r.nomineeType?.label_en ?? '—', exportValue: (r) => r.nomineeType?.label_en ?? '' },
    {
      key: 'endorsements', header: 'Endorsements',
      render: (r) => (
        <Group gap={4}>
          <Badge color={r.executive_organ_endorsed ? 'kiyovuGreen' : 'gray'} size="sm">Exec. Organ</Badge>
          <Badge color={r.board_endorsed ? 'kiyovuGreen' : 'gray'} size="sm">Board</Badge>
        </Group>
      ),
      exportValue: (r) => `Exec:${r.executive_organ_endorsed ? 'Y' : 'N'} Board:${r.board_endorsed ? 'Y' : 'N'}`,
    },
    { key: 'nominated_on', header: 'Nominated On' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">HON-001 — Honorary Membership Nominations</Title>
      <DataTable<Nomination>
        title="Honorary Nominations"
        moduleKey="honorary-nominations"
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Nomination' : 'New Honorary Nomination (HON-001)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <TextInput label="Nominee Name" required {...form.getInputProps('nominee_name')} />
                <Select label="Nominee Type" data={nomineeTypes.data} required {...form.getInputProps('nominee_type_id')} />
              </>
            )}
            <Textarea label="Basis for Nomination" required minRows={3} {...form.getInputProps('basis_for_nomination')} />
            <Group grow>
              <Checkbox label="Executive Organ endorsed" {...form.getInputProps('executive_organ_endorsed', { type: 'checkbox' })} />
              <Checkbox label="Board of Directors endorsed" {...form.getInputProps('board_endorsed', { type: 'checkbox' })} />
            </Group>
            {!editing && <TextInput type="date" label="Nominated On" required {...form.getInputProps('nominated_on')} />}
            <Select label="Status" data={statuses.data} required {...form.getInputProps('status_id')} />
            {editing && <TextInput type="date" label="General Assembly Decision Date" {...form.getInputProps('ga_decision_date')} />}
            <Checkbox label="Conflict of interest disclosed (Art. 22)" {...form.getInputProps('conflict_of_interest_disclosed', { type: 'checkbox' })} />
            {form.values.conflict_of_interest_disclosed && (
              <Textarea label="Conflict of Interest Notes" minRows={2} {...form.getInputProps('conflict_of_interest_notes')} />
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
