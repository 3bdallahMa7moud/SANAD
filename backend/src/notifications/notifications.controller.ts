import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  ParseIntPipe,
  Header,
  Sse,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { NotificationQueryDto } from './dto';
import { AdminPermissions, CurrentUser, Roles } from '../common/decorators';
import { UserRole } from '../common/enums';
import { AdminPermission } from '../common/permissions/admin-permissions';

@ApiTags('Notifications')
@ApiBearerAuth('bearer')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Sse('admin/stream')
  @Roles(UserRole.ADMIN)
  @AdminPermissions(AdminPermission.ORDERS_VIEW)
  @Header('Cache-Control', 'no-cache, no-transform')
  @Header('X-Accel-Buffering', 'no')
  @ApiOperation({ summary: 'Stream real-time administrative notifications' })
  streamAdmin(@CurrentUser('id') userId: number) {
    return this.notificationsService.streamAdminNotifications(userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get current user notifications with unread count' })
  async findAll(
    @CurrentUser('id') userId: number,
    @Query() query: NotificationQueryDto,
  ) {
    return this.notificationsService.findAll(userId, query);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark specific notification as read' })
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all user notifications as read' })
  async markAllAsRead(
    @CurrentUser('id') userId: number,
    @Query() query: NotificationQueryDto,
  ) {
    return this.notificationsService.markAllAsRead(
      userId,
      query.admin_only ?? false,
    );
  }
}
