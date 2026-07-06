import { useState } from 'react';
import { Modal, TextInput, Select, Textarea, Checkbox, Button, Group, Stack, Title, Badge, NumberInput, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { IconInfoCircle } from '@tabler/icons-react';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';

const ENDPOINT = '/written-contracts';

interface Contract {
  id: number;
  counterparty_name: string;
  start_date: string;
  ga_approval_required: boolean;
  ga_approved: boolean;
  status_id: number;
  contractType?: { label_en: string };
  status?: { label_en: string };
}

export function WrittenContractsPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<Contract>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const contractTypes = useLookupSelect('contract-types', i18n.language);
  const statuses = useLookupSelect('statuses', i18n.language);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Contract | null>(null);

  const form = useForm({
    initialValues: {
      contract_type_id: '', counterparty_name: '', description: '', value_rwf: '',
      monthly_value_rwf: '', start_date: '', end_date: '', status_id: '',
      executive_organ_approved: false, ga_approved: false, signed_on: '',
    },
    validate: {
      contract_type_id: (v) => (v ? null : 'Required'),
      counterparty_name: (v) => (v ? null : 'Required'),
      description: (v) => (v ? null : 'Required'),
      start_date: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  const monthly = Number(form.values.monthly_value_rwf) || 0;
  const needsGaApproval = monthly >= 50_000_000;

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: Contract) {
    setEditing(row);
    form.setValues({
      contract_type_id: '', counterparty_name: row.counterparty_name, description: '', value_rwf: '',
      monthly_value_rwf: '', start_date: row.start_date, end_date: '', status_id: String(row.status_id),
      executive_organ_approved: false, ga_approved: row.ga_approved, signed_on: '',
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      update.mutate(
        {
          id: editing.id,
          payload: {
            executive_organ_approved: values.executive_organ_approved, ga_approved: values.ga_approved,
            signed_on: values.signed_on || null, status_id: values.status_id,
          },
        },
        { onSuccess: () => setModalOpen(false) }
      );
    } else {
      create.mutate(
        { ...values, value_rwf: values.value_rwf || null, monthly_value_rwf: values.monthly_value_rwf || null, end_date: values.end_date || null },
        { onSuccess: () => setModalOpen(false) }
      );
    }
  }

  async function handleReport(period: ReportPeriod) {
    await downloadReport(ENDPOINT, { period: period.kind });
  }

  const columns: DataTableColumn<Contract>[] = [
    { key: 'counterparty_name', header: 'Counterparty' },
    { key: 'contractType', header: 'Type', render: (r) => r.contractType?.label_en ?? '—', exportValue: (r) => r.contractType?.label_en ?? '' },
    { key: 'start_date', header: 'Start Date' },
    {
      key: 'ga_approval_required', header: 'GA Approval Required',
      render: (r) => (r.ga_approval_required ? <Badge color="orange">Yes</Badge> : <Badge color="gray">No</Badge>),
      exportValue: (r) => (r.ga_approval_required ? 'Yes' : 'No'),
    },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">PROC-004 — Written Contracts</Title>
      <DataTable<Contract>
        title="Written Contracts (Procurement & Partnerships)"
        moduleKey="written-contracts"
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
          { key: 'contract_type_id', label: 'Type', options: contractTypes.data },
          { key: 'status_id', label: 'Status', options: statuses.data },
        ]}
        activeFilters={list.filters}
        onFilterChange={list.onFilterChange}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={(row) => list.deleteRow(row.id)}
        onGenerateReport={handleReport}
      />

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Contract' : 'New Written Contract (PROC-004)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <Select label="Contract Type" data={contractTypes.data} required {...form.getInputProps('contract_type_id')} />
                <TextInput label="Counterparty Name" required {...form.getInputProps('counterparty_name')} />
                <Textarea label="Description" required minRows={3} {...form.getInputProps('description')} />
                <Group grow>
                  <NumberInput label="Total Value (RWF)" min={0} {...form.getInputProps('value_rwf')} />
                  <NumberInput label="Monthly Value (RWF, partnerships)" min={0} {...form.getInputProps('monthly_value_rwf')} />
                </Group>
                {needsGaApproval && (
                  <Alert icon={<IconInfoCircle size={16} />} color="orange" variant="light">
                    Monthly value ≥ RWF 50,000,000 requires prior General Assembly approval (Art. 1013, Art. 34(8) of the Constitution).
                  </Alert>
                )}
                <Group grow>
                  <TextInput type="date" label="Start Date" required {...form.getInputProps('start_date')} />
                  <TextInput type="date" label="End Date" {...form.getInputProps('end_date')} />
                </Group>
              </>
            )}
            {editing && (
              <>
                <Group grow>
                  <Checkbox label="Executive Organ approved" {...form.getInputProps('executive_organ_approved', { type: 'checkbox' })} />
                  <Checkbox label="GA approved" {...form.getInputProps('ga_approved', { type: 'checkbox' })} />
                </Group>
                <TextInput type="date" label="Signed On" {...form.getInputProps('signed_on')} />
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
