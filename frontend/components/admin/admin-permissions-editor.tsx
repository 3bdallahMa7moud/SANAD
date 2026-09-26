'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useCopy } from '@/lib/i18n/use-copy';
import {
  ADMIN_PERMISSION_GROUPS,
  ADMIN_PERMISSION_PRESETS,
  withPermissionDependencies,
  type AdminPermission,
} from '@/lib/admin/permissions';

const presetLabels = {
  customer_service: ['Customer service', 'خدمة العملاء'],
  order_manager: ['Order manager', 'مسؤول الطلبات'],
  content_manager: ['Content manager', 'مسؤول المحتوى'],
  finance_manager: ['Finance manager', 'مسؤول المالية'],
  full_access: ['Full access', 'صلاحيات كاملة'],
} as const;

const dependentManagePermissions: Partial<
  Record<AdminPermission, readonly AdminPermission[]>
> = {
  'orders.view': ['orders.manage'],
  'packages.view': ['packages.manage', 'offers.manage'],
  'offers.view': ['offers.manage'],
  'coupons.view': ['coupons.manage'],
  'customers.view': ['customers.manage'],
  'payments.view': ['payments.confirm_manual'],
  'reviews.view': ['reviews.manage'],
  'pages.view': ['pages.manage'],
  'media.view': ['media.manage'],
  'settings.view': ['settings.manage'],
};

export function AdminPermissionsEditor({
  value,
  onChange,
  showPresets = true,
}: {
  value: AdminPermission[];
  onChange: (permissions: AdminPermission[]) => void;
  showPresets?: boolean;
}) {
  const _copy = useCopy();

  function toggle(permission: AdminPermission, checked: boolean) {
    if (checked) {
      onChange(withPermissionDependencies([...value, permission]));
      return;
    }
    const dependents = dependentManagePermissions[permission] ?? [];
    onChange(
      value.filter((item) => item !== permission && !dependents.includes(item)),
    );
  }

  return (
    <div className="grid gap-4">
      {showPresets ? (
        <div>
          <p className="text-sm font-semibold text-primary">
            {_copy('Quick permission templates', 'قوالب صلاحيات سريعة')}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(ADMIN_PERMISSION_PRESETS).map(
              ([key, permissions]) => (
                <Button
                  key={key}
                  onClick={() =>
                    onChange(withPermissionDependencies(permissions))
                  }
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {_copy(
                    presetLabels[key as keyof typeof presetLabels][0],
                    presetLabels[key as keyof typeof presetLabels][1],
                  )}
                </Button>
              ),
            )}
            <Button
              onClick={() => onChange([])}
              size="sm"
              type="button"
              variant="ghost"
            >
              {_copy('Clear all', 'إلغاء الكل')}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {ADMIN_PERMISSION_GROUPS.map((group) => (
          <fieldset
            className="rounded-md border border-border bg-surface-muted/35 p-3"
            key={group.key}
          >
            <legend className="px-1 text-sm font-semibold text-primary">
              {_copy(group.labelEn, group.labelAr)}
            </legend>
            <div className="mt-1 grid gap-2">
              {group.permissions.map((permission) => (
                <label
                  className="flex cursor-pointer items-center gap-2 text-sm text-secondary"
                  key={permission.value}
                >
                  <Checkbox
                    checked={value.includes(permission.value)}
                    onCheckedChange={(checked) =>
                      toggle(permission.value, checked === true)
                    }
                  />
                  <span>{_copy(permission.labelEn, permission.labelAr)}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        {_copy(
          'Manage access automatically includes view access. Administrator management always remains exclusive to Super Admins.',
          'صلاحية الإدارة تشمل المشاهدة تلقائيًا، وتظل إدارة حسابات الأدمنز متاحة للسوبر أدمن فقط.',
        )}
      </p>
    </div>
  );
}
