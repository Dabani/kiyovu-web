import { useState } from 'react';
import { Modal, TextInput, Select, Textarea, Checkbox, Button, Group, Stack, Title, Badge, NumberInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';

const ENDPOINT = '/fan-clubs';

interface FanClub {
  id: number;
  proposed_name: string;
  founding_members_count: number;
  chairperson_name: string;
  application_date: string;
  recognized_on: string | null;
  status_id: number;
  status?: { label_en: string };
}

export function FanClubApplicationsPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<FanClub>(ENDPOINT);
  const { create } = useCrudMutations(ENDPOINT);
  const statuses = useLookupSelect('statuses', i18n.language);

  const [modalOpen, setModalOpen] = useState(false);

  const form = useForm({
    initialValues: {
      proposed_name: '', founding_members_count: 15, objectives_statement: '', charter_provided: false,
      chairperson_name: '', secretary_name: '', treasurer_name: '', code_of_conduct_commitment: false,
      designated_account_reference: '', application_date: '', status_id: '',
    },
    validate: {
      proposed_name: (v) => (v ? null : 'Required'),
      founding_members_count: (v) => (Number(v) >= 15 ? null : 'Minimum 15 founding members (Art. 177)'),
      objectives_statement: (v) => (v ? null : 'Required'),
      chairperson_name: (v) => (v ? null : 'Required'),
      secretary_name: (v) => (v ? null : 'Required'),
      treasurer_name: (v) => (v ? null : 'Required'),
      application_date: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    form.reset();
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    create.mutate(values, { onSuccess: () => setModalOpen(false) });
  }

  async function handleReport(period: ReportPeriod) {
    await downloadReport(ENDPOINT, { period: period.kind });
  }

  const columns: DataTableColumn<FanClub>[] = [
    { key: 'proposed_name', header: 'Name' },
    { key: 'founding_members_count', header: 'Founding Members' },
    { key: 'chairperson_name', header: 'Chairperson' },
    { key: 'application_date', header: 'Application Date' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">FAN-001 — Fan Club Recognition Applications</Title>
      <DataTable<FanClub>
        title="Fan Club Applications"
        moduleKey="fan-clubs"
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
        onGenerateReport={handleReport}
        canDelete={false}
      />

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="New Fan Club Application (FAN-001)" size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput label="Proposed Fan Club Name" required {...form.getInputProps('proposed_name')} />
            <NumberInput label="Founding Members Count (min. 15)" required min={15} {...form.getInputProps('founding_members_count')} />
            <Textarea label="Objectives Statement" required minRows={3} {...form.getInputProps('objectives_statement')} />
            <Checkbox label="Constitution / charter provided" {...form.getInputProps('charter_provided', { type: 'checkbox' })} />
            <Group grow>
              <TextInput label="Chairperson" required {...form.getInputProps('chairperson_name')} />
              <TextInput label="Secretary" required {...form.getInputProps('secretary_name')} />
              <TextInput label="Treasurer" required {...form.getInputProps('treasurer_name')} />
            </Group>
            <Checkbox label="Written commitment to code of conduct" {...form.getInputProps('code_of_conduct_commitment', { type: 'checkbox' })} />
            <TextInput label="Designated Bank/Mobile Money Account Reference" {...form.getInputProps('designated_account_reference')} />
            <TextInput type="date" label="Application Date" required {...form.getInputProps('application_date')} />
            <Select label="Status" data={statuses.data} required {...form.getInputProps('status_id')} />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
              <Button type="submit" color="kiyovuGreen" loading={create.isPending}>{t('common.save')}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
