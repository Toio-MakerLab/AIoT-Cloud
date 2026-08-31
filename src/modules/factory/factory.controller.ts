import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Post, Put, Query, ValidationPipe } from '@nestjs/common';
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
  private readonly logger = new Logger(FactoryController.name);

  constructor(private factoryService: FactoryService) {}

  // Factory management is admin/root-only end to end — regular USER/GUEST accounts never see the
  // factories list itself, only the factory-scoped devices/dashboards it grants them access to.
  @Get()
  @Auth([RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  @ApiPageResponse({ description: 'Get factories list', type: PageDto })
  async getFactories(
    @Query(new ValidationPipe({ transform: true }))
    pageOptionsDto: FactoriesPageOptionsDto,
  ): Promise<PageDto<FactoryDto>> {
    try {
      return await this.factoryService.getFactories(pageOptionsDto);
    } catch (error) {
      this.logger.error(`Error occurred while fetching factories: ${error instanceof Error ? error.message : String(error)}`, error);
      throw error;
    }
  }

  // Unlike the rest of this controller, any authenticated (non-GUEST) account can read its own
  // factory's name here — purely for display (e.g. the sidebar's team switcher), not management.
  // Registered before `:id` so 'mine' isn't swallowed by that param route.
  @Get('mine')
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  async getMyFactory(@AuthUser() user: UserEntity): Promise<ResponseCore<FactoryDto | null>> {
    if (!user.factoryId) {
      return ResponseCore.ok(null);
    }

    try {
      return await this.factoryService.getFactory(user.factoryId);
    } catch (error) {
      this.logger.error(
        `Error occurred while fetching factory ${user.factoryId} for user ${user.id}: ${error instanceof Error ? error.message : String(error)}`,
        error,
      );
      throw error;
    }
  }

  @Get(':id')
  @Auth([RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  async getFactory(@Param('id') id: string): Promise<ResponseCore<FactoryDto>> {
    try {
      return await this.factoryService.getFactory(id);
    } catch (error) {
      this.logger.error(`Error occurred while fetching factory ${id}: ${error instanceof Error ? error.message : String(error)}`, error);
      throw error;
    }
  }

  @Post()
  @Auth([RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.CREATED)
  async createFactory(@Body() dto: CreateFactoryDto): Promise<ResponseCore<FactoryDto>> {
    try {
      return await this.factoryService.createFactory(dto);
    } catch (error) {
      this.logger.error(`Error occurred while creating factory: ${error instanceof Error ? error.message : String(error)}`, error);
      throw error;
    }
  }

  @Put(':id')
  @Auth([RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  async updateFactory(@Param('id') id: string, @Body() dto: UpdateFactoryDto): Promise<ResponseCore<FactoryDto>> {
    try {
      return await this.factoryService.updateFactory(id, dto);
    } catch (error) {
      this.logger.error(`Error occurred while updating factory ${id}: ${error instanceof Error ? error.message : String(error)}`, error);
      throw error;
    }
  }

  @Delete(':id')
  @Auth([RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  async deleteFactory(@Param('id') id: string): Promise<ResponseCore<null>> {
    try {
      return await this.factoryService.deleteFactory(id);
    } catch (error) {
      this.logger.error(`Error occurred while deleting factory ${id}: ${error instanceof Error ? error.message : String(error)}`, error);
      throw error;
    }
  }
}
