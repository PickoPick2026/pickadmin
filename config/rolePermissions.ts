import { defaultPermissions } from "./menuItems";

export type Role = "SUPER_ADMIN" | "ADMIN" | "STAFF";

export const roles: Role[] = ["SUPER_ADMIN", "ADMIN", "STAFF"];

/**
 * Static fallback per role. The effective permission set for a user is
 * their stored `permissions` array (user form checkboxes) falling back to
 * these defaults — see Sidenav.tsx.
 */
export const rolePermissions: Record<Role, string[]> = {
  SUPER_ADMIN: defaultPermissions.SUPER_ADMIN,
  ADMIN: defaultPermissions.ADMIN,
  STAFF: defaultPermissions.STAFF,
};

/** Only super admins may manage users. */
export const canManageUsers = (role?: string | null) => role === "SUPER_ADMIN";

/**
 * Delete Leads is a granted ability (checkbox on the user form).
 * Super admins always can; everyone else needs the "delete_leads" permission.
 */
export const canDeleteLeads = (role?: string | null, stored?: string[] | null) =>
  role === "SUPER_ADMIN" || !!stored?.includes("delete_leads");

/** Resolve the effective sidebar keys for a signed-in user. */
export function resolvePermissions(role?: string | null, stored?: string[] | null): string[] {
  if (role === "SUPER_ADMIN") return rolePermissions.SUPER_ADMIN;
  if (stored && stored.length > 0) return stored;
  return rolePermissions[(role as Role) ?? "STAFF"] ?? rolePermissions.STAFF;
}
