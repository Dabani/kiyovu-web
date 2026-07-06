import { useState } from 'react';
import { Modal, TextInput, Select, Button, Group, Stack, Title, Badge, NumberInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';

const ENDPOINT = '/hr-gift-declarations';

interface GiftDeclaration {
  id: number;
  declarant_name: string;
  gift_description: string;
  estimated_value_rwf: number;
  date_received: string;
  declared_on: string;
  status_id: number;
  position?: { label_en: string };
  disposition?: { label_en: string };
  status?: { label_en: string };
}

export function HrGiftDeclarationsPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<GiftDeclaration>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const positions = useLookupSelect('hq-positions', i18n.language);
  const dispositions = useLookupSelect('gift-dispositions', i18n.language);
  const statuses = useLookupSelect('statuses', i18n.language);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GiftDeclaration | null>(null);

  const form = useForm({
    initialValues: {
      declarant_name: '', position_id: '', gift_description: '', estimated_value_rwf: '',
      date_received: '', declared_on: '', disposition_id: '', status_id: '',
    },
    validate: {
      declarant_name: (v) => (v ? null : 'Required'),
      gift_description: (v) => (v ? null : 'Required'),
      estimated_value_rwf: (v) => (Number(v) > 30000 ? null : 'Must exceed RWF 30,000 (Art. 128 threshold)'),
      date_received: (v) => (v ? null : 'Required'),
      declared_on: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: GiftDeclaration) {
    setEditing(row);
    form.setValues({
      declarant_name: row.declarant_name, position_id: '', gift_description: row.gift_description,
      estimated_value_rwf: String(row.estimated_value_rwf), date_received: row.date_received,
      declared_on: row.declared_on, disposition_id: '', status_id: String(row.status_id),
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      update.mutate(
        { id: editing.id, payload: { disposition_id: values.disposition_id || null, status_id: values.status_id } },
        { onSuccess: () => setModalOpen(false) }
      );
    } else {
      create.mutate({ ...values, position_id: values.position_id || null, disposition_id: values.disposition_id || null }, { onSuccess: () => setModalOpen(false) });
    }
  }

  async function handleReport(period: ReportPeriod) {
    await downloadReport(ENDPOINT, { period: period.kind });
  }

  const columns: DataTableColumn<GiftDeclaration>[] = [
    { key: 'declarant_name', header: 'Declarant' },
    { key: 'gift_description', header: 'Gift' },
    { key: 'estimated_value_rwf', header: 'Value (RWF)' },
    { key: 'date_received', header: 'Date Received' },
    { key: 'disposition', header: 'Disposition', render: (r) => r.disposition?.label_en ?? '—', exportValue: (r) => r.disposition?.label_en ?? '' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">HR-004 — Gift Declarations</Title>
      <DataTable<GiftDeclaration>
        title="Gift Declarations (over RWF 30,000)"
        moduleKey="hr-gift-declarations"
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Declaration' : 'New Gift Declaration (HR-004)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <TextInput label="Declarant Name" required {...form.getInputProps('declarant_name')} />
                <Select label="Position" data={positions.data} clearable {...form.getInputProps('position_id')} />
                <TextInput label="Gift Description" required {...form.getInputProps('gift_description')} />
                <NumberInput label="Estimated Value (RWF)" required min={0} {...form.getInputProps('estimated_value_rwf')} />
                <Group grow>
                  <TextInput type="date" label="Date Received" required {...form.getInputProps('date_received')} />
                  <TextInput type="date" label="Declared On (within 5 days)" required {...form.getInputProps('declared_on')} />
                </Group>
              </>
            )}
            <Select label="Disposition" data={dispositions.data} clearable {...form.getInputProps('disposition_id')} />
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
