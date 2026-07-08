export type DashboardRoleGroup = 'admin' | 'governance' | 'committee' | 'staff' | 'selfService';

const GOVERNANCE_ROLES = [
  'president', 'vice_president', 'secretary_general', 'treasurer',
  'director_technical_affairs', 'board_director', 'ceo',
];

const COMMITTEE_ROLES = [
  'commission_president', 'hr_committee', 'electoral_commission',
  'legal_commission', 'conflict_resolution_organ', 'audit_organ',
];

const STAFF_ROLES = ['hq_business', 'hq_sport'];

/**
 * Self-service roles (member, honorary_member, fan_club_rep, player,
 * partner, guest) aren't matched explicitly — they're the fallthrough
 * default below, since "self-service" is just "none of the above".
 */

/**
 * A user can hold multiple roles — this resolves to the single "richest"
 * dashboard experience they qualify for, in priority order. A committee
 * member who is also a plain member sees the committee dashboard, not the
 * self-service one, since it's a superset of what they need.
 */
export function resolveDashboardRoleGroup(roles: string[]): DashboardRoleGroup {
  if (roles.includes('super_admin')) return 'admin';
  if (roles.some((r) => GOVERNANCE_ROLES.includes(r))) return 'governance';
  if (roles.some((r) => COMMITTEE_ROLES.includes(r))) return 'committee';
  if (roles.some((r) => STAFF_ROLES.includes(r))) return 'staff';
  return 'selfService';
}

export const DASHBOARD_COPY: Record<DashboardRoleGroup, { title: string; subtitle: string }> = {
  admin: {
    title: 'System Administration',
    subtitle: 'Full platform oversight — every module, every account, every record.',
  },
  governance: {
    title: 'Governance Overview',
    subtitle: 'Association-wide visibility across membership, finance, and compliance.',
  },
  committee: {
    title: 'Committee Workspace',
    subtitle: 'The modules your commission or committee is responsible for.',
  },
  staff: {
    title: 'Headquarters Workspace',
    subtitle: 'Day-to-day operational modules for HQ personnel.',
  },
  selfService: {
    title: 'My Kiyovu Sports',
    subtitle: 'Your membership, requests, and records in one place.',
  },
};
