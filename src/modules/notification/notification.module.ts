import { Logger, Module, type OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.ts';
import { DeviceModule } from '../device/device.module.ts';
import type { NotificationSender } from './interfaces/notification-sender.interface.ts';
import { NOTIFICATION_SENDERS } from './interfaces/notification-sender.interface.ts';
import { DeviceWarningListener } from './listeners/device-warning.listener.ts';
import { NotificationController } from './notification.controller.ts';
import { NotificationService } from './notification.service.ts';
import { NotificationConfigEntity } from './notification-config.entity.ts';
import { NotificationMessageEntity } from './notification-message.entity.ts';
import { FirebaseNotificationSender } from './senders/firebase-notification.sender.ts';
import { ZaloNotificationSender } from './senders/zalo-notification.sender.ts';
import { ZaloWebhookRegistrationService } from './services/zalo-webhook-registration.service.ts';
import { ZaloWebhookController } from './zalo-webhook.controller.ts';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationConfigEntity, NotificationMessageEntity]), AuthModule, DeviceModule],
  controllers: [NotificationController, ZaloWebhookController],
  providers: [
    NotificationService,
    DeviceWarningListener,
    ZaloNotificationSender,
    FirebaseNotificationSender,
    ZaloWebhookRegistrationService,
    {
      provide: NOTIFICATION_SENDERS,
      useFactory: (zaloSender: ZaloNotificationSender, firebaseSender: FirebaseNotificationSender): NotificationSender[] => [
        zaloSender,
        firebaseSender,
      ],
      inject: [ZaloNotificationSender, FirebaseNotificationSender],
    },
  ],
  exports: [NotificationService],
})
export class NotificationModule implements OnModuleInit {
  private readonly logger = new Logger(NotificationModule.name);

  constructor(private readonly zaloWebhookRegistrationService: ZaloWebhookRegistrationService) {}

  onModuleInit(): void {
    this.zaloWebhookRegistrationService
      .registerWebhook()
      .catch((error: unknown) => this.logger.error(`Zalo webhook registration failed: ${error instanceof Error ? error.message : String(error)}`));
  }
}
