import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.ts';
import { DeviceModule } from '../device/device.module.ts';
import type { NotificationSender } from './interfaces/notification-sender.interface.ts';
import { NOTIFICATION_SENDERS } from './interfaces/notification-sender.interface.ts';
import { DeviceWarningListener } from './listeners/device-warning.listener.ts';
import { NotificationController } from './notification.controller.ts';
import { NotificationService } from './notification.service.ts';
import { NotificationConfigEntity } from './notification-config.entity.ts';
import { ZaloNotificationSender } from './senders/zalo-notification.sender.ts';
import { ZaloWebhookController } from './zalo-webhook.controller.ts';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationConfigEntity]), AuthModule, DeviceModule],
  controllers: [NotificationController, ZaloWebhookController],
  providers: [
    NotificationService,
    DeviceWarningListener,
    ZaloNotificationSender,
    {
      provide: NOTIFICATION_SENDERS,
      useFactory: (zaloSender: ZaloNotificationSender): NotificationSender[] => [zaloSender],
      inject: [ZaloNotificationSender],
    },
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
