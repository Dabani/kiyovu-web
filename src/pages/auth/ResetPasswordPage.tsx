import { useState } from 'react';
import { Paper, PasswordInput, Button, Stack, Image, Text, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { api } from '../../lib/api';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('token') ?? '';
  const email = searchParams.get('email') ?? '';

  const form = useForm({
    initialValues: { password: '', password_confirmation: '' },
    validate: {
      password: (v) => (v.length >= 8 ? null : 'Must be at least 8 characters'),
      password_confirmation: (v, values) => (v === values.password ? null : 'Passwords do not match'),
    },
  });

  const mutation = useMutation({
    mutationFn: (values: typeof form.values) => api.post('/auth/reset-password', { ...values, token, email }),
    onSuccess: () => setDone(true),
    onError: () => setError('This reset link is invalid or has expired. Please request a new one.'),
  });

  if (!token || !email) {
    return (
      <Stack align="center" justify="center" mih="100vh" bg="gray.0">
        <Paper withBorder shadow="sm" p="xl" radius="md" w={380}>
          <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md">
            This reset link is missing required information.
          </Alert>
          <Button component={Link} to="/forgot-password" color="kiyovuGreen" fullWidth>
            Request a new link
          </Button>
        </Paper>
      </Stack>
    );
  }

  return (
    <Stack align="center" justify="center" mih="100vh" bg="gray.0">
      <Paper withBorder shadow="sm" p="xl" radius="md" w={380}>
        <Stack align="center" mb="md">
          <Image src="/kiyovu-crest.png" alt="Kiyovu Sports" h={64} w={64} fit="contain" />
          <Text fw={900} size="lg" c="kiyovuGreen.8">Set a new password</Text>
          <Text size="xs" c="dimmed">{email}</Text>
        </Stack>

        {done ? (
          <Stack>
            <Alert icon={<IconCheck size={16} />} color="kiyovuGreen">
              Your password has been reset. You can now log in.
            </Alert>
            <Button color="kiyovuGreen" fullWidth onClick={() => navigate('/login')}>
              Go to login
            </Button>
          </Stack>
        ) : (
          <form onSubmit={form.onSubmit((values) => { setError(null); mutation.mutate(values); })}>
            <Stack>
              {error && <Alert icon={<IconAlertCircle size={16} />} color="red">{error}</Alert>}
              <PasswordInput label="New Password" required {...form.getInputProps('password')} />
              <PasswordInput label="Confirm New Password" required {...form.getInputProps('password_confirmation')} />
              <Button type="submit" color="kiyovuGreen" fullWidth loading={mutation.isPending}>
                Reset password
              </Button>
            </Stack>
          </form>
        )}
      </Paper>
    </Stack>
  );
}
