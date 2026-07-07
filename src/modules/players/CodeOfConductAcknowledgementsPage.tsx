import { useState } from 'react';
import { Modal, TextInput, Select, Button, Group, Stack, Title, Badge } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';

const ENDPOINT = '/code-of-conduct-acknowledgements';

interface Acknowledgement {
  id: number;
  signatory_name: string;
  signed_date: string;
  safeguarding_training_completed_on: string | null;
  safeguarding_certification_expiry: string | null;
  status_id: number;
  signatoryType?: { label_en: string };
  position?: { label_en: string };
  status?: { label_en: string };
}

export function CodeOfConductAcknowledgementsPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<Acknowledgement>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const signatoryTypes = useLookupSelect('signatory-types', i18n.language);
  const positions = useLookupSelect('hq-positions', i18n.language);
  const statuses = useLookupSelect('statuses', i18n.language);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Acknowledgement | null>(null);

  const form = useForm({
    initialValues: {
      signatory_name: '', signatory_type_id: '', position_id: '', signed_date: '',
      safeguarding_training_completed_on: '', safeguarding_certification_expiry: '', status_id: '',
    },
    validate: {
      signatory_name: (v) => (v ? null : 'Required'),
      signatory_type_id: (v) => (v ? null : 'Required'),
      signed_date: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: Acknowledgement) {
    setEditing(row);
    form.setValues({
      signatory_name: row.signatory_name, signatory_type_id: '', position_id: '', signed_date: row.signed_date,
      safeguarding_training_completed_on: row.safeguarding_training_completed_on ?? '',
      safeguarding_certification_expiry: row.safeguarding_certification_expiry ?? '', status_id: String(row.status_id),
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      update.mutate(
        {
          id: editing.id,
          payload: {
            safeguarding_training_completed_on: values.safeguarding_training_completed_on || null,
            safeguarding_certification_expiry: values.safeguarding_certification_expiry || null,
            status_id: values.status_id,
          },
        },
        { onSuccess: () => setModalOpen(false) }
      );
    } else {
      create.mutate({ ...values, position_id: values.position_id || null }, { onSuccess: () => setModalOpen(false) });
    }
  }

  async function handleReport(period: ReportPeriod) {
    await downloadReport(ENDPOINT, { period: period.kind });
  }

  const columns: DataTableColumn<Acknowledgement>[] = [
    { key: 'signatory_name', header: 'Signatory' },
    { key: 'signatoryType', header: 'Type', render: (r) => r.signatoryType?.label_en ?? '—', exportValue: (r) => r.signatoryType?.label_en ?? '' },
    { key: 'position', header: 'Position', render: (r) => r.position?.label_en ?? '—', exportValue: (r) => r.position?.label_en ?? '' },
    { key: 'safeguarding_training_completed_on', header: 'Training Completed' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">SAFE-003 — Code of Conduct Acknowledgements</Title>
      <DataTable<Acknowledgement>
        title="Code of Conduct Acknowledgements"
        moduleKey="code-of-conduct-acknowledgements"
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
          { key: 'signatory_type_id', label: 'Type', options: signatoryTypes.data },
          { key: 'status_id', label: 'Status', options: statuses.data },
        ]}
        activeFilters={list.filters}
        onFilterChange={list.onFilterChange}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={(row) => list.deleteRow(row.id)}
        onGenerateReport={handleReport}
      />

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Acknowledgement' : 'New Code of Conduct Acknowledgement (SAFE-003)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <TextInput label="Signatory Name" required {...form.getInputProps('signatory_name')} />
                <Group grow>
                  <Select label="Signatory Type" data={signatoryTypes.data} required {...form.getInputProps('signatory_type_id')} />
                  <Select label="Position (if applicable)" data={positions.data} clearable {...form.getInputProps('position_id')} />
                </Group>
                <TextInput type="date" label="Signed Date" required {...form.getInputProps('signed_date')} />
              </>
            )}
            <Group grow>
              <TextInput type="date" label="Safeguarding Training Completed On" {...form.getInputProps('safeguarding_training_completed_on')} />
              <TextInput type="date" label="Certification Expiry (annual renewal)" {...form.getInputProps('safeguarding_certification_expiry')} />
            </Group>
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
