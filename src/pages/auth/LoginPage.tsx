import { useState } from 'react';
import { Paper, TextInput, PasswordInput, Button, Checkbox, Stack, Image, Text, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { IconAlertCircle } from '@tabler/icons-react';
import { useAuthStore } from '../../stores/authStore';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    initialValues: { email: '', password: '', remember: false },
    validate: {
      email: (v) => (/^\S+@\S+$/.test(v) ? null : 'Enter a valid email address'),
      password: (v) => (v.length > 0 ? null : 'Password is required'),
    },
  });

  async function handleSubmit(values: typeof form.values) {
    setError(null);
    setSubmitting(true);
    try {
      await login(values.email, values.password);
      navigate('/');
    } catch {
      setError(t('auth.loginError'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Stack align="center" justify="center" mih="100vh" bg="gray.0">
      <Paper withBorder shadow="sm" p="xl" radius="md" w={380}>
        <Stack align="center" mb="md">
          <Image src="/kiyovu-crest.png" alt="Kiyovu Sports" h={72} w={72} fit="contain" />
          <Text fw={900} size="lg" c="kiyovuGreen.8">Kiyovu Sports</Text>
          <Text size="sm" c="dimmed">{t('app.portal')}</Text>
        </Stack>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md">
            {error}
          </Alert>
        )}

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput label={t('auth.email')} placeholder="you@kiyovusports.net" {...form.getInputProps('email')} />
            <PasswordInput label={t('auth.password')} {...form.getInputProps('password')} />
            <Checkbox label={t('auth.rememberMe')} {...form.getInputProps('remember', { type: 'checkbox' })} />
            <Button type="submit" color="kiyovuGreen" fullWidth loading={submitting}>
              {t('auth.loginButton')}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
}
