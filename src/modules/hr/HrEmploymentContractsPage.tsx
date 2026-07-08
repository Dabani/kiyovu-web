import { useState } from 'react';
import { Modal, TextInput, Select, Textarea, Checkbox, Button, Group, Stack, Title, Badge, NumberInput, ActionIcon, Tooltip } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { IconUserPlus } from '@tabler/icons-react';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';
import { useCandidateOptions } from '../../hooks/useCandidateOptions';
import { ProvisionAccountModal } from '../../components/ProvisionAccountModal';

const ENDPOINT = '/hr-employment-contracts';

interface Contract {
  id: number;
  employee_full_name: string;
  duties_and_kpis: string;
  reporting_line: string | null;
  remuneration_rwf_monthly: number;
  term_start: string;
  term_end: string | null;
  confidentiality_acknowledged: boolean;
  ceo_signed_on: string | null;
  appointee_signed_on: string | null;
  status_id: number;
  position?: { label_en: string };
  employmentType?: { label_en: string };
  status?: { label_en: string };
}

export function HrEmploymentContractsPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<Contract>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const positions = useLookupSelect('hq-positions', i18n.language);
  const employmentTypes = useLookupSelect('employment-types', i18n.language);
  const statuses = useLookupSelect('statuses', i18n.language);
  const candidates = useCandidateOptions();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [provisioningContract, setProvisioningContract] = useState<Contract | null>(null);

  const form = useForm({
    initialValues: {
      candidate_id: '', employee_full_name: '', position_id: '', employment_type_id: '',
      duties_and_kpis: '', qualifications_required: '', reporting_line: '',
      remuneration_rwf_monthly: '', working_hours: '', term_start: '', term_end: '',
      termination_grounds: '', confidentiality_acknowledged: false,
      ceo_signed_on: '', appointee_signed_on: '', status_id: '',
    },
    validate: {
      employee_full_name: (v) => (v ? null : 'Required'),
      position_id: (v) => (v ? null : 'Required'),
      employment_type_id: (v) => (v ? null : 'Required'),
      duties_and_kpis: (v) => (v ? null : 'Required'),
      remuneration_rwf_monthly: (v) => (v ? null : 'Required'),
      term_start: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: Contract) {
    setEditing(row);
    form.setValues({
      candidate_id: '', employee_full_name: row.employee_full_name, position_id: '', employment_type_id: '',
      duties_and_kpis: row.duties_and_kpis, qualifications_required: '', reporting_line: row.reporting_line ?? '',
      remuneration_rwf_monthly: String(row.remuneration_rwf_monthly), working_hours: '',
      term_start: row.term_start, term_end: row.term_end ?? '', termination_grounds: '',
      confidentiality_acknowledged: row.confidentiality_acknowledged,
      ceo_signed_on: row.ceo_signed_on ?? '', appointee_signed_on: row.appointee_signed_on ?? '',
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
            duties_and_kpis: values.duties_and_kpis, reporting_line: values.reporting_line || null,
            remuneration_rwf_monthly: values.remuneration_rwf_monthly, term_end: values.term_end || null,
            termination_grounds: values.termination_grounds || null,
            confidentiality_acknowledged: values.confidentiality_acknowledged,
            ceo_signed_on: values.ceo_signed_on || null, appointee_signed_on: values.appointee_signed_on || null,
            status_id: values.status_id,
          },
        },
        { onSuccess: () => setModalOpen(false) }
      );
    } else {
      create.mutate({ ...values, candidate_id: values.candidate_id || null }, { onSuccess: () => setModalOpen(false) });
    }
  }

  async function handleReport(period: ReportPeriod) {
    await downloadReport(ENDPOINT, { period: period.kind });
  }

  const columns: DataTableColumn<Contract>[] = [
    { key: 'employee_full_name', header: 'Employee' },
    { key: 'position', header: 'Position', render: (r) => r.position?.label_en ?? '—', exportValue: (r) => r.position?.label_en ?? '' },
    { key: 'employmentType', header: 'Type', render: (r) => r.employmentType?.label_en ?? '—', exportValue: (r) => r.employmentType?.label_en ?? '' },
    { key: 'term_start', header: 'Term Start' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
    {
      key: 'provision', header: 'Login',
      render: (r) => (
        <Tooltip label="Create login account">
          <ActionIcon variant="subtle" color="kiyovuGreen" onClick={() => setProvisioningContract(r)}>
            <IconUserPlus size={16} />
          </ActionIcon>
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <Title order={2} mb="md">HR-001 — Employment Contracts</Title>
      <DataTable<Contract>
        title="Employment Contracts"
        moduleKey="hr-employment-contracts"
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
          { key: 'position_id', label: 'Position', options: positions.data },
          { key: 'status_id', label: 'Status', options: statuses.data },
        ]}
        activeFilters={list.filters}
        onFilterChange={list.onFilterChange}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={(row) => list.deleteRow(row.id)}
        onGenerateReport={handleReport}
      />

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Contract' : 'New Employment Contract (HR-001)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <Select label="Link to Recruitment Candidate (optional)" data={candidates.data ?? []} searchable clearable {...form.getInputProps('candidate_id')} />
                <TextInput label="Employee Full Name" required {...form.getInputProps('employee_full_name')} />
                <Group grow>
                  <Select label="Position" data={positions.data} required {...form.getInputProps('position_id')} />
                  <Select label="Employment Type" data={employmentTypes.data} required {...form.getInputProps('employment_type_id')} />
                </Group>
              </>
            )}
            <Textarea label="Duties and KPIs" required minRows={3} {...form.getInputProps('duties_and_kpis')} />
            <Group grow>
              <TextInput label="Reporting Line" {...form.getInputProps('reporting_line')} />
              <NumberInput label="Monthly Remuneration (RWF)" required min={0} {...form.getInputProps('remuneration_rwf_monthly')} />
            </Group>
            {!editing && (
              <Group grow>
                <TextInput type="date" label="Term Start" required {...form.getInputProps('term_start')} />
                <TextInput type="date" label="Term End (blank = indefinite)" {...form.getInputProps('term_end')} />
              </Group>
            )}
            {editing && <TextInput type="date" label="Term End" {...form.getInputProps('term_end')} />}
            <Textarea label="Termination Grounds" minRows={2} {...form.getInputProps('termination_grounds')} />
            <Checkbox label="Confidentiality obligations acknowledged" {...form.getInputProps('confidentiality_acknowledged', { type: 'checkbox' })} />
            <Group grow>
              <TextInput type="date" label="CEO Signed On" {...form.getInputProps('ceo_signed_on')} />
              <TextInput type="date" label="Appointee Signed On" {...form.getInputProps('appointee_signed_on')} />
            </Group>
            <Select label="Status" data={statuses.data} required {...form.getInputProps('status_id')} />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
              <Button type="submit" color="kiyovuGreen" loading={create.isPending || update.isPending}>{t('common.save')}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {provisioningContract && (
        <ProvisionAccountModal
          opened={!!provisioningContract}
          onClose={() => setProvisioningContract(null)}
          sourceType="hr-employment-contract"
          sourceId={provisioningContract.id}
          suggestedRoles={[]}
        />
      )}
    </>
  );
}
