'use client';

import { useAuth } from '@/hooks/use-auth';
import {
  hasAdminPermission,
  type AdminPermission,
} from '@/lib/admin/permissions';

export function useAdminPermission(permission: AdminPermission) {
  const { user } = useAuth();
  return hasAdminPermission(user, permission);
}
