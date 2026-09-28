import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  type MessageEvent,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationQueryDto } from './dto';
import { createPaginatedResponse } from '../common/utils';
import {
  AdminPermission,
  hasAdminPermission,
} from '../common/permissions/admin-permissions';
import { AdminNotificationStreamService } from './admin-notification-stream.service';

interface NotificationDb {
  users: { findMany(args: unknown): Promise<any[]> };
  notifications: { createMany(args: unknown): Promise<unknown> };
}

export interface CreateAdminOrderNotificationInput {
  orderId: number;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  type: 'admin_order_created' | 'admin_order_paid';
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminStream: AdminNotificationStreamService,
  ) {}

  async findAll(userId: number, query: NotificationQueryDto) {
    const where: Record<string, any> = { user_id: userId };
    if (query.unread_only) {
      where.is_read = false;
    }
    if (query.admin_only) {
      where.notification_type = { startsWith: 'admin_' };
    }

    const unreadWhere: Record<string, any> = {
      user_id: userId,
      is_read: false,
    };
    if (query.admin_only) {
      unreadWhere.notification_type = { startsWith: 'admin_' };
    }

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notifications.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.notifications.count({ where }),
      this.prisma.notifications.count({ where: unreadWhere }),
    ]);

    const paginated = createPaginatedResponse(
      items,
      total,
      query.page,
      query.limit,
    );
    return {
      ...paginated,
      data: {
        ...paginated.data,
        unread_count: unreadCount,
      },
    };
  }

  async markAsRead(id: number, userId: number) {
    const notification = await this.prisma.notifications.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.notifications.update({
      where: { id },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });
  }

  async markAllAsRead(userId: number, adminOnly = false) {
    const where: Record<string, any> = { user_id: userId, is_read: false };
    if (adminOnly) {
      where.notification_type = { startsWith: 'admin_' };
    }
    const updated = await this.prisma.notifications.updateMany({
      where,
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });

    return { success: true, count: updated.count };
  }

  // Programmatic creation helper
  async createNotification(data: {
    userId: number;
    orderId?: number;
    titleAr: string;
    titleEn: string;
    messageAr: string;
    messageEn: string;
    type: string;
  }) {
    return this.prisma.notifications.create({
      data: {
        user_id: data.userId,
        order_id: data.orderId,
        title_ar: data.titleAr,
        title_en: data.titleEn,
        message_ar: data.messageAr,
        message_en: data.messageEn,
        notification_type: data.type,
      },
    });
  }

  streamAdminNotifications(userId: number): Observable<MessageEvent> {
    return this.adminStream.streamFor(userId);
  }

  async createAdminOrderNotification(
    db: NotificationDb,
    input: CreateAdminOrderNotificationInput,
  ): Promise<number[]> {
    const candidates = await db.users.findMany({
      where: {
        role: { in: ['admin', 'super_admin'] },
        OR: [{ account_locked: false }, { account_locked: null }],
      },
      select: { id: true, role: true, admin_permissions: true },
    });
    const recipientIds = candidates
      .filter(
        (candidate) =>
          candidate.role === 'super_admin' ||
          hasAdminPermission(
            candidate.admin_permissions,
            AdminPermission.ORDERS_VIEW,
          ),
      )
      .map(({ id }) => id);

    if (recipientIds.length > 0) {
      await db.notifications.createMany({
        data: recipientIds.map((userId) => ({
          user_id: userId,
          order_id: input.orderId,
          title_ar: input.titleAr,
          title_en: input.titleEn,
          message_ar: input.messageAr,
          message_en: input.messageEn,
          notification_type: input.type,
        })),
      });
    }

    return recipientIds;
  }

  publishAdminOrderEvent(
    recipientIds: number[],
    event: Parameters<AdminNotificationStreamService['publish']>[1],
  ) {
    this.adminStream.publish(recipientIds, event);
  }
}
