import { useMemo, useState } from 'react';
import {
  Table, TextInput, Button, Group, Pagination, ActionIcon, Menu, Select,
  Paper, Stack, Text, LoadingOverlay, Box,
} from '@mantine/core';
import {
  IconSearch, IconPlus, IconPencil, IconTrash, IconFileSpreadsheet,
  IconPrinter, IconDots, IconFilter,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import { ReportPeriodModal, ReportPeriod } from './ReportPeriodModal';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  /** Excel export uses this if provided, otherwise falls back to render() text or raw value. */
  exportValue?: (row: T) => string | number;
}

export interface DataTableFilter {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface DataTableProps<T extends { id: number }> {
  title: string;
  moduleKey: string; // used as the report/export filename prefix, e.g. "members"
  columns: DataTableColumn<T>[];
  rows: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  loading?: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  filters?: DataTableFilter[];
  activeFilters?: Record<string, string | null>;
  onFilterChange?: (key: string, value: string | null) => void;
  onAdd?: () => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onGenerateReport?: (period: ReportPeriod) => void;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  canExport?: boolean;
}

export function DataTable<T extends { id: number }>({
  title, moduleKey, columns, rows, totalCount, page, pageSize, loading,
  search, onSearchChange, onPageChange, filters, activeFilters, onFilterChange,
  onAdd, onEdit, onDelete, onGenerateReport,
  canCreate = true, canUpdate = true, canDelete = true, canExport = true,
}: DataTableProps<T>) {
  const { t } = useTranslation();
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  function exportToExcel() {
    const data = rows.map((row) => {
      const record: Record<string, string | number> = {};
      columns.forEach((col) => {
        record[col.header] = col.exportValue
          ? col.exportValue(row)
          : ((row as Record<string, unknown>)[col.key] as string | number) ?? '';
      });
      return record;
    });
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, title.slice(0, 31));
    XLSX.writeFile(workbook, `${moduleKey}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  const headerCells = useMemo(
    () => columns.map((col) => <Table.Th key={col.key}>{col.header}</Table.Th>),
    [columns]
  );

  return (
    <Paper withBorder p="md" radius="md" pos="relative">
      <LoadingOverlay visible={!!loading} />
      <Stack gap="sm">
        <Group justify="space-between" wrap="wrap">
          <Text fw={700} size="lg">{title}</Text>
          <Group gap="xs">
            {canCreate && onAdd && (
              <Button leftSection={<IconPlus size={16} />} onClick={onAdd} color="kiyovuGreen">
                {t('table.addNew')}
              </Button>
            )}
            <Menu shadow="md" position="bottom-end">
              <Menu.Target>
                <ActionIcon variant="default" size="lg" aria-label="More actions">
                  <IconDots size={18} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                {canExport && (
                  <Menu.Item leftSection={<IconFileSpreadsheet size={16} />} onClick={exportToExcel}>
                    {t('table.export')}
                  </Menu.Item>
                )}
                {onGenerateReport && (
                  <Menu.Item leftSection={<IconPrinter size={16} />} onClick={() => setReportModalOpen(true)}>
                    {t('table.printReport')}
                  </Menu.Item>
                )}
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>

        <Group wrap="wrap" gap="sm">
          <TextInput
            placeholder={t('table.search') ?? ''}
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => onSearchChange(e.currentTarget.value)}
            w={280}
          />
          {filters?.map((filter) => (
            <Select
              key={filter.key}
              placeholder={filter.label}
              leftSection={<IconFilter size={14} />}
              data={filter.options}
              value={activeFilters?.[filter.key] ?? null}
              onChange={(value) => onFilterChange?.(filter.key, value)}
              clearable
              w={200}
            />
          ))}
        </Group>

        <Box style={{ overflowX: 'auto' }}>
          <Table>
            <Table.Thead>
              <Table.Tr>
                {headerCells}
                {(onEdit || onDelete) && <Table.Th>{t('common.actions')}</Table.Th>}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.length === 0 && !loading && (
                <Table.Tr>
                  <Table.Td colSpan={columns.length + 1}>
                    <Text ta="center" c="dimmed" py="lg">{t('table.noResults')}</Text>
                  </Table.Td>
                </Table.Tr>
              )}
              {rows.map((row) => (
                <Table.Tr key={row.id}>
                  {columns.map((col) => (
                    <Table.Td key={col.key}>
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </Table.Td>
                  ))}
                  {(onEdit || onDelete) && (
                    <Table.Td>
                      <Group gap={4}>
                        {onEdit && canUpdate && (
                          <ActionIcon variant="subtle" color="kiyovuGreen" onClick={() => onEdit(row)} aria-label={t('table.edit') ?? ''}>
                            <IconPencil size={16} />
                          </ActionIcon>
                        )}
                        {onDelete && canDelete && (
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            aria-label={t('table.delete') ?? ''}
                            onClick={() => {
                              if (window.confirm(t('table.confirmDelete') ?? '')) onDelete(row);
                            }}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        )}
                      </Group>
                    </Table.Td>
                  )}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Box>

        <Group justify="space-between">
          <Text size="xs" c="dimmed">{totalCount} record{totalCount === 1 ? '' : 's'}</Text>
          <Pagination total={totalPages} value={page} onChange={onPageChange} color="kiyovuGreen" size="sm" />
        </Group>
      </Stack>

      {onGenerateReport && (
        <ReportPeriodModal
          opened={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          onGenerate={(period) => {
            onGenerateReport(period);
            setReportModalOpen(false);
          }}
        />
      )}
    </Paper>
  );
}
