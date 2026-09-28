import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  patch: vi.fn(),
}));

vi.mock('../request', () => ({
  api: mocks,
}));

import { notificationsApi } from './notifications';

describe('notificationsApi', () => {
  beforeEach(() => {
    mocks.get.mockReset();
    mocks.patch.mockReset();
  });

  it('loads only the administrative notification feed', async () => {
    mocks.get.mockResolvedValue({
      items: [
        {
          id: 5,
          user_id: 2,
          order_id: 11,
          title_ar: 'طلب جديد',
          title_en: 'New order',
          message_ar: 'رسالة',
          message_en: 'Message',
          notification_type: 'admin_order_created',
          is_read: false,
          read_at: null,
          created_at: '2026-09-27T12:00:00.000Z',
        },
      ],
      meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
      unread_count: 1,
    });

    await expect(notificationsApi.listAdmin()).resolves.toMatchObject({
      unreadCount: 1,
      items: [{ id: 5, order_id: 11 }],
    });
    expect(mocks.get).toHaveBeenCalledWith('/notifications', {
      params: { page: 1, limit: 12, admin_only: true },
      signal: undefined,
    });
  });

  it('marks only administrative alerts as read in bulk', async () => {
    mocks.patch.mockResolvedValue({ success: true });

    await notificationsApi.markAllRead();

    expect(mocks.patch).toHaveBeenCalledWith(
      '/notifications/read-all',
      undefined,
      { params: { admin_only: true } },
    );
  });
});
