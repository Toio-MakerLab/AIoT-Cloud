import { Injectable, Logger } from '@nestjs/common';

import { NotificationChannelType } from '../../../constants/notification-channel-type.ts';
import { ApiConfigService } from '../../../shared/services/api-config.service.ts';
import type { NotificationChannelConfig, ZaloChannelConfig } from '../interfaces/notification-channel-config.interface.ts';
import type { NotificationSender } from '../interfaces/notification-sender.interface.ts';
import type { NotificationConfigEntity } from '../notification-config.entity.ts';

const ZALO_TEXT_MAX_LENGTH = 2000;

function isZaloChannelConfig(config: NotificationChannelConfig | null): config is ZaloChannelConfig {
  return Boolean(config && typeof (config as ZaloChannelConfig).userExtendId === 'string');
}

interface ZaloSendMessageResponse {
  ok: boolean;
  result?: { message_id: string; date: number };
  message?: string;
}

/** Sends via the Zalo Bot API (https://bot.zapps.me/docs) — a token-in-URL, Telegram-style bot, not the OA Send API. */
@Injectable()
export class ZaloNotificationSender implements NotificationSender {
  readonly channel = NotificationChannelType.ZALO;

  private readonly logger = new Logger(ZaloNotificationSender.name);

  constructor(private readonly apiConfigService: ApiConfigService) {}

  async send(config: NotificationConfigEntity, message: string): Promise<void> {
    if (!this.apiConfigService.zaloEnabled) {
      this.logger.warn('Zalo notifications are disabled (ZALO_ENABLED=false); skipping send.');

      return;
    }

    if (!isZaloChannelConfig(config.config)) {
      this.logger.warn(`Notification config ${config.id} has no linked Zalo chat id; skipping send.`);

      return;
    }

    const { sendMessageUrl } = this.apiConfigService.zaloConfig;

    if (!sendMessageUrl) {
      this.logger.error('ZALO_BOT_TOKEN is not configured; cannot send Zalo notification.');

      return;
    }

    const response = await fetch(sendMessageUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.config.userExtendId,
        text: message.slice(0, ZALO_TEXT_MAX_LENGTH),
      }),
    });

    const body = (await response.json()) as ZaloSendMessageResponse;

    if (!response.ok || !body.ok) {
      this.logger.error(`Zalo sendMessage responded ${response.status}: ${body.message ?? JSON.stringify(body)}`);
    }
  }
}
