import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ADMIN_PERMISSIONS_KEY } from '../decorators/admin-permissions.decorator';
import { hasAdminPermission, type AdminPermission } from '../permissions';
import { UserRole } from '../enums';

@Injectable()
export class AdminPermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<
      AdminPermission[]
    >(ADMIN_PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions?.length) return true;

    const { user } = context.switchToHttp().getRequest();
    if (user?.role === UserRole.SUPER_ADMIN) return true;
    // RolesGuard remains responsible for deciding who may enter admin-only
    // controllers. Allowing non-admin identities through here lets shared
    // customer/admin endpoints enforce a capability only for the admin path.
    if (user?.role !== UserRole.ADMIN) return true;

    // A NULL value belongs to an administrator created before granular
    // permissions existed. Preserve the access they already had; an explicit
    // [] is instead intentionally no access.
    return requiredPermissions.every((permission) =>
      hasAdminPermission(user.admin_permissions, permission),
    );
  }
}
