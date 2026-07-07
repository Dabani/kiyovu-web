import { useState } from 'react';
import { Modal, TextInput, Select, Textarea, Checkbox, Button, Group, Stack, Title, Badge } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';
import { usePlayerOptions } from '../../hooks/usePlayerOptions';

const ENDPOINT = '/parental-consent-forms';

interface ConsentForm {
  id: number;
  guardian_name: string;
  relationship_to_minor: string;
  consent_date: string;
  medical_treatment_consent: boolean;
  media_image_consent: boolean;
  status_id: number;
  player?: { label: string };
  status?: { label_en: string };
}

export function ParentalConsentFormsPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<ConsentForm>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const statuses = useLookupSelect('statuses', i18n.language);
  const players = usePlayerOptions();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ConsentForm | null>(null);

  const form = useForm({
    initialValues: {
      player_id: '', guardian_name: '', relationship_to_minor: '', guardian_phone: '', consent_date: '',
      activities_covered: '', medical_treatment_consent: false, media_image_consent: false, status_id: '',
    },
    validate: {
      player_id: (v) => (v ? null : 'Required'),
      guardian_name: (v) => (v ? null : 'Required'),
      relationship_to_minor: (v) => (v ? null : 'Required'),
      guardian_phone: (v) => (v ? null : 'Required'),
      consent_date: (v) => (v ? null : 'Required'),
      activities_covered: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: ConsentForm) {
    setEditing(row);
    form.setValues({
      player_id: '', guardian_name: row.guardian_name, relationship_to_minor: row.relationship_to_minor,
      guardian_phone: '', consent_date: row.consent_date, activities_covered: '',
      medical_treatment_consent: row.medical_treatment_consent, media_image_consent: row.media_image_consent,
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
            activities_covered: values.activities_covered, medical_treatment_consent: values.medical_treatment_consent,
            media_image_consent: values.media_image_consent, status_id: values.status_id,
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

  const columns: DataTableColumn<ConsentForm>[] = [
    { key: 'player', header: 'Player', render: (r) => r.player?.label ?? '—', exportValue: (r) => r.player?.label ?? '' },
    { key: 'guardian_name', header: 'Guardian' },
    { key: 'relationship_to_minor', header: 'Relationship' },
    { key: 'consent_date', header: 'Consent Date' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">SAFE-002 — Parental Consent Forms</Title>
      <DataTable<ConsentForm>
        title="Parental / Guardian Consent Forms"
        moduleKey="parental-consent-forms"
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Consent' : 'New Parental Consent (SAFE-002)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <Select label="Player (Minor)" data={players.data ?? []} required searchable {...form.getInputProps('player_id')} />
                <Group grow>
                  <TextInput label="Guardian Name" required {...form.getInputProps('guardian_name')} />
                  <TextInput label="Relationship to Minor" required {...form.getInputProps('relationship_to_minor')} />
                </Group>
                <TextInput label="Guardian Phone" required {...form.getInputProps('guardian_phone')} />
                <TextInput type="date" label="Consent Date" required {...form.getInputProps('consent_date')} />
              </>
            )}
            <Textarea label="Activities Covered" required minRows={3} {...form.getInputProps('activities_covered')} />
            <Group grow>
              <Checkbox label="Consent to medical treatment" {...form.getInputProps('medical_treatment_consent', { type: 'checkbox' })} />
              <Checkbox label="Consent to media/image use" {...form.getInputProps('media_image_consent', { type: 'checkbox' })} />
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
