import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';

// Shared marker set by PublicStrategy when a public route is hit without a
// valid JWT — `Symbol.for` resolves to the same global symbol wherever it's
// read, so this stays in sync across auth.guard.ts's passport strategies.
export const IS_PUBLIC_USER = Symbol.for('isPublic');

export function isPublicUser(user: unknown): boolean {
  return Boolean((user as Record<symbol, unknown> | undefined)?.[IS_PUBLIC_USER]);
}

export function AuthUser() {
  return createParamDecorator((_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();

    const user = request.user;

    if (isPublicUser(user)) {
      return;
    }

    return user;
  })();
}
