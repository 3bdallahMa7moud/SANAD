import { Module, Global } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { AdminNotificationStreamService } from './admin-notification-stream.service';

@Global()
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, AdminNotificationStreamService],
  exports: [NotificationsService, AdminNotificationStreamService],
})
export class NotificationsModule {}
