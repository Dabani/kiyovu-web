import { SimpleGrid, Paper, Group, Text, ThemeIcon } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { NavItem } from '../../components/layout/navConfig';

interface Props {
  modules: NavItem[];
}

export function ModuleTilesGrid({ modules }: Props) {
  const { t } = useTranslation();

  return (
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
  );
}
