import type { User } from '@/types/domain';

export const ADMIN_PERMISSIONS = [
  'dashboard.view',
  'orders.view',
  'orders.manage',
  'packages.view',
  'packages.manage',
  'offers.view',
  'offers.manage',
  'coupons.view',
  'coupons.manage',
  'customers.view',
  'customers.manage',
  'payments.view',
  'payments.confirm_manual',
  'reviews.view',
  'reviews.manage',
  'pages.view',
  'pages.manage',
  'media.view',
  'media.manage',
  'settings.view',
  'settings.manage',
  'activity_logs.view',
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

const permissionSet = new Set<string>(ADMIN_PERMISSIONS);

const LEGACY_PERMISSION_MAP: Record<string, readonly AdminPermission[]> = {
  dashboard: ['dashboard.view'],
  orders: ['orders.view', 'orders.manage'],
  packages: ['packages.view', 'packages.manage'],
  offers: ['offers.view', 'offers.manage'],
  coupons: ['coupons.view', 'coupons.manage'],
  customers: ['customers.view', 'customers.manage'],
  payments: ['payments.view', 'payments.confirm_manual'],
  reviews: ['reviews.view', 'reviews.manage'],
  testimonials: ['reviews.view', 'reviews.manage'],
  pages: ['pages.view', 'pages.manage'],
  media: ['media.view', 'media.manage'],
  settings: ['settings.view', 'settings.manage'],
  activity_logs: ['activity_logs.view'],
};

export function normalizeAdminPermissions(
  value: unknown,
): AdminPermission[] | null {
  if (value === null || value === undefined) return null;
  if (!Array.isArray(value)) return [];
  const permissions = value.flatMap((permission) => {
    if (typeof permission !== 'string') return [];
    if (permissionSet.has(permission)) return [permission as AdminPermission];
    return [...(LEGACY_PERMISSION_MAP[permission] ?? [])];
  });
  return [...new Set(permissions)];
}

export function hasAdminPermission(
  user: User | null | undefined,
  permission: AdminPermission,
) {
  if (user?.role === 'super_admin') return true;
  if (user?.role !== 'admin') return false;
  const permissions = user.adminPermissions;
  return permissions === null || permissions?.includes(permission) === true;
}

const ADMIN_LANDING_ROUTES = [
  ['dashboard.view', '/admin'],
  ['orders.view', '/admin/orders'],
  ['packages.view', '/admin/packages'],
  ['offers.view', '/admin/offers'],
  ['coupons.view', '/admin/coupons'],
  ['customers.view', '/admin/customers'],
  ['payments.view', '/admin/payments'],
  ['reviews.view', '/admin/reviews'],
  ['pages.view', '/admin/pages'],
  ['media.view', '/admin/media'],
  ['settings.view', '/admin/settings'],
  ['activity_logs.view', '/admin/activity-logs'],
] as const satisfies ReadonlyArray<readonly [AdminPermission, string]>;

export function firstAllowedAdminRoute(user: User) {
  if (user.role === 'super_admin') return '/admin';
  return (
    ADMIN_LANDING_ROUTES.find(([permission]) =>
      hasAdminPermission(user, permission),
    )?.[1] ?? '/admin'
  );
}

export const ADMIN_PERMISSION_GROUPS = [
  {
    key: 'dashboard',
    labelEn: 'Dashboard',
    labelAr: 'لوحة التحكم',
    permissions: [
      { value: 'dashboard.view', labelEn: 'View', labelAr: 'مشاهدة' },
    ],
  },
  {
    key: 'orders',
    labelEn: 'Orders',
    labelAr: 'الطلبات',
    permissions: [
      { value: 'orders.view', labelEn: 'View', labelAr: 'مشاهدة' },
      { value: 'orders.manage', labelEn: 'Manage', labelAr: 'إدارة' },
    ],
  },
  {
    key: 'packages',
    labelEn: 'Services',
    labelAr: 'الخدمات',
    permissions: [
      { value: 'packages.view', labelEn: 'View', labelAr: 'مشاهدة' },
      { value: 'packages.manage', labelEn: 'Manage', labelAr: 'إدارة' },
    ],
  },
  {
    key: 'offers',
    labelEn: 'Offers',
    labelAr: 'العروض',
    permissions: [
      { value: 'offers.view', labelEn: 'View', labelAr: 'مشاهدة' },
      { value: 'offers.manage', labelEn: 'Manage', labelAr: 'إدارة' },
    ],
  },
  {
    key: 'coupons',
    labelEn: 'Coupons',
    labelAr: 'الكوبونات',
    permissions: [
      { value: 'coupons.view', labelEn: 'View', labelAr: 'مشاهدة' },
      { value: 'coupons.manage', labelEn: 'Manage', labelAr: 'إدارة' },
    ],
  },
  {
    key: 'customers',
    labelEn: 'Customers',
    labelAr: 'العملاء',
    permissions: [
      { value: 'customers.view', labelEn: 'View', labelAr: 'مشاهدة' },
      { value: 'customers.manage', labelEn: 'Manage', labelAr: 'إدارة' },
    ],
  },
  {
    key: 'payments',
    labelEn: 'Payments',
    labelAr: 'المدفوعات',
    permissions: [
      { value: 'payments.view', labelEn: 'View', labelAr: 'مشاهدة' },
      {
        value: 'payments.confirm_manual',
        labelEn: 'Confirm manual payments',
        labelAr: 'تأكيد الدفع اليدوي',
      },
    ],
  },
  {
    key: 'reviews',
    labelEn: 'Reviews',
    labelAr: 'التقييمات',
    permissions: [
      { value: 'reviews.view', labelEn: 'View', labelAr: 'مشاهدة' },
      { value: 'reviews.manage', labelEn: 'Moderate', labelAr: 'إدارة النشر' },
    ],
  },
  {
    key: 'pages',
    labelEn: 'Pages',
    labelAr: 'الصفحات',
    permissions: [
      { value: 'pages.view', labelEn: 'View', labelAr: 'مشاهدة' },
      { value: 'pages.manage', labelEn: 'Manage', labelAr: 'إدارة' },
    ],
  },
  {
    key: 'media',
    labelEn: 'Media',
    labelAr: 'الوسائط',
    permissions: [
      { value: 'media.view', labelEn: 'View', labelAr: 'مشاهدة' },
      { value: 'media.manage', labelEn: 'Manage', labelAr: 'إدارة' },
    ],
  },
  {
    key: 'settings',
    labelEn: 'Settings',
    labelAr: 'الإعدادات',
    permissions: [
      { value: 'settings.view', labelEn: 'View', labelAr: 'مشاهدة' },
      { value: 'settings.manage', labelEn: 'Manage', labelAr: 'إدارة' },
    ],
  },
  {
    key: 'activity_logs',
    labelEn: 'Activity Logs',
    labelAr: 'سجل النشاط',
    permissions: [
      { value: 'activity_logs.view', labelEn: 'View', labelAr: 'مشاهدة' },
    ],
  },
] as const satisfies ReadonlyArray<{
  key: string;
  labelEn: string;
  labelAr: string;
  permissions: ReadonlyArray<{
    value: AdminPermission;
    labelEn: string;
    labelAr: string;
  }>;
}>;

export const ADMIN_PERMISSION_PRESETS = {
  customer_service: [
    'dashboard.view',
    'orders.view',
    'orders.manage',
    'customers.view',
  ],
  order_manager: [
    'dashboard.view',
    'orders.view',
    'orders.manage',
    'customers.view',
  ],
  content_manager: [
    'dashboard.view',
    'packages.view',
    'packages.manage',
    'offers.view',
    'offers.manage',
    'coupons.view',
    'coupons.manage',
    'reviews.view',
    'reviews.manage',
    'pages.view',
    'pages.manage',
    'media.view',
    'media.manage',
  ],
  finance_manager: [
    'dashboard.view',
    'orders.view',
    'customers.view',
    'payments.view',
    'payments.confirm_manual',
  ],
  full_access: [...ADMIN_PERMISSIONS],
} as const satisfies Record<string, readonly AdminPermission[]>;

/** Manage access always implies the corresponding view access. */
export function withPermissionDependencies(
  permissions: readonly AdminPermission[],
): AdminPermission[] {
  const result = new Set(permissions);
  const dependencies: Partial<
    Record<AdminPermission, readonly AdminPermission[]>
  > = {
    'orders.manage': ['orders.view'],
    'packages.manage': ['packages.view'],
    'offers.manage': ['offers.view', 'packages.view'],
    'coupons.manage': ['coupons.view'],
    'customers.manage': ['customers.view'],
    'payments.confirm_manual': ['orders.view', 'payments.view'],
    'reviews.manage': ['reviews.view'],
    'pages.manage': ['pages.view'],
    'media.manage': ['media.view'],
    'settings.manage': ['settings.view'],
  };
  for (const permission of permissions) {
    for (const dependency of dependencies[permission] ?? []) {
      result.add(dependency);
    }
  }
  return ADMIN_PERMISSIONS.filter((permission) => result.has(permission));
}
