import { AppShell, Burger, Group, Image, NavLink, Menu, Avatar, Text, Select } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { IconLogout, IconUserCircle, IconChevronDown, IconLockPassword } from '@tabler/icons-react';
import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { visibleNavItems } from './navConfig';
import { setLanguage } from '../../i18n';
import { ChangePasswordModal } from './ChangePasswordModal';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'rw', label: 'Ikinyarwanda' },
];

export function AppLayout() {
  const [opened, { toggle }] = useDisclosure();
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const items = visibleNavItems(user?.roles ?? []);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Image src="/kiyovu-crest.png" alt="Kiyovu Sports" h={36} w={36} fit="contain" />
            <div>
              <Text fw={900} c="kiyovuGreen.8" size="sm" lh={1.1}>{t('app.name')}</Text>
              <Text size="xs" c="dimmed" lh={1.1}>{t('app.portal')}</Text>
            </div>
          </Group>

          <Group gap="md">
            <Select
              data={LANGUAGES}
              value={i18n.language}
              onChange={(v) => v && setLanguage(v)}
              w={150}
              size="xs"
              allowDeselect={false}
              aria-label="Language"
            />
            <Menu shadow="md" width={220}>
              <Menu.Target>
                <Group gap={6} style={{ cursor: 'pointer' }}>
                  <Avatar radius="xl" color="kiyovuGreen" size="sm">
                    {user?.full_name?.[0] ?? '?'}
                  </Avatar>
                  <Text size="sm" fw={600} visibleFrom="sm">{user?.full_name}</Text>
                  <IconChevronDown size={14} />
                </Group>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<IconUserCircle size={16} />} component={Link} to="/profile">
                  {t('nav.myProfile')}
                </Menu.Item>
                <Menu.Item leftSection={<IconLockPassword size={16} />} onClick={() => setPasswordModalOpen(true)}>
                  Change Password
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item color="red" leftSection={<IconLogout size={16} />} onClick={handleLogout}>
                  {t('auth.logout')}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs" style={{ backgroundColor: 'var(--kiyovu-navbar-bg, #004d00)' }}>
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              component={Link}
              to={item.path}
              label={t(item.labelKey)}
              leftSection={<item.icon size={18} stroke={1.6} />}
              active={isActive}
              className="kiyovu-navlink"
              data-active={isActive}
              variant="subtle"
            />
          );
        })}
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>

      <ChangePasswordModal opened={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} />
    </AppShell>
  );
}
