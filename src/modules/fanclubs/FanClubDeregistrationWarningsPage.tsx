import { useState } from 'react';
import { Modal, Select, Textarea, Checkbox, Button, Group, Stack, Title, Badge, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';
import { useFanClubOptions } from '../../hooks/useFanClubOptions';

const ENDPOINT = '/fan-club-deregistration-warnings';

interface Warning {
  id: number;
  grounds: string;
  issued_on: string;
  remedy_deadline: string;
  remedied: boolean;
  deregistration_decided: boolean | null;
  appealed_to_ga: boolean;
  status_id: number;
  fanClub?: { label: string };
  status?: { label_en: string };
}

export function FanClubDeregistrationWarningsPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<Warning>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const statuses = useLookupSelect('statuses', i18n.language);
  const fanClubs = useFanClubOptions();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Warning | null>(null);

  const form = useForm({
    initialValues: {
      fan_club_id: '', grounds: '', issued_on: '', status_id: '', remedied: false,
      explanation_invited_on: '', explanation_received: '', executive_organ_decision_date: '',
      deregistration_decided: false, decision_reasons: '', appealed_to_ga: false,
      appeal_filed_on: '', ga_appeal_upheld: false,
    },
    validate: {
      fan_club_id: (v) => (v ? null : 'Required'),
      grounds: (v) => (v ? null : 'Required'),
      issued_on: (v) => (v ? null : 'Required'),
      status_id: (v) => (v ? null : 'Required'),
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: Warning) {
    setEditing(row);
    form.setValues({
      fan_club_id: '', grounds: row.grounds, issued_on: row.issued_on, status_id: String(row.status_id),
      remedied: row.remedied, explanation_invited_on: '', explanation_received: '',
      executive_organ_decision_date: '', deregistration_decided: row.deregistration_decided ?? false,
      decision_reasons: '', appealed_to_ga: row.appealed_to_ga, appeal_filed_on: '', ga_appeal_upheld: false,
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      const { fan_club_id: _f, grounds: _g, issued_on: _i, ...editable } = values;
      update.mutate(
        {
          id: editing.id,
          payload: {
            ...editable,
            explanation_invited_on: editable.explanation_invited_on || null,
            executive_organ_decision_date: editable.executive_organ_decision_date || null,
            appeal_filed_on: editable.appeal_filed_on || null,
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

  const columns: DataTableColumn<Warning>[] = [
    { key: 'fanClub', header: 'Fan Club', render: (r) => r.fanClub?.label ?? '—', exportValue: (r) => r.fanClub?.label ?? '' },
    { key: 'issued_on', header: 'Issued On' },
    { key: 'remedy_deadline', header: 'Remedy Deadline' },
    {
      key: 'remedied', header: 'Remedied',
      render: (r) => (r.remedied ? <Badge color="kiyovuGreen">Yes</Badge> : <Badge color="gray">No</Badge>),
      exportValue: (r) => (r.remedied ? 'Yes' : 'No'),
    },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">FAN-006 — Deregistration Warnings</Title>
      <DataTable<Warning>
        title="Deregistration Warnings"
        moduleKey="fan-club-deregistration-warnings"
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Warning' : 'New Deregistration Warning (FAN-006)'} size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {!editing && (
              <>
                <Select label="Fan Club" data={fanClubs.data ?? []} required searchable {...form.getInputProps('fan_club_id')} />
                <Textarea label="Grounds for Warning" required minRows={3} {...form.getInputProps('grounds')} />
                <TextInput type="date" label="Issued On" required {...form.getInputProps('issued_on')} />
              </>
            )}
            {editing && (
              <>
                <Checkbox label="Remedied within 30 days" {...form.getInputProps('remedied', { type: 'checkbox' })} />
                {!form.values.remedied && (
                  <>
                    <Group grow>
                      <TextInput type="date" label="Explanation Invited On" {...form.getInputProps('explanation_invited_on')} />
                      <TextInput type="date" label="Executive Organ Decision Date" {...form.getInputProps('executive_organ_decision_date')} />
                    </Group>
                    <Textarea label="Explanation Received" minRows={2} {...form.getInputProps('explanation_received')} />
                    <Checkbox label="Deregistration decided" {...form.getInputProps('deregistration_decided', { type: 'checkbox' })} />
                    <Textarea label="Decision Reasons" minRows={2} {...form.getInputProps('decision_reasons')} />
                    <Checkbox label="Appealed to General Assembly" {...form.getInputProps('appealed_to_ga', { type: 'checkbox' })} />
                    {form.values.appealed_to_ga && (
                      <Group grow>
                        <TextInput type="date" label="Appeal Filed On" {...form.getInputProps('appeal_filed_on')} />
                        <Checkbox label="GA Appeal Upheld" mt="lg" {...form.getInputProps('ga_appeal_upheld', { type: 'checkbox' })} />
                      </Group>
                    )}
                  </>
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
