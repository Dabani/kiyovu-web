import { useState } from 'react';
import { Modal, TextInput, Select, Button, Group, Stack, Title, Badge, NumberInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';
import { useFanClubOptions } from '../../hooks/useFanClubOptions';

const ENDPOINT = '/fan-club-payment-confirmations';

interface PaymentConfirmation {
  id: number;
  contribution_month: string;
  amount_rwf: number;
  payment_reference: string;
  submitted_on: string;
  status_id: number;
  fanClub?: { label: string };
  status?: { label_en: string };
}

export function FanClubPaymentConfirmationsPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<PaymentConfirmation>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const statuses = useLookupSelect('statuses', i18n.language);
  const fanClubs = useFanClubOptions();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentConfirmation | null>(null);

  const form = useForm({
    initialValues: { fan_club_id: '', contribution_month: '', amount_rwf: '', payment_reference: '', submitted_on: '', status_id: '' },
    validate: {
      fan_club_id: (v) => (v ? null : 'Required'),
      contribution_month: (v) => (v ? null : 'Required'),
      amount_rwf: (v) => (v !== '' ? null : 'Required'),
      payment_reference: (v) => (v ? null : 'Required'),
      submitted_on: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: PaymentConfirmation) {
    setEditing(row);
    form.setValues({
      fan_club_id: '', contribution_month: row.contribution_month, amount_rwf: String(row.amount_rwf),
      payment_reference: row.payment_reference, submitted_on: row.submitted_on, status_id: String(row.status_id),
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      update.mutate({ id: editing.id, payload: { status_id: values.status_id } }, { onSuccess: () => setModalOpen(false) });
    } else {
      create.mutate(values, { onSuccess: () => setModalOpen(false) });
    }
  }

  async function handleReport(period: ReportPeriod) {
    await downloadReport(ENDPOINT, { period: period.kind });
  }

  const columns: DataTableColumn<PaymentConfirmation>[] = [
    { key: 'fanClub', header: 'Fan Club', render: (r) => r.fanClub?.label ?? '—', exportValue: (r) => r.fanClub?.label ?? '' },
    { key: 'contribution_month', header: 'Contribution Month' },
    { key: 'amount_rwf', header: 'Amount (RWF)' },
    { key: 'payment_reference', header: 'Reference' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">FAN-007 — Payment Confirmations</Title>
      <DataTable<PaymentConfirmation>
        title="Monthly Contribution Payment Confirmations"
        moduleKey="fan-club-payment-confirmations"
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Confirmation' : 'New Payment Confirmation (FAN-007)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <Select label="Fan Club" data={fanClubs.data ?? []} required searchable {...form.getInputProps('fan_club_id')} />
                <TextInput type="month" label="Contribution Month" required {...form.getInputProps('contribution_month')} />
                <NumberInput label="Amount (RWF)" required min={0} {...form.getInputProps('amount_rwf')} />
                <TextInput label="Payment Reference" required {...form.getInputProps('payment_reference')} />
                <TextInput type="date" label="Submitted On (by the 20th)" required {...form.getInputProps('submitted_on')} />
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
