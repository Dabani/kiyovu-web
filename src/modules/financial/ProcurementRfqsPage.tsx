import { useState } from 'react';
import { Modal, TextInput, Select, Textarea, Button, Group, Stack, Title, Badge, NumberInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';

const ENDPOINT = '/procurement-rfqs';

interface Rfq {
  id: number;
  item_description: string;
  estimated_value_rwf: number;
  quotations_received: number;
  selected_vendor_name: string | null;
  rfq_date: string;
  status_id: number;
  status?: { label_en: string };
}

export function ProcurementRfqsPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<Rfq>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const statuses = useLookupSelect('statuses', i18n.language);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Rfq | null>(null);

  const form = useForm({
    initialValues: {
      item_description: '', estimated_value_rwf: '', rfq_date: '', status_id: '',
      quotations_received: 0, evaluation_notes: '', selected_vendor_name: '', award_date: '',
    },
    validate: {
      item_description: (v) => (v ? null : 'Required'),
      estimated_value_rwf: (v) => {
        const n = Number(v);
        if (!v) return 'Required';
        if (n <= 50000 || n > 5000000) return 'Must be between RWF 50,001 and 5,000,000 (Art. 898)';
        return null;
      },
      rfq_date: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: Rfq) {
    setEditing(row);
    form.setValues({
      item_description: row.item_description, estimated_value_rwf: String(row.estimated_value_rwf),
      rfq_date: row.rfq_date, status_id: String(row.status_id), quotations_received: row.quotations_received,
      evaluation_notes: '', selected_vendor_name: row.selected_vendor_name ?? '', award_date: '',
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      update.mutate(
        {
          id: editing.id,
          payload: {
            quotations_received: values.quotations_received, evaluation_notes: values.evaluation_notes || null,
            selected_vendor_name: values.selected_vendor_name || null, award_date: values.award_date || null,
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

  const columns: DataTableColumn<Rfq>[] = [
    { key: 'item_description', header: 'Item' },
    { key: 'estimated_value_rwf', header: 'Estimated Value (RWF)' },
    { key: 'quotations_received', header: 'Quotations' },
    { key: 'selected_vendor_name', header: 'Selected Vendor' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">PROC-002 — Requests for Quotations</Title>
      <DataTable<Rfq>
        title="Requests for Quotations (RWF 500,001–5,000,000)"
        moduleKey="procurement-rfqs"
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update RFQ' : 'New RFQ (PROC-002)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <TextInput label="Item Description" required {...form.getInputProps('item_description')} />
                <NumberInput label="Estimated Value (RWF)" required min={50001} max={5000000} {...form.getInputProps('estimated_value_rwf')} />
                <TextInput type="date" label="RFQ Date" required {...form.getInputProps('rfq_date')} />
              </>
            )}
            {editing && (
              <>
                <NumberInput label="Quotations Received (min. 3 before award)" min={0} {...form.getInputProps('quotations_received')} />
                <Textarea label="Evaluation Notes" minRows={2} {...form.getInputProps('evaluation_notes')} />
                <TextInput label="Selected Vendor" {...form.getInputProps('selected_vendor_name')} />
                <TextInput type="date" label="Award Date" {...form.getInputProps('award_date')} />
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
