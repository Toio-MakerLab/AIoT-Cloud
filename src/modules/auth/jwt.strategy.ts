import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ResponseCore } from '../../common/dto/response-core.dto.ts';
import { ErrorCode } from '../../constants/error-code.ts';
import type { RoleType } from '../../constants/role-type.ts';
import { TokenType } from '../../constants/token-type.ts';
import { ApiConfigService } from '../../shared/services/api-config.service.ts';
import type { UserEntity } from '../user/user.entity.ts';
import { UserService } from '../user/user.service.ts';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ApiConfigService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.authConfig.publicKey,
    });
  }

  async validate(args: { userId: string; role: RoleType; type: TokenType }): Promise<UserEntity | ResponseCore<null>> {
    if (args.type !== TokenType.ACCESS_TOKEN) {
      return ResponseCore.fail(ErrorCode.UNAUTHORIZED, 'error.invalidTokenType');
    }

    const user = await this.userService.findOne({
      // FIXME: issue with type casts
      id: args.userId as never,
    });

    if (!user) {
      return ResponseCore.fail(ErrorCode.UNAUTHORIZED, 'error.userNotFound');
    }

    return user;
  }
}
