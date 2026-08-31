import { Body, Controller, Get, HttpCode, HttpStatus, Post, UploadedFile, Version } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ResponseCore } from '../../common/dto/response-core.dto.ts';
import { RoleType } from '../../constants/role-type.ts';
import { AuthUser } from '../../decorators/auth-user.decorator.ts';
import { Auth } from '../../decorators/http.decorators.ts';
import { ApiFile } from '../../decorators/swagger.schema.ts';
import type { IFile } from '../../interfaces/IFile.ts';
import type { Reference } from '../../types.ts';
import { UserDto } from '../user/dtos/user.dto.ts';
import { UserEntity } from '../user/user.entity.ts';
import { UserService } from '../user/user.service.ts';
import { AuthService } from './auth.service.ts';
import { LoginPayloadDto } from './dto/login-payload.dto.ts';
import { ResendVerificationDto } from './dto/resend-verification.dto.ts';
import { UserLoginDto } from './dto/user-login.dto.ts';
import { UserRegisterDto } from './dto/user-register.dto.ts';
import { VerifyEmailDto } from './dto/verify-email.dto.ts';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private userService: UserService,
    private authService: AuthService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: LoginPayloadDto,
    description: 'User info with access token',
  })
  async userLogin(@Body() userLoginDto: UserLoginDto): Promise<ResponseCore<LoginPayloadDto>> {
    const result = await this.authService.validateUser(userLoginDto);

    if (!result.data) {
      return ResponseCore.fail(result.error, result.message);
    }

    const userEntity = result.data;

    const token = await this.authService.createAccessToken({
      userId: userEntity.id,
      role: userEntity.role,
      factoryId: userEntity.factoryId,
    });

    return ResponseCore.ok(new LoginPayloadDto(userEntity.toDto(), token));
  }

  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: UserDto, description: 'Successfully Registered' })
  @ApiFile({ name: 'avatar' })
  async userRegister(@Body() userRegisterDto: UserRegisterDto, @UploadedFile() file?: Reference<IFile>): Promise<ResponseCore<UserDto>> {
    const result = await this.userService.createUser(userRegisterDto, file);

    if (!result.data) {
      return ResponseCore.fail(result.error, result.message);
    }

    return ResponseCore.ok(result.data.toDto());
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Verify user account via emailed token' })
  verifyEmail(@Body() dto: VerifyEmailDto): Promise<ResponseCore<null>> {
    return this.userService.verifyEmail(dto.email, dto.token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Resend the account verification email' })
  resendVerification(@Body() dto: ResendVerificationDto): Promise<ResponseCore<null>> {
    return this.userService.resendVerification(dto.email);
  }

  @Version('1')
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @Auth([RoleType.USER, RoleType.ADMIN, RoleType.ROOT, RoleType.GUEST])
  @ApiOkResponse({ type: UserDto, description: 'current user info' })
  getCurrentUser(@AuthUser() user: UserEntity): UserDto {
    return user.toDto();
  }
}
