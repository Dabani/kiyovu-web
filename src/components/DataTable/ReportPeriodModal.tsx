import { useState } from 'react';
import { Modal, Select, Group, Button, Stack } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useTranslation } from 'react-i18next';

export type ReportPeriodKind = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'custom';

export interface ReportPeriod {
  kind: ReportPeriodKind;
  from: Date | null;
  to: Date | null;
}

interface Props {
  opened: boolean;
  onClose: () => void;
  onGenerate: (period: ReportPeriod) => void;
}

const KIND_OPTIONS: { value: ReportPeriodKind; labelKey: string }[] = [
  { value: 'daily', labelKey: 'report.daily' },
  { value: 'weekly', labelKey: 'report.weekly' },
  { value: 'monthly', labelKey: 'report.monthly' },
  { value: 'quarterly', labelKey: 'report.quarterly' },
  { value: 'annual', labelKey: 'report.annual' },
  { value: 'custom', labelKey: 'report.custom' },
];

/**
 * PDF generation itself happens server-side (Bundle controllers expose
 * GET /api/{module}/report?period=...&from=...&to=... rendered via
 * barryvdh/laravel-dompdf) — this modal only collects the period, then
 * triggers a file download of that endpoint's response.
 */
export function ReportPeriodModal({ opened, onClose, onGenerate }: Props) {
  const { t } = useTranslation();
  const [kind, setKind] = useState<ReportPeriodKind>('monthly');
  const [from, setFrom] = useState<Date | null>(null);
  const [to, setTo] = useState<Date | null>(null);

  return (
    <Modal opened={opened} onClose={onClose} title={t('report.period')} centered>
      <Stack>
        <Select
          label={t('report.period')}
          data={KIND_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
          value={kind}
          onChange={(v) => setKind((v as ReportPeriodKind) ?? 'monthly')}
          allowDeselect={false}
        />
        {kind === 'custom' && (
          <Group grow>
            <DatePickerInput label="From" value={from} onChange={setFrom} />
            <DatePickerInput label="To" value={to} onChange={setTo} />
          </Group>
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>{t('common.cancel')}</Button>
          <Button color="kiyovuGreen" onClick={() => onGenerate({ kind, from, to })}>
            {t('report.generate')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
