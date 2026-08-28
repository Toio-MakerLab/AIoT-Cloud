import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import admin from 'firebase-admin';
import type { Repository } from 'typeorm';

import { NotificationChannelType } from '../../../constants/notification-channel-type.ts';
import { ApiConfigService } from '../../../shared/services/api-config.service.ts';
import type { NotificationChannelConfig, WebPushChannelConfig } from '../interfaces/notification-channel-config.interface.ts';
import type { NotificationSender } from '../interfaces/notification-sender.interface.ts';
import { NotificationConfigEntity } from '../notification-config.entity.ts';

const STALE_TOKEN_ERROR_CODES = new Set(['messaging/invalid-registration-token', 'messaging/registration-token-not-registered']);

function isWebPushChannelConfig(config: NotificationChannelConfig | null): config is WebPushChannelConfig {
  return Boolean(config && Array.isArray((config as WebPushChannelConfig).fcmTokens) && (config as WebPushChannelConfig).fcmTokens.length > 0);
}

/** Sends browser push notifications via Firebase Cloud Messaging using the Firebase Admin SDK. */
@Injectable()
export class FirebaseNotificationSender implements NotificationSender {
  readonly channel = NotificationChannelType.WEB_PUSH;

  private readonly logger = new Logger(FirebaseNotificationSender.name);

  constructor(
    private readonly apiConfigService: ApiConfigService,
    @InjectRepository(NotificationConfigEntity)
    private readonly notificationConfigRepository: Repository<NotificationConfigEntity>,
  ) {
    this.initializeApp();
  }

  private initializeApp(): void {
    if (!this.apiConfigService.firebaseEnabled || admin.apps.length > 0) {
      return;
    }

    const { projectId, clientEmail, privateKey } = this.apiConfigService.firebaseConfig;

    if (!projectId || !clientEmail || !privateKey) {
      return;
    }

    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  }

  async send(config: NotificationConfigEntity, message: string): Promise<void> {
    if (!this.apiConfigService.firebaseEnabled) {
      this.logger.warn('Firebase notifications are disabled (FIREBASE_ENABLED=false); skipping send.');

      return;
    }

    if (admin.apps.length === 0) {
      this.logger.error('Firebase is not configured (missing project id/client email/private key); cannot send web push notification.');

      return;
    }

    if (!isWebPushChannelConfig(config.config)) {
      this.logger.warn(`Notification config ${config.id} has no registered FCM tokens; skipping send.`);

      return;
    }

    const { fcmTokens } = config.config;

    const response = await admin.messaging().sendEachForMulticast({
      tokens: fcmTokens,
      notification: { title: 'Device warning', body: message },
    });

    const staleTokens = new Set<string>();

    for (const [index, result] of response.responses.entries()) {
      const errorCode = result.error?.code;
      const token = fcmTokens[index];

      if (errorCode && token && STALE_TOKEN_ERROR_CODES.has(errorCode)) {
        staleTokens.add(token);
      }
    }

    if (staleTokens.size === 0) {
      return;
    }

    config.config = { fcmTokens: fcmTokens.filter((token) => !staleTokens.has(token)) };
    await this.notificationConfigRepository.save(config);
  }
}
