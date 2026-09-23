import { SetMetadata } from '@nestjs/common';
import type { AdminPermission } from '../permissions';

export const ADMIN_PERMISSIONS_KEY = 'admin_permissions';

/** Marks an admin endpoint with the capability required for regular admins. */
export const AdminPermissions = (...permissions: AdminPermission[]) =>
  SetMetadata(ADMIN_PERMISSIONS_KEY, permissions);
