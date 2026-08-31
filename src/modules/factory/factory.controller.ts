import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { PageDto } from '../../common/dto/page.dto.ts';
import { ResponseCore } from '../../common/dto/response-core.dto.ts';
import { RoleType } from '../../constants/role-type.ts';
import { ApiPageResponse } from '../../decorators/api-page-response.decorator.ts';
import { AuthUser } from '../../decorators/auth-user.decorator.ts';
import { Auth } from '../../decorators/http.decorators.ts';
import type { UserEntity } from '../user/user.entity.ts';
import { CreateFactoryDto } from './dtos/create-factory.dto.ts';
import { FactoriesPageOptionsDto } from './dtos/factories-page-options.dto.ts';
import type { FactoryDto } from './dtos/factory.dto.ts';
import { UpdateFactoryDto } from './dtos/update-factory.dto.ts';
import { FactoryService } from './factory.service.ts';

@Controller('factories')
@ApiTags('factories')
export class FactoryController {
  constructor(private factoryService: FactoryService) {}

  // Factory management is admin/root-only end to end — regular USER/GUEST accounts never see the
  // factories list itself, only the factory-scoped devices/dashboards it grants them access to.
  @Get()
  @Auth([RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  @ApiPageResponse({ description: 'Get factories list', type: PageDto })
  getFactories(
    @Query(new ValidationPipe({ transform: true }))
    pageOptionsDto: FactoriesPageOptionsDto,
  ): Promise<PageDto<FactoryDto>> {
    return this.factoryService.getFactories(pageOptionsDto);
  }

  // Unlike the rest of this controller, any authenticated (non-GUEST) account can read its own
  // factory's name here — purely for display (e.g. the sidebar's team switcher), not management.
  // Registered before `:id` so 'mine' isn't swallowed by that param route.
  @Get('mine')
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  getMyFactory(@AuthUser() user: UserEntity): Promise<ResponseCore<FactoryDto | null>> {
    if (!user.factoryId) {
      return Promise.resolve(ResponseCore.ok(null));
    }

    return this.factoryService.getFactory(user.factoryId);
  }

  @Get(':id')
  @Auth([RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  getFactory(@Param('id') id: string): Promise<ResponseCore<FactoryDto>> {
    return this.factoryService.getFactory(id);
  }

  @Post()
  @Auth([RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.CREATED)
  createFactory(@Body() dto: CreateFactoryDto): Promise<ResponseCore<FactoryDto>> {
    return this.factoryService.createFactory(dto);
  }

  @Put(':id')
  @Auth([RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  updateFactory(@Param('id') id: string, @Body() dto: UpdateFactoryDto): Promise<ResponseCore<FactoryDto>> {
    return this.factoryService.updateFactory(id, dto);
  }

  @Delete(':id')
  @Auth([RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  deleteFactory(@Param('id') id: string): Promise<ResponseCore<null>> {
    return this.factoryService.deleteFactory(id);
  }
}
