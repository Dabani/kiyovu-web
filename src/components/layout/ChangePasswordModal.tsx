import { Modal, PasswordInput, Button, Group, Stack, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import { api } from '../../lib/api';

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ opened, onClose }: Props) {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    initialValues: { current_password: '', password: '', password_confirmation: '' },
    validate: {
      current_password: (v) => (v ? null : 'Required'),
      password: (v) => (v.length >= 8 ? null : 'Must be at least 8 characters'),
      password_confirmation: (v, values) => (v === values.password ? null : 'Passwords do not match'),
    },
  });

  const mutation = useMutation({
    mutationFn: (values: typeof form.values) => api.put('/auth/password', values),
    onSuccess: () => {
      notifications.show({ color: 'kiyovuGreen', message: 'Password updated successfully.' });
      form.reset();
      onClose();
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { errors?: Record<string, string[]> } } })
        ?.response?.data?.errors?.current_password?.[0];
      setError(message ?? 'Could not update password. Please try again.');
    },
  });

  function handleClose() {
    form.reset();
    setError(null);
    onClose();
  }

  return (
    <Modal opened={opened} onClose={handleClose} title="Change Password" centered>
      <form onSubmit={form.onSubmit((values) => { setError(null); mutation.mutate(values); })}>
        <Stack>
          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red">
              {error}
            </Alert>
          )}
          <PasswordInput label="Current Password" required {...form.getInputProps('current_password')} />
          <PasswordInput label="New Password" required description="At least 8 characters" {...form.getInputProps('password')} />
          <PasswordInput label="Confirm New Password" required {...form.getInputProps('password_confirmation')} />
          <Group justify="flex-end">
            <Button variant="default" onClick={handleClose}>{t('common.cancel')}</Button>
            <Button type="submit" color="kiyovuGreen" leftSection={<IconCheck size={16} />} loading={mutation.isPending}>
              Update Password
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
