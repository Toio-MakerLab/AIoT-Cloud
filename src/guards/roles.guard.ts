import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { RoleType } from '../constants/role-type.ts';
import { Roles } from '../decorators/roles.decorator.ts';
import type { UserEntity } from '../modules/user/user.entity.ts';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // `Roles` is built with `Reflector.createDecorator()` without an explicit `key`, which assigns
    // it a random metadata key at module-load time — looking that metadata up by the literal string
    // 'roles' (as opposed to passing the `Roles` decorator itself, which carries the real key on
    // `.KEY`) never matches, so this used to silently no-op and let any authenticated user through
    // regardless of the roles list on `@Auth([...])`.
    const roles = this.reflector.get<RoleType[] | undefined>(Roles, context.getHandler());

    if (!roles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user: UserEntity }>();
    const user = request.user;

    return roles.includes(user.role);
  }
}
