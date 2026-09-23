import { describe, expect, it } from 'vitest';
import {
  ADMIN_PERMISSIONS,
  hasAdminPermission,
  normalizeAdminPermissions,
} from './admin-permissions';

describe('admin permissions', () => {
  it('preserves NULL as legacy full access while an explicit empty list is restricted', () => {
    expect(normalizeAdminPermissions(null)).toBeNull();
    expect(hasAdminPermission(null, 'orders')).toBe(true);
    expect(hasAdminPermission([], 'orders')).toBe(false);
  });

  it('keeps only known, unique capabilities from stored JSON', () => {
    expect(normalizeAdminPermissions(['orders', 'orders', 'invalid'])).toEqual(
      ['orders'],
    );
    expect(normalizeAdminPermissions({ orders: true })).toEqual([]);
  });

  it('recognizes every explicitly granted capability', () => {
    for (const permission of ADMIN_PERMISSIONS) {
      expect(hasAdminPermission([permission], permission)).toBe(true);
    }
  });
});
