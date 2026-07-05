import {
  IconLayoutDashboard, IconUsers, IconBriefcase, IconCheckupList, IconGavel,
  IconCash, IconShieldStar, IconBallFootball, IconShield, IconHistory, IconUserCog,
} from '@tabler/icons-react';

export interface NavItem {
  labelKey: string;
  path: string;
  icon: typeof IconLayoutDashboard;
  /** Roles that can see this item. Empty = visible to everyone authenticated. */
  roles?: string[];
}

/**
 * Single source of truth for sidebar visibility. Each module bundle
 * delivery only needs to flip the `roles` list here — no routing rewrite.
 */
export const NAV_ITEMS: NavItem[] = [
  { labelKey: 'nav.dashboard', path: '/', icon: IconLayoutDashboard },
  {
    labelKey: 'nav.membership', path: '/membership', icon: IconUsers,
    roles: ['super_admin', 'president', 'secretary_general', 'member', 'honorary_member'],
  },
  {
    labelKey: 'nav.hr', path: '/hr', icon: IconBriefcase,
    roles: ['super_admin', 'hr_committee', 'ceo'],
  },
  {
    labelKey: 'nav.elections', path: '/elections', icon: IconCheckupList,
    roles: ['super_admin', 'electoral_commission', 'president', 'secretary_general'],
  },
  {
    labelKey: 'nav.disciplinary', path: '/disciplinary-legal', icon: IconGavel,
    roles: ['super_admin', 'legal_commission', 'conflict_resolution_organ', 'president'],
  },
  {
    labelKey: 'nav.financial', path: '/financial', icon: IconCash,
    roles: ['super_admin', 'treasurer', 'audit_organ', 'president'],
  },
  {
    labelKey: 'nav.fanClubs', path: '/fan-clubs', icon: IconShieldStar,
    roles: ['super_admin', 'hq_business', 'fan_club_rep'],
  },
  {
    labelKey: 'nav.players', path: '/players-safeguarding', icon: IconBallFootball,
    roles: ['super_admin', 'hq_sport', 'director_technical_affairs', 'player'],
  },
  {
    labelKey: 'nav.operations', path: '/operations', icon: IconShield,
    roles: ['super_admin', 'hq_business', 'board_director'],
  },
  {
    labelKey: 'nav.auditLog', path: '/audit-log', icon: IconHistory,
    roles: ['super_admin', 'audit_organ'],
  },
  {
    labelKey: 'nav.userManagement', path: '/users', icon: IconUserCog,
    roles: ['super_admin'],
  },
];

export function visibleNavItems(userRoles: string[]): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.some((r) => userRoles.includes(r)));
}
