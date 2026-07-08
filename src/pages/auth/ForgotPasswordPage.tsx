import { useState } from 'react';
import { Paper, TextInput, Button, Stack, Image, Text, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { IconCheck } from '@tabler/icons-react';
import { api } from '../../lib/api';

export function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm({
    initialValues: { email: '' },
    validate: { email: (v) => (/^\S+@\S+$/.test(v) ? null : 'Enter a valid email address') },
  });

  const mutation = useMutation({
    mutationFn: (values: typeof form.values) => api.post('/auth/forgot-password', values),
    onSuccess: () => setSubmitted(true),
  });

  return (
    <Stack align="center" justify="center" mih="100vh" bg="gray.0">
      <Paper withBorder shadow="sm" p="xl" radius="md" w={380}>
        <Stack align="center" mb="md">
          <Image src="/kiyovu-crest.png" alt="Kiyovu Sports" h={64} w={64} fit="contain" />
          <Text fw={900} size="lg" c="kiyovuGreen.8">Reset your password</Text>
        </Stack>

        {submitted ? (
          <Stack>
            <Alert icon={<IconCheck size={16} />} color="kiyovuGreen">
              If that email address has an account, a reset link is on its way. Check your inbox.
            </Alert>
            <Button component={Link} to="/login" variant="default" fullWidth>Back to login</Button>
          </Stack>
        ) : (
          <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
            <Stack>
              <Text size="sm" c="dimmed">
                Enter the email address on your account and we'll send you a link to reset your password.
              </Text>
              <TextInput label="Email address" placeholder="you@kiyovusports.rw" required {...form.getInputProps('email')} />
              <Button type="submit" color="kiyovuGreen" fullWidth loading={mutation.isPending}>
                Send reset link
              </Button>
              <Button component={Link} to="/login" variant="subtle" size="sm" fullWidth>
                Back to login
              </Button>
            </Stack>
          </form>
        )}
      </Paper>
    </Stack>
  );
}
