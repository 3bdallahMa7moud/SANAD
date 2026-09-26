import { describe, expect, it } from 'vitest';
import type { User } from '@/types/domain';
import {
  firstAllowedAdminRoute,
  hasAdminPermission,
  normalizeAdminPermissions,
  withPermissionDependencies,
} from './permissions';

const admin = (adminPermissions: User['adminPermissions']): User => ({
  id: 10,
  name: 'Limited Admin',
  email: 'admin@example.com',
  phone: null,
  role: 'admin',
  adminPermissions,
  emailVerified: true,
  lastLoginAt: null,
  createdAt: null,
  updatedAt: null,
});

describe('frontend admin permissions', () => {
  it('preserves legacy null access and denies missing or empty access', () => {
    expect(hasAdminPermission(admin(null), 'orders.view')).toBe(true);
    expect(hasAdminPermission(admin([]), 'orders.view')).toBe(false);
    expect(hasAdminPermission(admin(undefined), 'orders.view')).toBe(false);
  });

  it('normalizes legacy area values', () => {
    expect(normalizeAdminPermissions(['orders'])).toEqual([
      'orders.view',
      'orders.manage',
    ]);
  });

  it('adds all view access required to manage offers', () => {
    expect(withPermissionDependencies(['offers.manage'])).toEqual([
      'packages.view',
      'offers.view',
      'offers.manage',
    ]);
  });

  it('makes manual payment confirmation usable from an order', () => {
    expect(withPermissionDependencies(['payments.confirm_manual'])).toEqual([
      'orders.view',
      'payments.view',
      'payments.confirm_manual',
    ]);
  });

  it('lands a limited admin on their first permitted page', () => {
    expect(firstAllowedAdminRoute(admin(['payments.view']))).toBe(
      '/admin/payments',
    );
  });
});
