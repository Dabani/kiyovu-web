import { useState } from 'react';
import { Modal, TextInput, Button, Group, Stack, Title, Badge } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { IconCertificate } from '@tabler/icons-react';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';

const ENDPOINT = '/fan-clubs';

interface FanClub {
  id: number;
  proposed_name: string;
  application_date: string;
  certificate_number: string | null;
  recognized_on: string | null;
  registration_fee_due_on: string | null;
  status_id: number;
  status?: { label_en: string };
}

/** FAN-002: separate screen from FAN-001 — this is the President's certificate-issuing queue (Art. 177). */
export function FanClubCertificatesPage() {
  const { t } = useTranslation();
  const list = useCrudList<FanClub>(ENDPOINT);
  const { update } = useCrudMutations(ENDPOINT);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FanClub | null>(null);

  const form = useForm({
    initialValues: { certificate_number: '', recognized_on: '', signed_by_president_name: '', status_id: '' },
    validate: {
      certificate_number: (v) => (v ? null : 'Required'),
      recognized_on: (v) => (v ? null : 'Required'),
      signed_by_president_name: (v) => (v ? null : 'Required'),
    },
  });

  function openIssue(row: FanClub) {
    setEditing(row);
    form.setValues({ certificate_number: '', recognized_on: '', signed_by_president_name: '', status_id: String(row.status_id) });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (!editing) return;
    update.mutate(
      { id: editing.id, payload: { ...values, registration_fee_paid: false } },
      { onSuccess: () => setModalOpen(false) }
    );
  }

  async function handleReport(period: ReportPeriod) {
    await downloadReport(ENDPOINT, { period: period.kind });
  }

  const columns: DataTableColumn<FanClub>[] = [
    { key: 'proposed_name', header: 'Fan Club' },
    { key: 'application_date', header: 'Application Date' },
    {
      key: 'certificate_number', header: 'Certificate',
      render: (r) => (r.certificate_number ? <Badge color="kiyovuGreen">{r.certificate_number}</Badge> : <Badge color="yellow">Not Issued</Badge>),
      exportValue: (r) => r.certificate_number ?? 'Not Issued',
    },
    { key: 'recognized_on', header: 'Recognized On' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
  ];

  return (
    <>
      <Title order={2} mb="md">FAN-002 — Certificate of Recognition</Title>
      <DataTable<FanClub>
        title="Fan Clubs Awaiting / Holding Certificates"
        moduleKey="fan-club-certificates"
        columns={columns}
        rows={list.rows}
        totalCount={list.totalCount}
        page={list.page}
        pageSize={list.pageSize}
        loading={list.loading}
        search={list.search}
        onSearchChange={list.onSearchChange}
        onPageChange={list.setPage}
        onEdit={openIssue}
        onGenerateReport={handleReport}
        canCreate={false}
        canDelete={false}
      />

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Issue Certificate of Recognition (FAN-002)" size="lg" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput label="Certificate Number" required leftSection={<IconCertificate size={16} />} {...form.getInputProps('certificate_number')} />
            <TextInput type="date" label="Recognized On" required {...form.getInputProps('recognized_on')} />
            <TextInput label="Signed By (President)" required {...form.getInputProps('signed_by_president_name')} />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
              <Button type="submit" color="kiyovuGreen" loading={update.isPending}>{t('common.save')}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
