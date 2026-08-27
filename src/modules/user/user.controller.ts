import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Query, ValidationPipe } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

import { PageDto } from '../../common/dto/page.dto.ts';
import { ResponseCore } from '../../common/dto/response-core.dto.ts';
import { RoleType } from '../../constants/role-type.ts';
import { ApiPageResponse } from '../../decorators/api-page-response.decorator.ts';
import { AuthUser } from '../../decorators/auth-user.decorator.ts';
import { Auth, UUIDParam } from '../../decorators/http.decorators.ts';
import { UseLanguageInterceptor } from '../../interceptors/language-interceptor.service.ts';
import { TranslationService } from '../../shared/services/translation.service.ts';
import { CreateUserDto } from './dtos/create-user.dto.ts';
import { UpdateUserDto } from './dtos/update-user.dto.ts';
import { UserDto } from './dtos/user.dto.ts';
import { UsersPageOptionsDto } from './dtos/users-page-options.dto.ts';
import { UserEntity } from './user.entity.ts';
import { UserService } from './user.service.ts';

@Controller('users')
@ApiTags('users')
export class UserController {
  constructor(
    private userService: UserService,
    private readonly translationService: TranslationService,
  ) {}

  @Get('admin')
  @Auth([RoleType.USER])
  @HttpCode(HttpStatus.OK)
  @UseLanguageInterceptor()
  async admin(@AuthUser() user: UserEntity) {
    const translation = await this.translationService.translate('admin.keywords.admin');

    return {
      text: `${translation} ${user.firstName}`,
    };
  }

  @Get()
  @Auth([RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  @ApiPageResponse({
    description: 'Get users list',
    type: PageDto,
  })
  getUsers(
    @Query(new ValidationPipe({ transform: true }))
    pageOptionsDto: UsersPageOptionsDto,
  ): Promise<PageDto<UserDto>> {
    return this.userService.getUsers(pageOptionsDto);
  }

  @Get(':id')
  @Auth([RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Get users list',
    type: UserDto,
  })
  getUser(@UUIDParam('id') userId: Uuid): Promise<ResponseCore<UserDto>> {
    return this.userService.getUser(userId);
  }

  @Post()
  @Auth([RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Create user',
    type: UserDto,
  })
  createUser(@Body() createUserDto: CreateUserDto): Promise<ResponseCore<UserDto>> {
    return this.userService.createUserByAdmin(createUserDto);
  }

  @Patch(':id')
  @Auth([RoleType.ADMIN, RoleType.ROOT])
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Update user',
    type: UserDto,
  })
  updateUser(@UUIDParam('id') userId: Uuid, @Body() updateUserDto: UpdateUserDto): Promise<ResponseCore<UserDto>> {
    return this.userService.updateUser(userId, updateUserDto);
  }
}
