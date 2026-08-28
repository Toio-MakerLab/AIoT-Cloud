import { Body, Controller, ForbiddenException, Headers, HttpCode, HttpStatus, Post } from '@nestjs/common';
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
    } catch {
      return { ok: false };
    }
  }
}
