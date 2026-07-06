import { useState } from 'react';
import { Modal, TextInput, Select, Button, Group, Stack, Title, Badge, NumberInput, Checkbox, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { IconInfoCircle } from '@tabler/icons-react';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';

const ENDPOINT = '/payment-authorizations';

interface PaymentAuthorization {
  id: number;
  description: string;
  amount_rwf: number;
  payee_name: string;
  payment_date: string;
  co_signed_by_treasurer_name: string | null;
  status_id: number;
  expenditureTier?: { label_en: string };
  status?: { label_en: string };
}

export function PaymentAuthorizationsPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<PaymentAuthorization>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const tiers = useLookupSelect('expenditure-tiers', i18n.language);
  const statuses = useLookupSelect('statuses', i18n.language);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentAuthorization | null>(null);

  const form = useForm({
    initialValues: {
      description: '', amount_rwf: '', payee_name: '', payment_date: '',
      authorized_by_ceo_name: '', co_signed_by_treasurer_name: '',
      executive_organ_resolution: false, ga_resolution: false,
      supporting_documentation_ref: '', status_id: '',
    },
    validate: {
      description: (v) => (v ? null : 'Required'),
      amount_rwf: (v) => (Number(v) > 50000 ? null : 'Must exceed RWF 50,000 — use FIN-003 Petty Cash Voucher below that'),
      payee_name: (v) => (v ? null : 'Required'),
      payment_date: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  const amount = Number(form.values.amount_rwf) || 0;
  const needsCoSign = amount > 500000;

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: PaymentAuthorization) {
    setEditing(row);
    form.setValues({
      description: row.description, amount_rwf: String(row.amount_rwf), payee_name: row.payee_name,
      payment_date: row.payment_date, authorized_by_ceo_name: '',
      co_signed_by_treasurer_name: row.co_signed_by_treasurer_name ?? '',
      executive_organ_resolution: false, ga_resolution: false,
      supporting_documentation_ref: '', status_id: String(row.status_id),
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      update.mutate(
        {
          id: editing.id,
          payload: {
            authorized_by_ceo_name: values.authorized_by_ceo_name || null,
            co_signed_by_treasurer_name: values.co_signed_by_treasurer_name || null,
            executive_organ_resolution: values.executive_organ_resolution,
            ga_resolution: values.ga_resolution,
            supporting_documentation_ref: values.supporting_documentation_ref || null,
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

  const columns: DataTableColumn<PaymentAuthorization>[] = [
    { key: 'description', header: 'Description' },
    { key: 'amount_rwf', header: 'Amount (RWF)' },
    { key: 'expenditureTier', header: 'Tier', render: (r) => r.expenditureTier?.label_en ?? '—', exportValue: (r) => r.expenditureTier?.label_en ?? '' },
    { key: 'payee_name', header: 'Payee' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">FIN-001 — Payment Authorizations</Title>
      <DataTable<PaymentAuthorization>
        title="Payment Authorizations"
        moduleKey="payment-authorizations"
        columns={columns}
        rows={list.rows}
        totalCount={list.totalCount}
        page={list.page}
        pageSize={list.pageSize}
        loading={list.loading}
        search={list.search}
        onSearchChange={list.onSearchChange}
        onPageChange={list.setPage}
        filters={[
          { key: 'expenditure_tier_id', label: 'Tier', options: tiers.data },
          { key: 'status_id', label: 'Status', options: statuses.data },
        ]}
        activeFilters={list.filters}
        onFilterChange={list.onFilterChange}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={(row) => list.deleteRow(row.id)}
        onGenerateReport={handleReport}
      />

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Authorization' : 'New Payment Authorization (FIN-001)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <TextInput label="Description" required {...form.getInputProps('description')} />
                <NumberInput label="Amount (RWF)" required min={50001} {...form.getInputProps('amount_rwf')} />
                {needsCoSign && (
                  <Alert icon={<IconInfoCircle size={16} />} color="orange" variant="light">
                    Amounts above RWF 500,000 require CEO + Treasurer co-signature (Art. 888).
                  </Alert>
                )}
                <TextInput label="Payee Name" required {...form.getInputProps('payee_name')} />
                <TextInput type="date" label="Payment Date" required {...form.getInputProps('payment_date')} />
                <TextInput label="CEO Authorization Name" {...form.getInputProps('authorized_by_ceo_name')} />
                <TextInput label="Treasurer Co-Sign Name" required={needsCoSign} {...form.getInputProps('co_signed_by_treasurer_name')} />
                <TextInput label="Supporting Documentation Reference" {...form.getInputProps('supporting_documentation_ref')} />
              </>
            )}
            {editing && (
              <Group grow>
                <Checkbox label="Executive Organ resolution attached" {...form.getInputProps('executive_organ_resolution', { type: 'checkbox' })} />
                <Checkbox label="GA resolution attached" {...form.getInputProps('ga_resolution', { type: 'checkbox' })} />
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
