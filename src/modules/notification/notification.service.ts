import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import type { PageDto } from '../../common/dto/page.dto.ts';
import { ResponseCore } from '../../common/dto/response-core.dto.ts';
import { ErrorCode } from '../../constants/error-code.ts';
import { NotificationChannelType } from '../../constants/notification-channel-type.ts';
import { NotificationMessageStatus } from '../../constants/notification-message-status.ts';
import { ApiConfigService } from '../../shared/services/api-config.service.ts';
import type { NotificationConfigDto } from './dtos/notification-config.dto.ts';
import type { NotificationMessageDto } from './dtos/notification-message.dto.ts';
import type { NotificationMessagesPageOptionsDto } from './dtos/notification-messages-page-options.dto.ts';
import type { UpsertNotificationConfigDto } from './dtos/upsert-notification-config.dto.ts';
import type { WebPushChannelConfig } from './interfaces/notification-channel-config.interface.ts';
import type { NotificationSender } from './interfaces/notification-sender.interface.ts';
import { NOTIFICATION_SENDERS } from './interfaces/notification-sender.interface.ts';
import type { ZaloWebhookPayload } from './interfaces/zalo-webhook-payload.interface.ts';
import { NotificationConfigEntity } from './notification-config.entity.ts';
import { NotificationMessageEntity } from './notification-message.entity.ts';

interface ZaloLinkCodePayload {
  userId: string;
  purpose: 'zalo-link';
}

const ZALO_LINK_CODE_TTL = '15m';

/**
 * Emitted once per `sendWarning` call (not once per channel) so the frontend can pop a toast the
 * instant an alert fires — this is effectively a zero-config "in-app" channel, delivered
 * regardless of which (if any) ZALO/WEB_PUSH channels the user has linked. Consumed by
 * `AppGateway`, which forwards it over the socket to that user's room.
 */
export interface NotificationCreatedEvent {
  userId: string;
  message: string;
  deviceId: string | null;
  occurredAt: Date;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  private readonly senderByChannel: Map<NotificationChannelType, NotificationSender>;

  constructor(
    @InjectRepository(NotificationConfigEntity)
    private readonly notificationConfigRepository: Repository<NotificationConfigEntity>,
    @InjectRepository(NotificationMessageEntity)
    private readonly notificationMessageRepository: Repository<NotificationMessageEntity>,
    private readonly jwtService: JwtService,
    private readonly apiConfigService: ApiConfigService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(NOTIFICATION_SENDERS) senders: NotificationSender[],
  ) {
    this.senderByChannel = new Map(senders.map((sender) => [sender.channel, sender]));
  }

  async getUserConfigs(userId: string): Promise<NotificationConfigDto[]> {
    const configs = await this.notificationConfigRepository.findBy({ userId });

    return configs.toDtos();
  }

  async upsertConfig(
    userId: string,
    channel: NotificationChannelType,
    dto: UpsertNotificationConfigDto,
  ): Promise<ResponseCore<NotificationConfigDto>> {
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
  async generateZaloLinkCode(userId: string): Promise<ResponseCore<{ code: string; shareUrl: string | null }>> {
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
    const message = payload.message;

    if (payload.event_name !== 'message.text.received' || !message?.text) {
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

    notificationConfig.config = { userExtendId: message.from.id };
    await this.notificationConfigRepository.save(notificationConfig);

    await this.sendWarning(linkPayload.userId, "You're now linked — this bot will send device warnings here.");
  }

  isValidWebhookSecret(secretHeader: string | undefined): boolean {
    const { webhookSecret } = this.apiConfigService.zaloConfig;

    return Boolean(webhookSecret) && secretHeader === webhookSecret;
  }

  /** Registers a browser's FCM token against the user's web push config, creating it (enabled) on first use. */
  async registerWebPushToken(userId: string, token: string): Promise<ResponseCore<NotificationConfigDto>> {
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
  async unregisterWebPushToken(userId: string, token: string): Promise<ResponseCore<NotificationConfigDto | null>> {
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
   * for devices/gates that haven't picked channels yet. Every send attempt (success or failure) is
   * persisted as a `NotificationMessageEntity` row, which is what backs the notification inbox.
   */
  async sendWarning(userId: string, message: string, channels?: NotificationChannelType[], deviceId?: string): Promise<void> {
    // Fired unconditionally (before the ZALO/WEB_PUSH fan-out below, and even if the user has no
    // channel linked) so the frontend can toast it live — see NotificationCreatedEvent.
    this.eventEmitter.emit('notification.created', {
      userId,
      message,
      deviceId: deviceId ?? null,
      occurredAt: new Date(),
    } satisfies NotificationCreatedEvent);

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

          const renderedMessage = config.messageTemplate ? this.renderTemplate(config.messageTemplate, message) : message;

          try {
            await sender.send(config, renderedMessage);
            await this.recordMessage(userId, config.channel, renderedMessage, deviceId, NotificationMessageStatus.SENT, null);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            this.logger.error(`Failed to send ${config.channel} notification to user ${userId}: ${errorMessage}`);
            await this.recordMessage(userId, config.channel, renderedMessage, deviceId, NotificationMessageStatus.FAILED, errorMessage);
          }
        }),
    );
  }

  /** Persists one send attempt. Swallows its own failures — a history-write hiccup must never break the actual send/fan-out flow. */
  private async recordMessage(
    userId: string,
    channel: NotificationChannelType,
    message: string,
    deviceId: string | undefined,
    status: NotificationMessageStatus,
    error: string | null,
  ): Promise<void> {
    try {
      await this.notificationMessageRepository.save(
        this.notificationMessageRepository.create({ userId, channel, message, deviceId: deviceId ?? null, status, error }),
      );
    } catch (recordError) {
      this.logger.error(
        `Failed to record notification history for user ${userId}: ${recordError instanceof Error ? recordError.message : String(recordError)}`,
      );
    }
  }

  /** Paginated notification inbox for a user, newest first, optionally filtered by channel/read-state. */
  async getMessages(userId: string, pageOptionsDto: NotificationMessagesPageOptionsDto): Promise<PageDto<NotificationMessageDto>> {
    const queryBuilder = this.notificationMessageRepository.createQueryBuilder('message').where('message.userId = :userId', { userId });

    if (pageOptionsDto.channel) {
      queryBuilder.andWhere('message.channel = :channel', { channel: pageOptionsDto.channel });
    }

    if (pageOptionsDto.isRead !== undefined) {
      queryBuilder.andWhere('message.isRead = :isRead', { isRead: pageOptionsDto.isRead });
    }

    queryBuilder.orderBy('message.createdAt', pageOptionsDto.order);

    const [items, pageMetaDto] = await queryBuilder.paginate(pageOptionsDto);

    return items.toPageDto(pageMetaDto);
  }

  async getUnreadCount(userId: string): Promise<ResponseCore<{ count: number }>> {
    const count = await this.notificationMessageRepository.countBy({ userId, isRead: false });

    return ResponseCore.ok({ count });
  }

  async markMessageAsRead(userId: string, id: string): Promise<ResponseCore<NotificationMessageDto>> {
    const message = await this.notificationMessageRepository.findOneBy({ id, userId });

    if (!message) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.notificationMessageNotFound');
    }

    if (!message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      await this.notificationMessageRepository.save(message);
    }

    return ResponseCore.ok(message.toDto());
  }

  async markAllMessagesAsRead(userId: string): Promise<ResponseCore<null>> {
    await this.notificationMessageRepository.update({ userId, isRead: false }, { isRead: true, readAt: new Date() });

    return ResponseCore.ok(null);
  }

  async deleteMessage(userId: string, id: string): Promise<ResponseCore<null>> {
    const message = await this.notificationMessageRepository.findOneBy({ id, userId });

    if (!message) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.notificationMessageNotFound');
    }

    await this.notificationMessageRepository.remove(message);

    return ResponseCore.ok(null);
  }

  /** Sends a one-off sample message through a single channel so the user can verify their template/link before relying on it. */
  async sendTestMessage(userId: string, channel: NotificationChannelType): Promise<ResponseCore<null>> {
    const config = await this.notificationConfigRepository.findOneBy({ userId, channel });

    if (!config || !config.isEnabled || config.config === null) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'Channel is not linked or enabled');
    }

    const sender = this.senderByChannel.get(channel);

    if (!sender) {
      return ResponseCore.fail(ErrorCode.CHANNEL_NOT_SUPPORTED, `No sender registered for channel ${channel}`);
    }

    const testMessage = 'This is a test notification from AIoT Lab.';

    await sender.send(config, config.messageTemplate ? this.renderTemplate(config.messageTemplate, testMessage) : testMessage);

    return ResponseCore.ok(null);
  }

  private renderTemplate(template: string, fallbackMessage: string): string {
    return template.includes('{{message}}') ? template.replaceAll('{{message}}', fallbackMessage) : template;
  }
}
