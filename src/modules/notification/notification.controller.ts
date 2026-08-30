import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseEnumPipe, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ResponseCore } from '../../common/dto/response-core.dto.ts';
import { NotificationChannelType } from '../../constants/notification-channel-type.ts';
import { RoleType } from '../../constants/role-type.ts';
import { AuthUser } from '../../decorators/auth-user.decorator.ts';
import { Auth } from '../../decorators/http.decorators.ts';
import type { UserEntity } from '../user/user.entity.ts';
import type { NotificationConfigDto } from './dtos/notification-config.dto.ts';
import { RegisterWebPushTokenDto } from './dtos/register-web-push-token.dto.ts';
import { UpsertNotificationConfigDto } from './dtos/upsert-notification-config.dto.ts';
import { ZaloLinkCodeDto } from './dtos/zalo-link-code.dto.ts';
import { NotificationService } from './notification.service.ts';

@Controller('notifications')
@ApiTags('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('config')
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  async getConfigs(@AuthUser() user: UserEntity): Promise<ResponseCore<NotificationConfigDto[]>> {
    const configs = await this.notificationService.getUserConfigs(user.id as string);

    return ResponseCore.ok(configs);
  }

  @Patch('config/:channel')
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  upsertConfig(
    @AuthUser() user: UserEntity,
    @Param('channel', new ParseEnumPipe(NotificationChannelType)) channel: NotificationChannelType,
    @Body() dto: UpsertNotificationConfigDto,
  ): Promise<ResponseCore<NotificationConfigDto>> {
    return this.notificationService.upsertConfig(user.id as string, channel, dto);
  }

  /** Sends a one-off sample message through the given channel so the user can verify their template/link. */
  @Post('config/:channel/test')
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  sendTestMessage(
    @AuthUser() user: UserEntity,
    @Param('channel', new ParseEnumPipe(NotificationChannelType)) channel: NotificationChannelType,
  ): Promise<ResponseCore<null>> {
    return this.notificationService.sendTestMessage(user.id as string, channel);
  }

  /** Returns a short-lived code the user pastes as a plain message to the Zalo bot to link their account. */
  @Get('zalo/link-code')
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  async getZaloLinkCode(@AuthUser() user: UserEntity): Promise<ResponseCore<ZaloLinkCodeDto>> {
    const result = await this.notificationService.generateZaloLinkCode(user.id as string);

    return { ...result, data: result.data ? new ZaloLinkCodeDto(result.data) : null };
  }

  /** Registers the calling browser's FCM token so it starts receiving web push device warnings. */
  @Post('web-push/token')
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  registerWebPushToken(@AuthUser() user: UserEntity, @Body() dto: RegisterWebPushTokenDto): Promise<ResponseCore<NotificationConfigDto>> {
    return this.notificationService.registerWebPushToken(user.id as string, dto.token);
  }

  /** Unregisters a browser's FCM token, e.g. on logout or push permission revocation. */
  @Delete('web-push/token')
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  unregisterWebPushToken(@AuthUser() user: UserEntity, @Body() dto: RegisterWebPushTokenDto): Promise<ResponseCore<NotificationConfigDto | null>> {
    return this.notificationService.unregisterWebPushToken(user.id as string, dto.token);
  }
}
