import { useState } from 'react';
import { Modal, TextInput, Select, Textarea, Button, Group, Stack, Title, Badge, NumberInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';

const ENDPOINT = '/procurement-tenders';

interface Tender {
  id: number;
  item_description: string;
  estimated_value_rwf: number;
  tender_published_on: string;
  tender_closing_date: string;
  awarded_vendor_name: string | null;
  status_id: number;
  status?: { label_en: string };
}

export function ProcurementTendersPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<Tender>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const statuses = useLookupSelect('statuses', i18n.language);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tender | null>(null);

  const form = useForm({
    initialValues: {
      item_description: '', estimated_value_rwf: '', tender_published_on: '', tender_closing_date: '',
      status_id: '', evaluation_committee_names: '', awarded_vendor_name: '', award_date: '', awarded_value_rwf: '',
    },
    validate: {
      item_description: (v) => (v ? null : 'Required'),
      estimated_value_rwf: (v) => (Number(v) > 5000000 ? null : 'Must exceed RWF 5,000,000 (Art. 898) — use PROC-002 below that'),
      tender_published_on: (v) => (v ? null : 'Required'),
      tender_closing_date: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: Tender) {
    setEditing(row);
    form.setValues({
      item_description: row.item_description, estimated_value_rwf: String(row.estimated_value_rwf),
      tender_published_on: row.tender_published_on, tender_closing_date: row.tender_closing_date,
      status_id: String(row.status_id), evaluation_committee_names: '',
      awarded_vendor_name: row.awarded_vendor_name ?? '', award_date: '', awarded_value_rwf: '',
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      update.mutate(
        {
          id: editing.id,
          payload: {
            evaluation_committee_names: values.evaluation_committee_names || null,
            awarded_vendor_name: values.awarded_vendor_name || null,
            award_date: values.award_date || null,
            awarded_value_rwf: values.awarded_value_rwf || null,
            status_id: values.status_id,
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

  const columns: DataTableColumn<Tender>[] = [
    { key: 'item_description', header: 'Item' },
    { key: 'estimated_value_rwf', header: 'Estimated Value (RWF)' },
    { key: 'tender_published_on', header: 'Published On' },
    { key: 'awarded_vendor_name', header: 'Awarded Vendor' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">PROC-003 — Competitive Tenders</Title>
      <DataTable<Tender>
        title="Competitive Tenders (above RWF 5,000,000)"
        moduleKey="procurement-tenders"
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Tender' : 'New Competitive Tender (PROC-003)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <TextInput label="Item Description" required {...form.getInputProps('item_description')} />
                <NumberInput label="Estimated Value (RWF)" required min={5000001} {...form.getInputProps('estimated_value_rwf')} />
                <Group grow>
                  <TextInput type="date" label="Tender Published On" required {...form.getInputProps('tender_published_on')} />
                  <TextInput type="date" label="Tender Closing Date" required {...form.getInputProps('tender_closing_date')} />
                </Group>
              </>
            )}
            {editing && (
              <>
                <Textarea label="Evaluation Committee Members" minRows={2} {...form.getInputProps('evaluation_committee_names')} />
                <TextInput label="Awarded Vendor" {...form.getInputProps('awarded_vendor_name')} />
                <Group grow>
                  <TextInput type="date" label="Award Date" {...form.getInputProps('award_date')} />
                  <NumberInput label="Awarded Value (RWF)" min={0} {...form.getInputProps('awarded_value_rwf')} />
                </Group>
              </>
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
