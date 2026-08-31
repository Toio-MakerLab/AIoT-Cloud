import { RoleType } from '../constants/role-type.ts';
import type { UserEntity } from '../modules/user/user.entity.ts';

/**
 * Read-access scope derived from the calling account, used to filter device/dashboard queries:
 * - `null` — unrestricted (GUEST): every record system-wide, regardless of owner or factory.
 * - `{ factoryId }` — every record belonging to the caller's factory (any USER/ADMIN/ROOT account
 *   that has been assigned to one via `UserEntity.factoryId`), not just the caller's own.
 * - `{ userId }` — fallback: only the caller's own records. Used for accounts not yet assigned to
 *   any factory, preserving the pre-factory "own records only" behavior.
 *
 * Each non-null variant is a literal `{ columnName: value }` object matching a real entity column,
 * so it can be spread directly into a `where` clause, e.g. `{ id, ...scope }`.
 */
export type AccessScope = { userId: string } | { factoryId: string } | null;

/** Derives the caller's `AccessScope` from their (freshly loaded) `UserEntity`. */
export function resolveAccessScope(user: UserEntity): AccessScope {
  if (user.role === RoleType.GUEST) {
    return null;
  }

  if (user.factoryId) {
    return { factoryId: user.factoryId };
  }

  return { userId: user.id as string };
}
