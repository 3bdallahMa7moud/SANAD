/**
 * Capabilities that a Super Admin may grant to a regular administrator.
 *
 * They deliberately map to admin areas rather than individual HTTP verbs: an
 * administrator who can work with orders, for example, can both view and
 * update orders. The API guard remains the authorization boundary; the
 * frontend uses the same values only to keep unavailable navigation hidden.
 */
export const AdminPermission = {
  DASHBOARD: 'dashboard',
  ORDERS: 'orders',
  PACKAGES: 'packages',
  OFFERS: 'offers',
  COUPONS: 'coupons',
  CUSTOMERS: 'customers',
  PAYMENTS: 'payments',
  REVIEWS: 'reviews',
  PAGES: 'pages',
  MEDIA: 'media',
  SETTINGS: 'settings',
  ACTIVITY_LOGS: 'activity_logs',
  TESTIMONIALS: 'testimonials',
} as const;

export const ADMIN_PERMISSIONS = [
  AdminPermission.DASHBOARD,
  AdminPermission.ORDERS,
  AdminPermission.PACKAGES,
  AdminPermission.OFFERS,
  AdminPermission.COUPONS,
  AdminPermission.CUSTOMERS,
  AdminPermission.PAYMENTS,
  AdminPermission.REVIEWS,
  AdminPermission.PAGES,
  AdminPermission.MEDIA,
  AdminPermission.SETTINGS,
  AdminPermission.ACTIVITY_LOGS,
  AdminPermission.TESTIMONIALS,
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export function isAdminPermission(value: unknown): value is AdminPermission {
  return (
    typeof value === 'string' &&
    (ADMIN_PERMISSIONS as readonly string[]).includes(value)
  );
}

/**
 * `null` is intentionally distinct from `[]`.
 *
 * Older administrator accounts predate granular permissions, so their NULL
 * value preserves their existing access after the migration. An explicit empty
 * array is a valid, fully restricted administrator account.
 */
export function normalizeAdminPermissions(
  value: unknown,
): AdminPermission[] | null {
  if (value === null || value === undefined) return null;
  if (!Array.isArray(value)) return [];

  return [...new Set(value.filter(isAdminPermission))];
}

/** Returns whether a regular admin can access a specific administrative area. */
export function hasAdminPermission(
  value: unknown,
  permission: AdminPermission,
): boolean {
  const permissions = normalizeAdminPermissions(value);
  return permissions === null || permissions.includes(permission);
}
