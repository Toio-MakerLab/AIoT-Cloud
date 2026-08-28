import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

import { ApiConfigService } from '../../../shared/services/api-config.service.ts';
import type { ZaloWebhookRegistrationResponse } from '../interfaces/zalo-webhook-registration-response.interface.ts';

/**
 * Registers our webhook URL with the Zalo Bot API on every app start. Zalo has no "list
 * webhook" API to diff against, so we unconditionally delete then re-set it — idempotent,
 * and picks up a changed ZALO_BOT_WEBHOOK_URL/secret without manual intervention.
 */
const REQUEST_TIMEOUT_MS = 10_000;

@Injectable()
export class ZaloWebhookRegistrationService {
  private readonly logger = new Logger(ZaloWebhookRegistrationService.name);

  constructor(private readonly apiConfigService: ApiConfigService) {}

  async registerWebhook(): Promise<void> {
    if (!this.apiConfigService.zaloEnabled) {
      return;
    }

    const { deleteWebhookUrl, setWebhookUrl, webhookUrl, webhookSecret } = this.apiConfigService.zaloConfig;

    if (!deleteWebhookUrl || !setWebhookUrl) {
      this.logger.warn('ZALO_BOT_TOKEN is not configured; skipping webhook registration.');

      return;
    }

    if (!webhookUrl || !webhookSecret) {
      this.logger.warn('ZALO_BOT_WEBHOOK_URL/ZALO_BOT_WEBHOOK_SECRET is not configured; skipping webhook registration.');

      return;
    }

    await this.deleteWebhook(deleteWebhookUrl);
    await this.setWebhook(setWebhookUrl, webhookUrl, webhookSecret);
  }

  private async deleteWebhook(deleteWebhookUrl: string): Promise<void> {
    try {
      const { data, status } = await axios.post<ZaloWebhookRegistrationResponse>(deleteWebhookUrl, undefined, {
        timeout: REQUEST_TIMEOUT_MS,
        validateStatus: () => true,
      });

      if (status < 200 || status >= 300 || !data.ok) {
        this.logger.warn(`Zalo deleteWebhook (${deleteWebhookUrl}) responded ${status}: ${data.message ?? JSON.stringify(data)}`);
      }
    } catch (error) {
      this.logger.error(`Failed to call Zalo deleteWebhook (${deleteWebhookUrl}): ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async setWebhook(setWebhookUrl: string, webhookUrl: string, webhookSecret: string): Promise<void> {
    try {
      const { data, status } = await axios.post<ZaloWebhookRegistrationResponse>(
        setWebhookUrl,
        { url: webhookUrl, secret_token: webhookSecret },
        { timeout: REQUEST_TIMEOUT_MS, validateStatus: () => true },
      );

      if (status < 200 || status >= 300 || !data.ok) {
        this.logger.error(`Zalo setWebhook (${setWebhookUrl}) responded ${status}: ${data.message ?? JSON.stringify(data)}`);

        return;
      }

      const verification = data.result?.verification;

      if (verification && !verification.ok) {
        this.logger.warn(
          `Zalo setWebhook (${setWebhookUrl}) registered but verification failed: ${verification.outcome} (${verification.hint ?? 'no hint'})`,
        );

        return;
      }

      this.logger.log(`Zalo webhook registered at ${webhookUrl}`);
    } catch (error) {
      this.logger.error(`Failed to call Zalo setWebhook (${setWebhookUrl}): ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
