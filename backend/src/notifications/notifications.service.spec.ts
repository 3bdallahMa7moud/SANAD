import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminNotificationStreamService } from './admin-notification-stream.service';

const query = (overrides: Record<string, unknown> = {}) =>
  ({ page: 1, limit: 20, skip: 0, ...overrides }) as never;

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: any;
  let adminStream: any;

  beforeEach(() => {
    prisma = {
      notifications: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        create: vi.fn(),
        createMany: vi.fn(),
      },
      users: { findMany: vi.fn().mockResolvedValue([]) },
    };
    adminStream = { streamFor: vi.fn(), publish: vi.fn() };
    service = new NotificationsService(
      prisma as PrismaService,
      adminStream as AdminNotificationStreamService,
    );
  });

  describe('findAll', () => {
    it('scopes the query to the requesting user', async () => {
      await service.findAll(7, query());

      expect(prisma.notifications.findMany.mock.calls[0][0].where).toEqual({
        user_id: 7,
      });
    });

    it('filters to unread rows when asked', async () => {
      await service.findAll(7, query({ unread_only: true }));

      expect(prisma.notifications.findMany.mock.calls[0][0].where).toEqual({
        user_id: 7,
        is_read: false,
      });
    });

    it('reports the unread count independently of the page filter', async () => {
      prisma.notifications.count
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(4);

      const result = await service.findAll(7, query({ unread_only: true }));

      expect(result.data.unread_count).toBe(4);
      expect(prisma.notifications.count).toHaveBeenLastCalledWith({
        where: { user_id: 7, is_read: false },
      });
    });

    it('can scope the administrative bell to admin notifications', async () => {
      await service.findAll(7, query({ admin_only: true }));

      expect(prisma.notifications.findMany.mock.calls[0][0].where).toEqual({
        user_id: 7,
        notification_type: { startsWith: 'admin_' },
      });
    });
  });

  describe('markAsRead', () => {
    it('throws NotFoundException for an unknown notification', async () => {
      prisma.notifications.findUnique.mockResolvedValue(null);

      await expect(service.markAsRead(1, 7)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("refuses to read another user's notification", async () => {
      prisma.notifications.findUnique.mockResolvedValue({
        id: 1,
        user_id: 99,
      });

      await expect(service.markAsRead(1, 7)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.notifications.update).not.toHaveBeenCalled();
    });

    it('stamps read_at when the caller owns the notification', async () => {
      prisma.notifications.findUnique.mockResolvedValue({ id: 1, user_id: 7 });
      prisma.notifications.update.mockResolvedValue({ id: 1, is_read: true });

      await service.markAsRead(1, 7);

      expect(prisma.notifications.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { is_read: true, read_at: expect.any(Date) },
      });
    });
  });

  describe('markAllAsRead', () => {
    it('only touches the unread rows of that user', async () => {
      prisma.notifications.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.markAllAsRead(7);

      expect(prisma.notifications.updateMany).toHaveBeenCalledWith({
        where: { user_id: 7, is_read: false },
        data: { is_read: true, read_at: expect.any(Date) },
      });
      expect(result).toEqual({ success: true, count: 3 });
    });
  });

  describe('createNotification', () => {
    it('maps the helper arguments onto the bilingual columns', async () => {
      prisma.notifications.create.mockResolvedValue({ id: 5 });

      await service.createNotification({
        userId: 7,
        orderId: 12,
        titleAr: 'عنوان',
        titleEn: 'Title',
        messageAr: 'رسالة',
        messageEn: 'Message',
        type: 'order_paid',
      });

      expect(prisma.notifications.create).toHaveBeenCalledWith({
        data: {
          user_id: 7,
          order_id: 12,
          title_ar: 'عنوان',
          title_en: 'Title',
          message_ar: 'رسالة',
          message_en: 'Message',
          notification_type: 'order_paid',
        },
      });
    });
  });

  describe('createAdminOrderNotification', () => {
    it('only creates alerts for super admins and admins with orders.view', async () => {
      prisma.users.findMany.mockResolvedValue([
        { id: 1, role: 'super_admin', admin_permissions: [] },
        { id: 2, role: 'admin', admin_permissions: ['orders.view'] },
        { id: 3, role: 'admin', admin_permissions: ['pages.view'] },
      ]);

      const recipients = await service.createAdminOrderNotification(prisma, {
        orderId: 12,
        titleAr: 'طلب جديد',
        titleEn: 'New order',
        messageAr: 'رسالة',
        messageEn: 'Message',
        type: 'admin_order_created',
      });

      expect(recipients).toEqual([1, 2]);
      expect(prisma.notifications.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ user_id: 1, order_id: 12 }),
          expect.objectContaining({ user_id: 2, order_id: 12 }),
        ]),
      });
    });
  });
});
