import { Body, Controller, ForbiddenException, Headers, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import type { ZaloWebhookPayload } from './interfaces/zalo-webhook-payload.interface.ts';
import { NotificationService } from './notification.service.ts';

/**
 * Public webhook target registered with the Zalo Bot API (`setWebhook`). Not authenticated by
 * our own auth guard — trust is established per-request via the `X-Bot-Api-Secret-Token` header,
 * which must match the secret we passed to `setWebhook`.
 */
@Controller('notifications/zalo')
@ApiTags('notifications')
export class ZaloWebhookController {
  private readonly logger = new Logger(ZaloWebhookController.name);

  constructor(private readonly notificationService: NotificationService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('x-bot-api-secret-token') secretToken: string | undefined,
    @Body() payload: ZaloWebhookPayload,
  ): Promise<{ ok: boolean }> {
    if (!this.notificationService.isValidWebhookSecret(secretToken)) {
      throw new ForbiddenException('Unauthorized');
    }

    try {
      await this.notificationService.handleZaloWebhookUpdate(payload);

      return { ok: true };
    } catch (error) {
      // Previously swallowed silently and answered 200 `{ ok: false }` — Zalo (and anyone
      // watching logs) had no way to tell a failed update from a successful one. Log it and
      // rethrow so the global AllExceptionsFilter answers a real 500 instead.
      this.logger.error(
        `Failed to handle Zalo webhook update: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw error;
    }
  }
}
