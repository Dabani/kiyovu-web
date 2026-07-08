import { SimpleGrid, Paper, Text, Group, ThemeIcon } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { IconUsers, IconApps, IconLayoutGrid, IconShieldLock } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

export function AdminStatsRow() {
  const { data: userCount } = useQuery({
    queryKey: ['dashboard-user-count'],
    queryFn: async () => {
      const { data } = await api.get('/users', { params: { per_page: 1 } });
      return data.meta?.total ?? data.data?.length ?? 0;
    },
  });

  const stats = [
    { label: 'Total Users', value: userCount ?? '—', icon: IconUsers, to: '/users' },
    { label: 'Module Bundles', value: 8, icon: IconApps, to: '/' },
    { label: 'Data Entry Screens', value: 53, icon: IconLayoutGrid, to: '/' },
    { label: 'Seeded Roles', value: 22, icon: IconShieldLock, to: '/users' },
  ];

  return (
    <SimpleGrid cols={{ base: 2, sm: 4 }} mb="lg">
      {stats.map((stat) => (
        <Paper key={stat.label} withBorder p="md" radius="md" component={Link} to={stat.to}>
          <Group justify="space-between" mb={4}>
            <ThemeIcon size="md" radius="md" color="kiyovuGreen" variant="light">
              <stat.icon size={16} />
            </ThemeIcon>
          </Group>
          <Text fw={900} size="xl" c="kiyovuGreen.8">{stat.value}</Text>
          <Text size="xs" c="dimmed">{stat.label}</Text>
        </Paper>
      ))}
    </SimpleGrid>
  );
}
