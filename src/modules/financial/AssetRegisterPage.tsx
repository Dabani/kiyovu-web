import { useState } from 'react';
import { Modal, TextInput, Select, Button, Group, Stack, Title, Badge, NumberInput, Checkbox } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';

const ENDPOINT = '/asset-register';

interface Asset {
  id: number;
  asset_tag: string;
  description: string;
  acquisition_date: string;
  acquisition_cost_rwf: number;
  custodian_name: string;
  location: string | null;
  last_verified_on: string | null;
  status_id: number;
  category?: { label_en: string };
  status?: { label_en: string };
}

export function AssetRegisterPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<Asset>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const categories = useLookupSelect('asset-categories', i18n.language);
  const statuses = useLookupSelect('statuses', i18n.language);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);

  const form = useForm({
    initialValues: {
      asset_tag: '', description: '', category_id: '', acquisition_date: '', acquisition_cost_rwf: '',
      custodian_name: '', location: '', status_id: '', last_verified_on: '',
      disposal_approved: false, disposed_on: '', disposal_proceeds_rwf: '',
    },
    validate: {
      asset_tag: (v) => (v ? null : 'Required'),
      description: (v) => (v ? null : 'Required'),
      category_id: (v) => (v ? null : 'Required'),
      acquisition_date: (v) => (v ? null : 'Required'),
      acquisition_cost_rwf: (v) => (v !== '' ? null : 'Required'),
      custodian_name: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: Asset) {
    setEditing(row);
    form.setValues({
      asset_tag: row.asset_tag, description: row.description, category_id: '', acquisition_date: row.acquisition_date,
      acquisition_cost_rwf: String(row.acquisition_cost_rwf), custodian_name: row.custodian_name,
      location: row.location ?? '', status_id: String(row.status_id), last_verified_on: row.last_verified_on ?? '',
      disposal_approved: false, disposed_on: '', disposal_proceeds_rwf: '',
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      update.mutate(
        {
          id: editing.id,
          payload: {
            custodian_name: values.custodian_name, location: values.location || null,
            last_verified_on: values.last_verified_on || null, disposal_approved: values.disposal_approved,
            disposed_on: values.disposed_on || null, disposal_proceeds_rwf: values.disposal_proceeds_rwf || null,
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

  const columns: DataTableColumn<Asset>[] = [
    { key: 'asset_tag', header: 'Tag' },
    { key: 'description', header: 'Description' },
    { key: 'category', header: 'Category', render: (r) => r.category?.label_en ?? '—', exportValue: (r) => r.category?.label_en ?? '' },
    { key: 'custodian_name', header: 'Custodian' },
    { key: 'acquisition_cost_rwf', header: 'Cost (RWF)' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">ASSET-001 — Asset Register</Title>
      <DataTable<Asset>
        title="Asset Register"
        moduleKey="asset-register"
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Asset' : 'New Asset (ASSET-001)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <Group grow>
                  <TextInput label="Asset Tag" required {...form.getInputProps('asset_tag')} />
                  <Select label="Category" data={categories.data} required {...form.getInputProps('category_id')} />
                </Group>
                <TextInput label="Description" required {...form.getInputProps('description')} />
                <Group grow>
                  <TextInput type="date" label="Acquisition Date" required {...form.getInputProps('acquisition_date')} />
                  <NumberInput label="Acquisition Cost (RWF)" required min={0} {...form.getInputProps('acquisition_cost_rwf')} />
                </Group>
              </>
            )}
            <Group grow>
              <TextInput label="Custodian" required {...form.getInputProps('custodian_name')} />
              <TextInput label="Location" {...form.getInputProps('location')} />
            </Group>
            {editing && (
              <>
                <TextInput type="date" label="Last Verified On (annual verification, Art. 901)" {...form.getInputProps('last_verified_on')} />
                <Checkbox label="Disposal approved (Executive Organ / GA, Art. 102)" {...form.getInputProps('disposal_approved', { type: 'checkbox' })} />
                {form.values.disposal_approved && (
                  <Group grow>
                    <TextInput type="date" label="Disposed On" {...form.getInputProps('disposed_on')} />
                    <NumberInput label="Disposal Proceeds (RWF)" min={0} {...form.getInputProps('disposal_proceeds_rwf')} />
                  </Group>
                )}
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
