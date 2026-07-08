import { useState } from 'react';
import { Modal, TextInput, Select, Textarea, Checkbox, Button, Group, Stack, Title, Badge, ActionIcon, Tooltip } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { IconUserPlus } from '@tabler/icons-react';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';
import { ProvisionAccountModal } from '../../components/ProvisionAccountModal';

const ENDPOINT = '/members';

interface Member {
  id: number;
  full_name: string;
  national_id: string;
  phone: string;
  email: string | null;
  statement_of_commitment: string | null;
  category_id: number;
  fee_tier_id: number;
  payment_method_id: number | null;
  application_date: string;
  hardship_payment_plan: boolean;
  status_id: number;
  category?: { label_en: string };
  fee_tier?: { label_en: string; min_monthly_rwf: number; max_monthly_rwf: number };
  status?: { label_en: string; color_hex: string };
}

export function MemberApplicationsPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<Member>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const categories = useLookupSelect('membership-categories', i18n.language);
  const feeTiers = useLookupSelect('fee-tiers', i18n.language);
  const paymentMethods = useLookupSelect('payment-methods', i18n.language);
  const statuses = useLookupSelect('statuses', i18n.language, 'members');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [provisioningMember, setProvisioningMember] = useState<Member | null>(null);

  const form = useForm({
    initialValues: {
      full_name: '', national_id: '', phone: '', email: '', statement_of_commitment: '',
      category_id: '', fee_tier_id: '', payment_method_id: '', application_date: '',
      hardship_payment_plan: false, status_id: '',
    },
    validate: {
      full_name: (v) => (v ? null : 'Required'),
      national_id: (v) => (v ? null : 'Required'),
      phone: (v) => (v ? null : 'Required'),
      category_id: (v) => (v ? null : 'Required'),
      fee_tier_id: (v) => (v ? null : 'Required'),
      application_date: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(member: Member) {
    setEditing(member);
    form.setValues({
      full_name: member.full_name,
      national_id: member.national_id,
      phone: member.phone,
      email: member.email ?? '',
      statement_of_commitment: member.statement_of_commitment ?? '',
      category_id: String(member.category_id),
      fee_tier_id: String(member.fee_tier_id),
      payment_method_id: member.payment_method_id ? String(member.payment_method_id) : '',
      application_date: member.application_date,
      hardship_payment_plan: member.hardship_payment_plan,
      status_id: String(member.status_id),
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    const payload = { ...values, email: values.email || null, payment_method_id: values.payment_method_id || null };
    if (editing) {
      update.mutate({ id: editing.id, payload }, { onSuccess: () => setModalOpen(false) });
    } else {
      create.mutate(payload, { onSuccess: () => setModalOpen(false) });
    }
  }

  async function handleReport(period: ReportPeriod) {
    await downloadReport(ENDPOINT, {
      period: period.kind,
      from: period.from?.toISOString().slice(0, 10),
      to: period.to?.toISOString().slice(0, 10),
    });
  }

  const columns: DataTableColumn<Member>[] = [
    { key: 'full_name', header: 'Full Name' },
    { key: 'national_id', header: 'National ID' },
    { key: 'phone', header: 'Phone' },
    { key: 'category', header: 'Category', render: (r) => r.category?.label_en ?? '—', exportValue: (r) => r.category?.label_en ?? '' },
    { key: 'fee_tier', header: 'Fee Tier', render: (r) => r.fee_tier?.label_en ?? '—', exportValue: (r) => r.fee_tier?.label_en ?? '' },
    {
      key: 'status', header: 'Status',
      render: (r) => <Badge color={r.status?.color_hex ? undefined : 'gray'} style={{ backgroundColor: r.status?.color_hex }}>{r.status?.label_en}</Badge>,
      exportValue: (r) => r.status?.label_en ?? '',
    },
    { key: 'application_date', header: 'Application Date' },
    {
      key: 'provision', header: 'Login',
      render: (r) => (
        <Tooltip label="Create login account">
          <ActionIcon variant="subtle" color="kiyovuGreen" onClick={() => setProvisioningMember(r)}>
            <IconUserPlus size={16} />
          </ActionIcon>
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <Title order={2} mb="md">MEM-001 — Membership Applications</Title>
      <DataTable<Member>
        title={t('nav.membership')}
        moduleKey="members"
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
          { key: 'category_id', label: 'Category', options: categories.data },
          { key: 'status_id', label: 'Status', options: statuses.data },
        ]}
        activeFilters={list.filters}
        onFilterChange={list.onFilterChange}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={(row) => list.deleteRow(row.id)}
        onGenerateReport={handleReport}
      />

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Member' : 'New Membership Application (MEM-001)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Group grow>
              <TextInput label="Full Name" required {...form.getInputProps('full_name')} />
              <TextInput label="National ID" required {...form.getInputProps('national_id')} />
            </Group>
            <Group grow>
              <TextInput label="Phone" required {...form.getInputProps('phone')} />
              <TextInput label="Email" {...form.getInputProps('email')} />
            </Group>
            <Textarea label="Statement of Commitment" minRows={2} {...form.getInputProps('statement_of_commitment')} />
            <Group grow>
              <Select label="Membership Category" data={categories.data} required {...form.getInputProps('category_id')} />
              <Select label="Fee Tier" data={feeTiers.data} required {...form.getInputProps('fee_tier_id')} />
            </Group>
            <Group grow>
              <Select label="Payment Method" data={paymentMethods.data} clearable {...form.getInputProps('payment_method_id')} />
              <TextInput type="date" label="Application Date" required {...form.getInputProps('application_date')} />
            </Group>
            <Select label="Status" data={statuses.data} required {...form.getInputProps('status_id')} />
            <Checkbox label="Hardship payment plan (Art. 14 — minimum 6-month plan)" {...form.getInputProps('hardship_payment_plan', { type: 'checkbox' })} />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
              <Button type="submit" color="kiyovuGreen" loading={create.isPending || update.isPending}>{t('common.save')}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {provisioningMember && (
        <ProvisionAccountModal
          opened={!!provisioningMember}
          onClose={() => setProvisioningMember(null)}
          sourceType="member"
          sourceId={provisioningMember.id}
          defaultEmail={provisioningMember.email}
          suggestedRoles={['member']}
        />
      )}
    </>
  );
}
