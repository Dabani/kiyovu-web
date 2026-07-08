import { Title, Text, Badge } from '@mantine/core';
import { useAuthStore } from '../stores/authStore';
import { visibleNavItems } from '../components/layout/navConfig';
import { resolveDashboardRoleGroup, DASHBOARD_COPY } from './dashboards/roleGroups';
import { ModuleTilesGrid } from './dashboards/ModuleTilesGrid';
import { AdminStatsRow } from './dashboards/AdminStatsRow';
import { SelfServiceLinksList } from './dashboards/SelfServiceLinksList';

export function DashboardPage() {
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];
  const modules = visibleNavItems(roles).filter((i) => i.path !== '/');
  const group = resolveDashboardRoleGroup(roles);
  const copy = DASHBOARD_COPY[group];

  return (
    <>
      <Title order={2} mb={4}>{copy.title}</Title>
      <Text c="dimmed" mb={4}>Welcome back, {user?.full_name}.</Text>
      <Text c="dimmed" size="sm" mb="lg">
        {copy.subtitle}
        {roles.length > 0 && (
          <>
            {' '}Signed in as {roles.map((r) => (
              <Badge key={r} size="xs" variant="light" color="kiyovuGreen" ml={4}>{r}</Badge>
            ))}
          </>
        )}
      </Text>

      {group === 'admin' && <AdminStatsRow />}

      {group === 'selfService'
        ? <SelfServiceLinksList modules={modules} />
        : <ModuleTilesGrid modules={modules} />}
    </>
  );
}
