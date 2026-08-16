import { UserAccount } from "../types";

export type Role = UserAccount["role"];

const ADMIN_TIER_ROLES: Role[] = ["Admin", "Admin Super", "Admin Biasa"];

/** Any of the 3 admin sub-roles (Admin, Admin Super, Admin Biasa) - not VVIP, not Pengajar. */
export function isAdminTier(role: Role | null | undefined): boolean {
  return !!role && ADMIN_TIER_ROLES.includes(role);
}

/**
 * Admin-tier or VVIP - the executive/admin oversight gate used across most
 * admin-only features (full financial rekap, VVIP room, exec dashboards).
 */
export function isAdminOrVvip(role: Role | null | undefined): boolean {
  return role === "VVIP" || isAdminTier(role);
}

/**
 * Anyone with oversight over all students' data: teaching staff, any admin
 * tier, or VVIP executive access. Does NOT include Siswa or Alumni - those
 * only ever see their own records.
 */
export function hasStaffOversight(role: Role | null | undefined): boolean {
  return role === "Pengajar" || isAdminTier(role) || role === "VVIP";
}
