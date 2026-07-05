import { Title, Text, SimpleGrid, Paper, Group, ThemeIcon } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { visibleNavItems } from '../components/layout/navConfig';

export function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const modules = visibleNavItems(user?.roles ?? []).filter((i) => i.path !== '/');

  return (
    <>
      <Title order={2} mb={4}>{t('nav.dashboard')}</Title>
      <Text c="dimmed" mb="lg">Welcome back, {user?.full_name}.</Text>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        {modules.map((mod) => (
          <Paper key={mod.path} withBorder p="md" radius="md" component="a" href={mod.path}>
            <Group>
              <ThemeIcon size="lg" radius="md" color="kiyovuGreen" variant="light">
                <mod.icon size={20} />
              </ThemeIcon>
              <Text fw={600}>{t(mod.labelKey)}</Text>
            </Group>
          </Paper>
        ))}
      </SimpleGrid>
    </>
  );
}
