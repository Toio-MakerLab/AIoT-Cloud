import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ResponseCore } from '../../common/dto/response-core.dto.ts';
import { validateHash } from '../../common/utils.ts';
import { ErrorCode } from '../../constants/error-code.ts';
import type { RoleType } from '../../constants/role-type.ts';
import { TokenType } from '../../constants/token-type.ts';
import { ApiConfigService } from '../../shared/services/api-config.service.ts';
import type { UserEntity } from '../user/user.entity.ts';
import { UserService } from '../user/user.service.ts';
import { TokenPayloadDto } from './dto/token-payload.dto.ts';
import type { UserLoginDto } from './dto/user-login.dto.ts';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ApiConfigService,
    private userService: UserService,
  ) {}

  /** `factoryId` is carried in the token (not just looked up from the DB per-request, as REST does
   * via `JwtStrategy`) because the websocket gateway decodes the JWT directly, with no DB lookup. */
  async createAccessToken(data: { role: RoleType; userId: string; factoryId: string | null }): Promise<TokenPayloadDto> {
    return new TokenPayloadDto({
      expiresIn: this.configService.authConfig.jwtExpirationTime,
      accessToken: await this.jwtService.signAsync({
        userId: data.userId,
        type: TokenType.ACCESS_TOKEN,
        role: data.role,
        factoryId: data.factoryId,
      }),
    });
  }

  async validateUser(userLoginDto: UserLoginDto): Promise<ResponseCore<UserEntity>> {
    const user = await this.userService.findByUsernameOrEmail({
      username: userLoginDto.usernameOrEmail,
      email: userLoginDto.usernameOrEmail,
    });

    const isPasswordValid = await validateHash(userLoginDto.password, user?.password);

    if (!isPasswordValid) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.userNotFound');
    }

    if (!user!.settings?.isEmailVerified) {
      return ResponseCore.fail(ErrorCode.FORBIDDEN, 'error.emailNotVerified');
    }

    if (user!.settings?.isActive === false) {
      return ResponseCore.fail(ErrorCode.FORBIDDEN, 'error.userDeactivated');
    }

    return ResponseCore.ok(user!);
  }
}
