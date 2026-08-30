import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { PageDto } from '../../common/dto/page.dto.ts';
import type { ResponseCore } from '../../common/dto/response-core.dto.ts';
import { RoleType } from '../../constants/role-type.ts';
import { ApiPageResponse } from '../../decorators/api-page-response.decorator.ts';
import { Auth } from '../../decorators/http.decorators.ts';
import { DeviceTemplateService } from './device-template.service.ts';
import { CreateDeviceTemplateDto } from './dtos/create-device-template.dto.ts';
import type { DeviceTemplateDto } from './dtos/device-template.dto.ts';
import { DeviceTemplatesPageOptionsDto } from './dtos/device-templates-page-options.dto.ts';
import { UpdateDeviceTemplateDto } from './dtos/update-device-template.dto.ts';

@Controller('device-templates')
@ApiTags('device-templates')
export class DeviceTemplateController {
  constructor(private deviceTemplateService: DeviceTemplateService) {}

  @Get()
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  @ApiPageResponse({ description: 'Get device templates list', type: PageDto })
  getDeviceTemplates(
    @Query(new ValidationPipe({ transform: true }))
    pageOptionsDto: DeviceTemplatesPageOptionsDto,
  ): Promise<PageDto<DeviceTemplateDto>> {
    return this.deviceTemplateService.getDeviceTemplates(pageOptionsDto);
  }

  @Get(':id')
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  getDeviceTemplate(@Param('id') id: string): Promise<ResponseCore<DeviceTemplateDto>> {
    return this.deviceTemplateService.getDeviceTemplate(id);
  }

  @Post()
  @Auth([RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.CREATED)
  createDeviceTemplate(@Body() dto: CreateDeviceTemplateDto): Promise<ResponseCore<DeviceTemplateDto>> {
    return this.deviceTemplateService.createDeviceTemplate(dto);
  }

  @Put(':id')
  @Auth([RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  updateDeviceTemplate(@Param('id') id: string, @Body() dto: UpdateDeviceTemplateDto): Promise<ResponseCore<DeviceTemplateDto>> {
    return this.deviceTemplateService.updateDeviceTemplate(id, dto);
  }

  @Delete(':id')
  @Auth([RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  deleteDeviceTemplate(@Param('id') id: string): Promise<ResponseCore<null>> {
    return this.deviceTemplateService.deleteDeviceTemplate(id);
  }
}
