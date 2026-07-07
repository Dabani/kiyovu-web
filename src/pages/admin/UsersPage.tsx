import { useState } from 'react';
import { Modal, TextInput, Select, MultiSelect, Button, Group, Stack, Title, Badge, Text, Alert, CopyButton, ActionIcon, Tooltip } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { IconCheck, IconCopy, IconKey } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { DataTable, DataTableColumn } from '../../components/DataTable/DataTable';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutations } from '../../hooks/useCrudMutations';
import { useLookupSelect } from '../../hooks/useLookup';
import { useRoleOptions } from '../../hooks/useRoleOptions';
import { api } from '../../lib/api';

const ENDPOINT = '/users';

interface PlatformUser {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  roles: string[];
  status_id: number;
  status?: { label_en: string; color_hex: string };
  last_login_at: string | null;
}

export function UsersPage() {
  const { t, i18n } = useTranslation();
  const list = useCrudList<PlatformUser>(ENDPOINT);
  const { create, update } = useCrudMutations(ENDPOINT);
  const statuses = useLookupSelect('statuses', i18n.language);
  const languages = useLookupSelect('languages', i18n.language);
  const roles = useRoleOptions();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PlatformUser | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      first_name: '', last_name: '', email: '', phone: '', national_id: '',
      preferred_language_id: '', status_id: '', roles: [] as string[],
    },
    validate: {
      first_name: (v) => (v ? null : 'Required'),
      last_name: (v) => (v ? null : 'Required'),
      email: (v) => (/^\S+@\S+$/.test(v) ? null : 'Enter a valid email'),
      status_id: (v) => (v ? null : 'Required'),
      roles: (v) => (v.length > 0 ? null : 'Assign at least one role'),
    },
  });

  function openCreate() {
    setEditing(null);
    setTemporaryPassword(null);
    form.reset();
    setModalOpen(true);
  }

  function openEdit(row: PlatformUser) {
    setEditing(row);
    setTemporaryPassword(null);
    const [first_name = '', ...rest] = row.full_name.split(' ');
    form.setValues({
      first_name, last_name: rest.join(' '), email: row.email, phone: row.phone ?? '',
      national_id: '', preferred_language_id: '', status_id: String(row.status_id), roles: row.roles,
    });
    setModalOpen(true);
  }

  function handleSubmit(values: typeof form.values) {
    if (editing) {
      update.mutate({ id: editing.id, payload: values }, { onSuccess: () => setModalOpen(false) });
    } else {
      create.mutate(values, {
        onSuccess: (response) => {
          setTemporaryPassword(response.data.temporary_password);
        },
      });
    }
  }

  async function handleResetPassword(row: PlatformUser) {
    const { data } = await api.post(`/users/${row.id}/reset-password`);
    notifications.show({
      color: 'kiyovuGreen',
      title: 'Temporary password issued',
      message: `New temporary password for ${row.full_name}: ${data.temporary_password}`,
      autoClose: false,
    });
  }

  const columns: DataTableColumn<PlatformUser>[] = [
    { key: 'full_name', header: 'Name' },
    { key: 'email', header: 'Email' },
    {
      key: 'roles', header: 'Roles',
      render: (r) => (
        <Group gap={4}>
          {r.roles.slice(0, 2).map((role) => <Badge key={role} size="sm" variant="light">{role}</Badge>)}
          {r.roles.length > 2 && <Badge size="sm" variant="outline">+{r.roles.length - 2}</Badge>}
        </Group>
      ),
      exportValue: (r) => r.roles.join(', '),
    },
    { key: 'status', header: 'Status', render: (r) => <Badge color={undefined} style={{ backgroundColor: r.status?.color_hex }}>{r.status?.label_en}</Badge>, exportValue: (r) => r.status?.label_en ?? '' },
    { key: 'last_login_at', header: 'Last Login', render: (r) => r.last_login_at ? new Date(r.last_login_at).toLocaleString() : 'Never', exportValue: (r) => r.last_login_at ?? 'Never' },
    {
      key: 'reset', header: 'Password',
      render: (r) => (
        <Tooltip label="Issue new temporary password">
          <ActionIcon variant="subtle" color="kiyovuGreen" onClick={() => handleResetPassword(r)}>
            <IconKey size={16} />
          </ActionIcon>
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <Title order={2} mb="md">User Management</Title>
      <Text c="dimmed" size="sm" mb="md">
        Platform account administration — create logins, assign roles, and manage account status.
        This is separate from the 53 IRR module forms; it controls who can access the system at all.
      </Text>
      <DataTable<PlatformUser>
        title="Users"
        moduleKey="users"
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
      />

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit User' : 'New User'} size="lg" centered>
        {temporaryPassword ? (
          <Stack>
            <Alert icon={<IconCheck size={16} />} color="kiyovuGreen" title="Account created">
              Share this temporary password with the user — it will not be shown again.
            </Alert>
            <Group>
              <TextInput value={temporaryPassword} readOnly style={{ flex: 1 }} />
              <CopyButton value={temporaryPassword}>
                {({ copied, copy }) => (
                  <Button leftSection={<IconCopy size={16} />} color={copied ? 'kiyovuGreen' : undefined} variant="default" onClick={copy}>
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                )}
              </CopyButton>
            </Group>
            <Group justify="flex-end">
              <Button color="kiyovuGreen" onClick={() => setModalOpen(false)}>Done</Button>
            </Group>
          </Stack>
        ) : (
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              <Group grow>
                <TextInput label="First Name" required {...form.getInputProps('first_name')} />
                <TextInput label="Last Name" required {...form.getInputProps('last_name')} />
              </Group>
              <TextInput label="Email" required {...form.getInputProps('email')} />
              <Group grow>
                <TextInput label="Phone" {...form.getInputProps('phone')} />
                <TextInput label="National ID" {...form.getInputProps('national_id')} />
              </Group>
              <Group grow>
                <Select label="Preferred Language" data={languages.data} clearable {...form.getInputProps('preferred_language_id')} />
                <Select label="Status" data={statuses.data} required {...form.getInputProps('status_id')} />
              </Group>
              <MultiSelect label="Roles" data={roles.data ?? []} required searchable {...form.getInputProps('roles')} />
              <Group justify="flex-end">
                <Button variant="default" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit" color="kiyovuGreen" loading={create.isPending || update.isPending}>{t('common.save')}</Button>
              </Group>
            </Stack>
          </form>
        )}
      </Modal>
    </>
  );
}
