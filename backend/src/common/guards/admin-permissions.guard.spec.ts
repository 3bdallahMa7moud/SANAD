import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminPermissionsGuard } from './admin-permissions.guard';

const contextFor = (user: unknown): ExecutionContext =>
  ({
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as unknown as ExecutionContext;

describe('AdminPermissionsGuard', () => {
  let guard: AdminPermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = { getAllAndOverride: vi.fn() } as unknown as Reflector;
    guard = new AdminPermissionsGuard(reflector);
  });

  const requirePermission = (permissions: string[] | undefined) =>
    vi
      .mocked(reflector.getAllAndOverride)
      .mockReturnValue(permissions as never);

  it('does nothing for routes without administrative permission metadata', () => {
    requirePermission(undefined);

    expect(guard.canActivate(contextFor({ role: 'customer' }))).toBe(true);
  });

  it('leaves shared customer endpoints to their ownership checks', () => {
    requirePermission(['orders.view']);

    expect(guard.canActivate(contextFor({ role: 'customer' }))).toBe(true);
  });

  it('allows a limited administrator only in an explicitly granted area', () => {
    requirePermission(['orders.view']);

    expect(
      guard.canActivate(
        contextFor({ role: 'admin', admin_permissions: ['orders.view'] }),
      ),
    ).toBe(true);

    requirePermission(['payments.view']);
    expect(
      guard.canActivate(
        contextFor({ role: 'admin', admin_permissions: ['orders.view'] }),
      ),
    ).toBe(false);
  });

  it('denies an explicitly empty or malformed permissions value', () => {
    requirePermission(['orders.view']);

    expect(
      guard.canActivate(contextFor({ role: 'admin', admin_permissions: [] })),
    ).toBe(false);
    expect(
      guard.canActivate(
        contextFor({ role: 'admin', admin_permissions: { orders: true } }),
      ),
    ).toBe(false);
  });

  it('keeps legacy null-permission administrators fully authorized', () => {
    requirePermission(['orders.view']);

    expect(
      guard.canActivate(contextFor({ role: 'admin', admin_permissions: null })),
    ).toBe(true);
  });

  it('always allows a super admin', () => {
    requirePermission(['orders.view']);

    expect(
      guard.canActivate(
        contextFor({ role: 'super_admin', admin_permissions: [] }),
      ),
    ).toBe(true);
  });
});
