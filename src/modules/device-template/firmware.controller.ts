import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, UploadedFile } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import type { ResponseCore } from '../../common/dto/response-core.dto.ts';
import { RoleType } from '../../constants/role-type.ts';
import { AuthUser } from '../../decorators/auth-user.decorator.ts';
import { Auth } from '../../decorators/http.decorators.ts';
import { ApiFile } from '../../decorators/swagger.schema.ts';
import type { IFile } from '../../interfaces/IFile.ts';
import type { Reference } from '../../types.ts';
import type { UserEntity } from '../user/user.entity.ts';
import type { FirmwareDto } from './dtos/firmware.dto.ts';
import { CreateFirmwareDto, UpdateFirmwareDto } from './dtos/firmware.dto.ts';
import { UploadFirmwareDto } from './dtos/upload-firmware.dto.ts';
import { FirmwareService } from './firmware.service.ts';

/** Firmware catalog CRUD, scoped per device template — see `FirmwareEntity`'s doc comment for how it's used by `DeviceOtaService`. */
@Controller('firmwares')
@ApiTags('firmwares')
export class FirmwareController {
  constructor(private firmwareService: FirmwareService) {}

  @Get()
  @Auth([RoleType.GUEST, RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  getFirmwares(@Query('templateId') templateId?: string): Promise<ResponseCore<FirmwareDto[]>> {
    return this.firmwareService.getFirmwares(templateId);
  }

  @Get(':id')
  @Auth([RoleType.GUEST, RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  getFirmware(@Param('id') id: string): Promise<ResponseCore<FirmwareDto>> {
    return this.firmwareService.getFirmware(id);
  }

  /** Registers a build already hosted elsewhere (S3/CDN/GitHub release/etc) — see `POST /firmwares/upload` to upload the `.bin` itself instead. */
  @Post()
  @Auth([RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.CREATED)
  createFirmware(@AuthUser() user: UserEntity, @Body() dto: CreateFirmwareDto): Promise<ResponseCore<FirmwareDto>> {
    return this.firmwareService.createFirmware(user.id as string, dto);
  }

  /** Accepts the firmware `.bin` directly (multipart) and stores it locally — see `FirmwareService.uploadFirmware`. */
  @Post('upload')
  @Auth([RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.CREATED)
  @ApiFile({ name: 'file' })
  uploadFirmware(
    @AuthUser() user: UserEntity,
    @Body() dto: UploadFirmwareDto,
    @UploadedFile() file: Reference<IFile>,
  ): Promise<ResponseCore<FirmwareDto>> {
    return this.firmwareService.uploadFirmware(user.id as string, dto.templateId, dto.version, dto.releaseNotes ?? null, file);
  }

  @Put(':id')
  @Auth([RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  updateFirmware(@Param('id') id: string, @Body() dto: UpdateFirmwareDto): Promise<ResponseCore<FirmwareDto>> {
    return this.firmwareService.updateFirmware(id, dto);
  }

  @Delete(':id')
  @Auth([RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  deleteFirmware(@Param('id') id: string): Promise<ResponseCore<null>> {
    return this.firmwareService.deleteFirmware(id);
  }
}
