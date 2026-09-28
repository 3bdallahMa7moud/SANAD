import { z } from 'zod';

import { ApiError } from '../errors';
import { api } from '../request';

const notificationSchema = z.object({
  id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  order_id: z.number().int().positive().nullish(),
  title_ar: z.string(),
  title_en: z.string(),
  message_ar: z.string(),
  message_en: z.string(),
  notification_type: z.string(),
  is_read: z.boolean().nullish(),
  read_at: z.string().nullish(),
  created_at: z.string().nullish(),
});

const notificationListSchema = z.object({
  items: z.array(notificationSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
  unread_count: z.number().int().nonnegative(),
});

export type AdminNotification = z.infer<typeof notificationSchema>;

export interface AdminNotificationList {
  items: AdminNotification[];
  meta: z.infer<typeof notificationListSchema>['meta'];
  unreadCount: number;
}

function parseList(payload: unknown): AdminNotificationList {
  const result = notificationListSchema.safeParse(payload);
  if (!result.success) {
    throw new ApiError({
      kind: 'unknown',
      message: 'Unexpected response from GET /notifications',
    });
  }
  return {
    items: result.data.items,
    meta: result.data.meta,
    unreadCount: result.data.unread_count,
  };
}

export const notificationKeys = {
  admin: ['admin', 'notifications'] as const,
};

export const notificationsApi = {
  async listAdmin(options: { signal?: AbortSignal } = {}) {
    return parseList(
      await api.get<unknown>('/notifications', {
        params: { page: 1, limit: 12, admin_only: true },
        signal: options.signal,
      }),
    );
  },

  markRead: (id: number) => api.patch<unknown>(`/notifications/${id}/read`),

  markAllRead: () =>
    api.patch<unknown>('/notifications/read-all', undefined, {
      params: { admin_only: true },
    }),
};
