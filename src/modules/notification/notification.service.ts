import { Inject, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { ResponseCore } from '../../common/dto/response-core.dto.ts';
import { NotificationChannelType } from '../../constants/notification-channel-type.ts';
import { ApiConfigService } from '../../shared/services/api-config.service.ts';
import type { NotificationConfigDto } from './dtos/notification-config.dto.ts';
import type { UpsertNotificationConfigDto } from './dtos/upsert-notification-config.dto.ts';
import type { WebPushChannelConfig } from './interfaces/notification-channel-config.interface.ts';
import type { NotificationSender } from './interfaces/notification-sender.interface.ts';
import { NOTIFICATION_SENDERS } from './interfaces/notification-sender.interface.ts';
import type { ZaloWebhookPayload } from './interfaces/zalo-webhook-payload.interface.ts';
import { NotificationConfigEntity } from './notification-config.entity.ts';

interface ZaloLinkCodePayload {
  userId: string;
  purpose: 'zalo-link';
}

const ZALO_LINK_CODE_TTL = '15m';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  private readonly senderByChannel: Map<NotificationChannelType, NotificationSender>;

  constructor(
    @InjectRepository(NotificationConfigEntity)
    private readonly notificationConfigRepository: Repository<NotificationConfigEntity>,
    private readonly jwtService: JwtService,
    private readonly apiConfigService: ApiConfigService,
    @Inject(NOTIFICATION_SENDERS) senders: NotificationSender[],
  ) {
    this.senderByChannel = new Map(senders.map((sender) => [sender.channel, sender]));
  }

  async getUserConfigs(userId: Uuid): Promise<NotificationConfigDto[]> {
    const configs = await this.notificationConfigRepository.findBy({ userId });

    return configs.toDtos();
  }

  async upsertConfig(userId: Uuid, channel: NotificationChannelType, dto: UpsertNotificationConfigDto): Promise<ResponseCore<NotificationConfigDto>> {
    let config = await this.notificationConfigRepository.findOneBy({ userId, channel });

    config ??= this.notificationConfigRepository.create({ userId, channel, config: null, isEnabled: true });

    if (dto.messageTemplate !== undefined) {
      config.messageTemplate = dto.messageTemplate;
    }

    if (dto.isEnabled !== undefined) {
      config.isEnabled = dto.isEnabled;
    }

    await this.notificationConfigRepository.save(config);

    return ResponseCore.ok(config.toDto());
  }

  /**
   * The Zalo Bot API has no OAuth/deep-link start-payload support, so linking works like a
   * pairing code: the user copies this short-lived signed code and sends it as a plain message
   * to the bot; `handleZaloWebhookUpdate` reads it back off the webhook event.
   */
  async generateZaloLinkCode(userId: Uuid): Promise<ResponseCore<{ code: string; shareUrl: string | null }>> {
    const code = await this.jwtService.signAsync({ userId, purpose: 'zalo-link' } satisfies ZaloLinkCodePayload, {
      expiresIn: ZALO_LINK_CODE_TTL,
    });

    return ResponseCore.ok({ code, shareUrl: this.apiConfigService.zaloConfig.shareUrl ?? null });
  }

  /**
   * Handles the Zalo Bot webhook. On a text message matching a live link code, saves the
   * sender's chat id (`userExtendId`) against that user's Zalo notification config — this is
   * the only point at which we learn which Zalo conversation belongs to which of our users.
   */
  async handleZaloWebhookUpdate(payload: ZaloWebhookPayload): Promise<void> {
    const message = payload.result?.message;

    if (payload.result?.event_name !== 'message.text.received' || !message?.text) {
      return;
    }

    let linkPayload: ZaloLinkCodePayload;

    try {
      linkPayload = await this.jwtService.verifyAsync<ZaloLinkCodePayload>(message.text.trim());
    } catch {
      this.logger.debug(`Ignoring Zalo message that isn't a valid/live link code (chat ${message.chat.id})`);

      return;
    }

    if (linkPayload.purpose !== 'zalo-link') {
      return;
    }

    let notificationConfig = await this.notificationConfigRepository.findOneBy({
      userId: linkPayload.userId,
      channel: NotificationChannelType.ZALO,
    });

    notificationConfig ??= this.notificationConfigRepository.create({
      userId: linkPayload.userId,
      channel: NotificationChannelType.ZALO,
      isEnabled: true,
    });

    notificationConfig.config = { userExtendId: message.chat.id };
    await this.notificationConfigRepository.save(notificationConfig);

    await this.sendWarning(linkPayload.userId, "You're now linked — this bot will send device warnings here.");
  }

  isValidWebhookSecret(secretHeader: string | undefined): boolean {
    const { webhookSecret } = this.apiConfigService.zaloConfig;

    return Boolean(webhookSecret) && secretHeader === webhookSecret;
  }

  /** Registers a browser's FCM token against the user's web push config, creating it (enabled) on first use. */
  async registerWebPushToken(userId: Uuid, token: string): Promise<ResponseCore<NotificationConfigDto>> {
    let config = await this.notificationConfigRepository.findOneBy({ userId, channel: NotificationChannelType.WEB_PUSH });

    config ??= this.notificationConfigRepository.create({
      userId,
      channel: NotificationChannelType.WEB_PUSH,
      config: null,
      isEnabled: true,
    });

    const fcmTokens = (config.config as WebPushChannelConfig | null)?.fcmTokens ?? [];

    config.config = { fcmTokens: fcmTokens.includes(token) ? fcmTokens : [...fcmTokens, token] };

    await this.notificationConfigRepository.save(config);

    return ResponseCore.ok(config.toDto());
  }

  /** Removes a browser's FCM token; clears the config (unlinks the channel) once no tokens remain. */
  async unregisterWebPushToken(userId: Uuid, token: string): Promise<ResponseCore<NotificationConfigDto | null>> {
    const config = await this.notificationConfigRepository.findOneBy({ userId, channel: NotificationChannelType.WEB_PUSH });

    if (!config) {
      return ResponseCore.ok(null);
    }

    const fcmTokens = (config.config as WebPushChannelConfig | null)?.fcmTokens ?? [];
    const remainingTokens = fcmTokens.filter((fcmToken) => fcmToken !== token);

    config.config = remainingTokens.length > 0 ? { fcmTokens: remainingTokens } : null;

    await this.notificationConfigRepository.save(config);

    return ResponseCore.ok(config.toDto());
  }

  /**
   * Fans a rendered warning message out to the user's enabled, linked channels. When `channels` is
   * provided and non-empty, only those channels receive the message (per-gate channel selection);
   * otherwise (undefined/empty) it falls back to every enabled, linked channel — preserving behavior
   * for devices/gates that haven't picked channels yet.
   */
  async sendWarning(userId: string, message: string, channels?: NotificationChannelType[]): Promise<void> {
    const configs = await this.notificationConfigRepository.findBy({ userId, isEnabled: true });
    const targetConfigs = channels && channels.length > 0 ? configs.filter((config) => channels.includes(config.channel)) : configs;

    await Promise.all(
      targetConfigs
        .filter((config) => config.config !== null)
        .map(async (config) => {
          const sender = this.senderByChannel.get(config.channel);

          if (!sender) {
            this.logger.warn(`No sender registered for channel ${config.channel}`);

            return;
          }

          try {
            await sender.send(config, config.messageTemplate ? this.renderTemplate(config.messageTemplate, message) : message);
          } catch (error) {
            this.logger.error(
              `Failed to send ${config.channel} notification to user ${userId}: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        }),
    );
  }

  private renderTemplate(template: string, fallbackMessage: string): string {
    return template.includes('{{message}}') ? template.replaceAll('{{message}}', fallbackMessage) : template;
  }
}
