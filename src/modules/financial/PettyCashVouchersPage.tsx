import { useState } from 'react';
import { Modal, TextInput, Select, Checkbox, Button, Group, Stack, Title, Badge, NumberInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';

const ENDPOINT = '/petty-cash-vouchers';

interface Voucher {
  id: number;
  description: string;
  amount_rwf: number;
  department: string;
  requested_by_name: string;
  voucher_date: string;
  receipt_attached: boolean;
  status_id: number;
  status?: { label_en: string };
}

export function PettyCashVouchersPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<Voucher>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const statuses = useLookupSelect('statuses', i18n.language);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Voucher | null>(null);

  const form = useForm({
    initialValues: {
      description: '', amount_rwf: '', department: '', requested_by_name: '',
      departmental_head_name: '', voucher_date: '', receipt_attached: false, status_id: '',
    },
    validate: {
      description: (v) => (v ? null : 'Required'),
      amount_rwf: (v) => {
        const n = Number(v);
        if (!v) return 'Required';
        return n > 50000 ? 'Petty cash is capped at RWF 50,000 (Art. 888) — use FIN-001 for larger amounts' : null;
      },
      department: (v) => (v ? null : 'Required'),
      requested_by_name: (v) => (v ? null : 'Required'),
      departmental_head_name: (v) => (v ? null : 'Required'),
      voucher_date: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: Voucher) {
    setEditing(row);
    form.setValues({
      description: row.description, amount_rwf: String(row.amount_rwf), department: row.department,
      requested_by_name: row.requested_by_name, departmental_head_name: '', voucher_date: row.voucher_date,
      receipt_attached: row.receipt_attached, status_id: String(row.status_id),
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      update.mutate(
        { id: editing.id, payload: { receipt_attached: values.receipt_attached, status_id: values.status_id } },
        { onSuccess: () => setModalOpen(false) }
      );
    } else {
      create.mutate(values, { onSuccess: () => setModalOpen(false) });
    }
  }

  async function handleReport(period: ReportPeriod) {
    await downloadReport(ENDPOINT, { period: period.kind });
  }

  const columns: DataTableColumn<Voucher>[] = [
    { key: 'description', header: 'Description' },
    { key: 'amount_rwf', header: 'Amount (RWF)' },
    { key: 'department', header: 'Department' },
    { key: 'voucher_date', header: 'Voucher Date' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">FIN-003 — Petty Cash Vouchers</Title>
      <DataTable<Voucher>
        title="Petty Cash Vouchers (up to RWF 50,000)"
        moduleKey="petty-cash-vouchers"
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Voucher' : 'New Petty Cash Voucher (FIN-003)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <TextInput label="Description" required {...form.getInputProps('description')} />
                <NumberInput label="Amount (RWF, max 50,000)" required max={50000} {...form.getInputProps('amount_rwf')} />
                <TextInput label="Department" required {...form.getInputProps('department')} />
                <Group grow>
                  <TextInput label="Requested By" required {...form.getInputProps('requested_by_name')} />
                  <TextInput label="Departmental Head" required {...form.getInputProps('departmental_head_name')} />
                </Group>
                <TextInput type="date" label="Voucher Date" required {...form.getInputProps('voucher_date')} />
              </>
            )}
            <Checkbox label="Receipt attached" {...form.getInputProps('receipt_attached', { type: 'checkbox' })} />
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
