import { Stack, Paper, Group, Text, ThemeIcon } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { NavItem } from '../../components/layout/navConfig';

interface Props {
  modules: NavItem[];
}

export function SelfServiceLinksList({ modules }: Props) {
  const { t } = useTranslation();

  return (
    <Stack gap="sm" maw={520}>
      {modules.map((mod) => (
        <Paper key={mod.path} withBorder p="md" radius="md" component={Link} to={mod.path}>
          <Group>
            <ThemeIcon size="lg" radius="xl" color="kiyovuGreen" variant="light">
              <mod.icon size={20} />
            </ThemeIcon>
            <div>
              <Text fw={600}>{t(mod.labelKey)}</Text>
              <Text size="xs" c="dimmed">View and manage your records</Text>
            </div>
          </Group>
        </Paper>
      ))}
      {modules.length === 0 && (
        <Text c="dimmed" size="sm">
          Nothing to show yet — your account hasn't been assigned to any records.
          Contact the Secretary General's office if this seems wrong.
        </Text>
      )}
    </Stack>
  );
}
