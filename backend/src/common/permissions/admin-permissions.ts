/**
 * Fine-grained capabilities that a Super Admin may grant to a regular admin.
 *
 * Read and write access are intentionally separate. The API guard is the
 * authorization boundary; the frontend mirrors these values only to keep the
 * navigation and actions understandable.
 */
export const AdminPermission = {
  DASHBOARD_VIEW: 'dashboard.view',
  ORDERS_VIEW: 'orders.view',
  ORDERS_MANAGE: 'orders.manage',
  PACKAGES_VIEW: 'packages.view',
  PACKAGES_MANAGE: 'packages.manage',
  OFFERS_VIEW: 'offers.view',
  OFFERS_MANAGE: 'offers.manage',
  COUPONS_VIEW: 'coupons.view',
  COUPONS_MANAGE: 'coupons.manage',
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_MANAGE: 'customers.manage',
  PAYMENTS_VIEW: 'payments.view',
  PAYMENTS_CONFIRM_MANUAL: 'payments.confirm_manual',
  REVIEWS_VIEW: 'reviews.view',
  REVIEWS_MANAGE: 'reviews.manage',
  PAGES_VIEW: 'pages.view',
  PAGES_MANAGE: 'pages.manage',
  MEDIA_VIEW: 'media.view',
  MEDIA_MANAGE: 'media.manage',
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_MANAGE: 'settings.manage',
  ACTIVITY_LOGS_VIEW: 'activity_logs.view',
} as const;

export const ADMIN_PERMISSIONS = [
  AdminPermission.DASHBOARD_VIEW,
  AdminPermission.ORDERS_VIEW,
  AdminPermission.ORDERS_MANAGE,
  AdminPermission.PACKAGES_VIEW,
  AdminPermission.PACKAGES_MANAGE,
  AdminPermission.OFFERS_VIEW,
  AdminPermission.OFFERS_MANAGE,
  AdminPermission.COUPONS_VIEW,
  AdminPermission.COUPONS_MANAGE,
  AdminPermission.CUSTOMERS_VIEW,
  AdminPermission.CUSTOMERS_MANAGE,
  AdminPermission.PAYMENTS_VIEW,
  AdminPermission.PAYMENTS_CONFIRM_MANUAL,
  AdminPermission.REVIEWS_VIEW,
  AdminPermission.REVIEWS_MANAGE,
  AdminPermission.PAGES_VIEW,
  AdminPermission.PAGES_MANAGE,
  AdminPermission.MEDIA_VIEW,
  AdminPermission.MEDIA_MANAGE,
  AdminPermission.SETTINGS_VIEW,
  AdminPermission.SETTINGS_MANAGE,
  AdminPermission.ACTIVITY_LOGS_VIEW,
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

const PERMISSION_DEPENDENCIES: Partial<
  Record<AdminPermission, readonly AdminPermission[]>
> = {
  [AdminPermission.ORDERS_MANAGE]: [AdminPermission.ORDERS_VIEW],
  [AdminPermission.PACKAGES_MANAGE]: [AdminPermission.PACKAGES_VIEW],
  [AdminPermission.OFFERS_MANAGE]: [
    AdminPermission.OFFERS_VIEW,
    AdminPermission.PACKAGES_VIEW,
  ],
  [AdminPermission.COUPONS_MANAGE]: [AdminPermission.COUPONS_VIEW],
  [AdminPermission.CUSTOMERS_MANAGE]: [AdminPermission.CUSTOMERS_VIEW],
  [AdminPermission.PAYMENTS_CONFIRM_MANUAL]: [
    AdminPermission.ORDERS_VIEW,
    AdminPermission.PAYMENTS_VIEW,
  ],
  [AdminPermission.REVIEWS_MANAGE]: [AdminPermission.REVIEWS_VIEW],
  [AdminPermission.PAGES_MANAGE]: [AdminPermission.PAGES_VIEW],
  [AdminPermission.MEDIA_MANAGE]: [AdminPermission.MEDIA_VIEW],
  [AdminPermission.SETTINGS_MANAGE]: [AdminPermission.SETTINGS_VIEW],
};

/** Expand the area-only values supported by the first permissions migration. */
const LEGACY_PERMISSION_MAP: Record<string, readonly AdminPermission[]> = {
  dashboard: [AdminPermission.DASHBOARD_VIEW],
  orders: [AdminPermission.ORDERS_VIEW, AdminPermission.ORDERS_MANAGE],
  packages: [AdminPermission.PACKAGES_VIEW, AdminPermission.PACKAGES_MANAGE],
  offers: [AdminPermission.OFFERS_VIEW, AdminPermission.OFFERS_MANAGE],
  coupons: [AdminPermission.COUPONS_VIEW, AdminPermission.COUPONS_MANAGE],
  customers: [AdminPermission.CUSTOMERS_VIEW, AdminPermission.CUSTOMERS_MANAGE],
  payments: [
    AdminPermission.PAYMENTS_VIEW,
    AdminPermission.PAYMENTS_CONFIRM_MANUAL,
  ],
  reviews: [AdminPermission.REVIEWS_VIEW, AdminPermission.REVIEWS_MANAGE],
  testimonials: [AdminPermission.REVIEWS_VIEW, AdminPermission.REVIEWS_MANAGE],
  pages: [AdminPermission.PAGES_VIEW, AdminPermission.PAGES_MANAGE],
  media: [AdminPermission.MEDIA_VIEW, AdminPermission.MEDIA_MANAGE],
  settings: [AdminPermission.SETTINGS_VIEW, AdminPermission.SETTINGS_MANAGE],
  activity_logs: [AdminPermission.ACTIVITY_LOGS_VIEW],
};

export function isAdminPermission(value: unknown): value is AdminPermission {
  return (
    typeof value === 'string' &&
    (ADMIN_PERMISSIONS as readonly string[]).includes(value)
  );
}

/**
 * `null` remains distinct from `[]`: existing admins predate granular
 * permissions, so NULL preserves their access until the Super Admin saves an
 * explicit selection. New admins always receive an explicit array.
 */
export function normalizeAdminPermissions(
  value: unknown,
): AdminPermission[] | null {
  if (value === null || value === undefined) return null;
  if (!Array.isArray(value)) return [];

  const normalized = value.flatMap((permission) => {
    if (isAdminPermission(permission)) return [permission];
    if (typeof permission === 'string') {
      return [...(LEGACY_PERMISSION_MAP[permission] ?? [])];
    }
    return [];
  });

  const result = new Set(normalized);
  for (const permission of normalized) {
    for (const dependency of PERMISSION_DEPENDENCIES[permission] ?? []) {
      result.add(dependency);
    }
  }
  return ADMIN_PERMISSIONS.filter((permission) => result.has(permission));
}

/** Super Admin always passes; this helper handles regular-admin values only. */
export function hasAdminPermission(
  value: unknown,
  permission: AdminPermission,
): boolean {
  const permissions = normalizeAdminPermissions(value);
  return permissions === null || permissions.includes(permission);
}
