import { useState } from 'react';
import { Modal, TextInput, Select, Textarea, Checkbox, Button, Group, Stack, Title, Badge } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';
import { useAssetOptions } from '../../hooks/useAssetOptions';

const ENDPOINT = '/asset-handovers';

interface Handover {
  id: number;
  outgoing_custodian_name: string;
  incoming_custodian_name: string;
  handover_date: string;
  outgoing_signed: boolean;
  incoming_signed: boolean;
  status_id: number;
  asset?: { label: string };
  status?: { label_en: string };
}

export function AssetHandoversPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<Handover>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const statuses = useLookupSelect('statuses', i18n.language);
  const assets = useAssetOptions();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Handover | null>(null);

  const form = useForm({
    initialValues: {
      asset_id: '', outgoing_custodian_name: '', incoming_custodian_name: '', handover_date: '',
      condition_notes: '', outgoing_signed: false, incoming_signed: false, status_id: '',
    },
    validate: {
      asset_id: (v) => (v ? null : 'Required'),
      outgoing_custodian_name: (v) => (v ? null : 'Required'),
      incoming_custodian_name: (v) => (v ? null : 'Required'),
      handover_date: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: Handover) {
    setEditing(row);
    form.setValues({
      asset_id: '', outgoing_custodian_name: row.outgoing_custodian_name,
      incoming_custodian_name: row.incoming_custodian_name, handover_date: row.handover_date,
      condition_notes: '', outgoing_signed: row.outgoing_signed, incoming_signed: row.incoming_signed,
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
            condition_notes: values.condition_notes || null, outgoing_signed: values.outgoing_signed,
            incoming_signed: values.incoming_signed, status_id: values.status_id,
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

  const columns: DataTableColumn<Handover>[] = [
    { key: 'asset', header: 'Asset', render: (r) => r.asset?.label ?? '—', exportValue: (r) => r.asset?.label ?? '' },
    { key: 'outgoing_custodian_name', header: 'Outgoing' },
    { key: 'incoming_custodian_name', header: 'Incoming' },
    { key: 'handover_date', header: 'Handover Date' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">ASSET-003 — Asset Handovers</Title>
      <DataTable<Handover>
        title="Asset Handovers"
        moduleKey="asset-handovers"
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Handover' : 'New Asset Handover (ASSET-003)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <Select label="Asset" data={assets.data ?? []} required searchable {...form.getInputProps('asset_id')} />
                <Group grow>
                  <TextInput label="Outgoing Custodian" required {...form.getInputProps('outgoing_custodian_name')} />
                  <TextInput label="Incoming Custodian" required {...form.getInputProps('incoming_custodian_name')} />
                </Group>
                <TextInput type="date" label="Handover Date" required {...form.getInputProps('handover_date')} />
                <Textarea label="Condition Notes" minRows={2} {...form.getInputProps('condition_notes')} />
              </>
            )}
            {editing && (
              <Group grow>
                <Checkbox label="Outgoing signed" {...form.getInputProps('outgoing_signed', { type: 'checkbox' })} />
                <Checkbox label="Incoming signed" {...form.getInputProps('incoming_signed', { type: 'checkbox' })} />
              </Group>
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
