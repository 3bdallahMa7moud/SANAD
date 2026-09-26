import { describe, expect, it } from 'vitest';
import {
  ADMIN_PERMISSIONS,
  hasAdminPermission,
  normalizeAdminPermissions,
} from './admin-permissions';

describe('admin permissions', () => {
  it('preserves NULL as legacy full access while an explicit empty list is restricted', () => {
    expect(normalizeAdminPermissions(null)).toBeNull();
    expect(hasAdminPermission(null, 'orders.view')).toBe(true);
    expect(hasAdminPermission([], 'orders.view')).toBe(false);
  });

  it('keeps only known, unique capabilities from stored JSON', () => {
    expect(normalizeAdminPermissions(['orders', 'orders', 'invalid'])).toEqual([
      'orders.view',
      'orders.manage',
    ]);
    expect(normalizeAdminPermissions({ orders: true })).toEqual([]);
  });

  it('recognizes every explicitly granted capability', () => {
    for (const permission of ADMIN_PERMISSIONS) {
      expect(hasAdminPermission([permission], permission)).toBe(true);
    }
  });

  it('adds view capabilities required by management permissions', () => {
    expect(normalizeAdminPermissions(['offers.manage'])).toEqual([
      'packages.view',
      'offers.view',
      'offers.manage',
    ]);
    expect(normalizeAdminPermissions(['payments.confirm_manual'])).toEqual([
      'orders.view',
      'payments.view',
      'payments.confirm_manual',
    ]);
  });
});
