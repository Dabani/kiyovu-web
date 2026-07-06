import { Title, Badge, Button, Text } from '@mantine/core';
import { IconCircleCheck } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { ReportPeriod } from '../../components/DataTable/ReportPeriodModal';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations, downloadReport } from '../../hooks/useCrudMutations';

const ENDPOINT = '/members';

interface Member {
  id: number;
  full_name: string;
  national_id: string;
  application_date: string;
  acknowledged_at: string | null;
  entry_date: string | null;
  status?: { label_en: string; color_hex: string };
}

/**
 * MEM-002: separate screen from MEM-001 by design — this is the Secretary
 * General's queue of applications awaiting formal acknowledgement into the
 * Master Registry (Art. 15), not a general edit view of the member record.
 */
export function MemberAcknowledgementsPage() {
  const list = useCrudList<Member>(ENDPOINT);
  const { update } = useCrudMutations(ENDPOINT);

  function acknowledge(member: Member) {
    update.mutate(
      {
        id: member.id,
        payload: { acknowledged_at: new Date().toISOString(), entry_date: new Date().toISOString().slice(0, 10) },
      },
      {
        onSuccess: () => notifications.show({ color: 'kiyovuGreen', message: `${member.full_name} acknowledged into the Master Registry.` }),
      }
    );
  }

  async function handleReport(period: ReportPeriod) {
    await downloadReport(ENDPOINT, { period: period.kind });
  }

  const columns: DataTableColumn<Member>[] = [
    { key: 'full_name', header: 'Full Name' },
    { key: 'national_id', header: 'National ID' },
    { key: 'application_date', header: 'Application Date' },
    {
      key: 'acknowledged_at', header: 'Acknowledgement',
      render: (r) => (r.acknowledged_at
        ? <Badge color="kiyovuGreen">Acknowledged {r.entry_date}</Badge>
        : <Badge color="yellow">Pending</Badge>),
      exportValue: (r) => (r.acknowledged_at ? `Acknowledged ${r.entry_date}` : 'Pending'),
    },
    {
      key: 'action', header: 'Action',
      render: (r) => (r.acknowledged_at
        ? <Text size="xs" c="dimmed">—</Text>
        : <Button size="xs" leftSection={<IconCircleCheck size={14} />} color="kiyovuGreen" onClick={() => acknowledge(r)}>Acknowledge</Button>),
    },
  ];

  return (
    <>
      <Title order={2} mb="md">MEM-002 — Membership Acknowledgement</Title>
      <DataTable<Member>
        title="Applications Pending Acknowledgement"
        moduleKey="member-acknowledgements"
        columns={columns}
        rows={list.rows}
        totalCount={list.totalCount}
        page={list.page}
        pageSize={list.pageSize}
        loading={list.loading}
        search={list.search}
        onSearchChange={list.onSearchChange}
        onPageChange={list.setPage}
        onGenerateReport={handleReport}
        canCreate={false}
        canDelete={false}
      />
    </>
  );
}
