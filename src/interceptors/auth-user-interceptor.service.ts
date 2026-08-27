import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable } from '@nestjs/common';

import { isPublicUser } from '../decorators/auth-user.decorator.ts';
import type { UserEntity } from '../modules/user/user.entity.ts';
import { ContextProvider } from '../providers/context.provider.ts';

@Injectable()
export class AuthUserInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<{ user: UserEntity }>();

    const user = request.user;

    // Mirror AuthUser()'s handling: an anonymous request on a public route
    // carries PublicStrategy's `{ [IS_PUBLIC_USER]: true }` marker as
    // `request.user`, not a real UserEntity. Store `undefined` instead of
    // that marker so ContextProvider.getAuthUser() can't be mistaken for a
    // logged-in user elsewhere.
    ContextProvider.setAuthUser(isPublicUser(user) ? undefined : user);

    return next.handle();
  }
}
