import { useState } from 'react';
import { Modal, TextInput, MultiSelect, Button, Group, Stack, Alert, CopyButton, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMutation } from '@tanstack/react-query';
import { IconCheck, IconCopy, IconUserPlus } from '@tabler/icons-react';
import { api } from '../lib/api';
import { useRoleOptions } from '../hooks/useRoleOptions';

interface Props {
  opened: boolean;
  onClose: () => void;
  sourceType: 'member' | 'hr-employment-contract';
  sourceId: number;
  defaultEmail?: string | null;
  suggestedRoles?: string[];
}

interface ProvisionResult {
  is_new_account: boolean;
  temporary_password: string | null;
  email: string;
}

/**
 * Calls the shared account-provisioning endpoint rather than duplicating
 * user-creation logic per module — see AccountProvisioningController.
 */
export function ProvisionAccountModal({ opened, onClose, sourceType, sourceId, defaultEmail, suggestedRoles = [] }: Props) {
  const roles = useRoleOptions();
  const [result, setResult] = useState<ProvisionResult | null>(null);

  const form = useForm({
    initialValues: { email: defaultEmail ?? '', roles: suggestedRoles },
    validate: {
      email: (v) => (/^\S+@\S+$/.test(v) ? null : 'Enter a valid email address'),
      roles: (v) => (v.length > 0 ? null : 'Assign at least one role'),
    },
  });

  const mutation = useMutation({
    mutationFn: (values: typeof form.values) =>
      api.post(`/account-provisioning/${sourceType}/${sourceId}`, values),
    onSuccess: (response) => setResult(response.data),
  });

  function handleClose() {
    setResult(null);
    form.reset();
    onClose();
  }

  return (
    <Modal opened={opened} onClose={handleClose} title="Create Login Account" centered>
      {result ? (
        <Stack>
          <Alert icon={<IconCheck size={16} />} color="kiyovuGreen">
            {result.is_new_account
              ? 'Account created and linked to this record.'
              : 'An existing account with this email was linked to this record — no new password was generated.'}
          </Alert>
          {result.temporary_password && (
            <>
              <Text size="sm">Share this temporary password with them — it will not be shown again:</Text>
              <Group>
                <TextInput value={result.temporary_password} readOnly style={{ flex: 1 }} />
                <CopyButton value={result.temporary_password}>
                  {({ copied, copy }) => (
                    <Button leftSection={<IconCopy size={16} />} color={copied ? 'kiyovuGreen' : undefined} variant="default" onClick={copy}>
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  )}
                </CopyButton>
              </Group>
            </>
          )}
          <Group justify="flex-end">
            <Button color="kiyovuGreen" onClick={handleClose}>Done</Button>
          </Group>
        </Stack>
      ) : (
        <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
          <Stack>
            <Text size="sm" c="dimmed">
              Creates (or links, if the email already has an account) a login for this record.
            </Text>
            <TextInput label="Email Address" required {...form.getInputProps('email')} />
            <MultiSelect label="Roles" data={roles.data ?? []} required searchable {...form.getInputProps('roles')} />
            <Group justify="flex-end">
              <Button variant="default" onClick={handleClose}>Cancel</Button>
              <Button type="submit" color="kiyovuGreen" leftSection={<IconUserPlus size={16} />} loading={mutation.isPending}>
                Create Account
              </Button>
            </Group>
          </Stack>
        </form>
      )}
    </Modal>
  );
}
