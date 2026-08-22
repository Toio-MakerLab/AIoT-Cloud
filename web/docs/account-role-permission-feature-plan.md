# Feature Plan: Account CRUD + Role Permission Management

## Overview

Two backend gaps block features the frontend now expects:

1. **Account CRUD** — `src/features/users` (route `/users`, resource key
   `users`) is fully built and access-control-gated
   ([[abac-authorization-feature]]'s `users` row) but the CRUD endpoints
   below don't exist yet. It currently renders local mock data.

   Note: `GET /v1/account/menu` already reports this menu entry live with
   `permission.resource: "users"` (not `account` or `customer` — those were
   earlier, incorrect assumptions on the frontend side, since fixed in
   `src/features/account/api/resources.ts`). `Enforce(role, "users", action)`
   must match that key.
2. **Role permission management** — there is no way for an ADMIN/ROOT to
   change what a role can do. Per `docs/abac-authorization-feature.md`,
   policy lives in a static `rbac_policy.csv` with "no admin CRUD" by design.
   The frontend now has a settings page (`/settings/roles`, resource key
   `cms/menus` — already reserved in that doc's permission matrix as "guards
   permission grant/revoke endpoints") that needs a real API to read and
   write per-role, per-resource permissions.

This doc specs the API contract the frontend was built against, so the two
gaps above can be implemented against the existing Casbin adapter
(`internal/adapters/casbin/*`).

---

## Part A — Account CRUD

### Fields

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `first_name` | string | required |
| `last_name` | string | required |
| `username` | string | required, unique |
| `email` | string | required, unique |
| `phone_number` | string | required |
| `password` | string | write-only, required on create, optional on update |
| `status` | string | `active` \| `inactive` \| `invited` \| `suspended` |
| `role` | string | free-form label on the account record itself — unrelated to the ADMIN/STAFF/USER RBAC roles in Part B |
| `created_at` / `updated_at` | timestamp | |

### Endpoints

All require `Authorization: Bearer <token>` and are gated by Casbin on
resource `users` (already `ALL` for ROOT/ADMIN, `—` for STAFF/USER per
the existing permission matrix — no policy change needed for this part).

```
GET    /v1/account            list all accounts
GET    /v1/account/:id        get one
POST   /v1/account            create
PUT    /v1/account/:id        update (password omitted if unchanged)
DELETE /v1/account/:id        delete
POST   /v1/account/invite     send an email invite (no password yet)
```

> **Route collision warning:** `/v1/account` now also hosts `/v1/account/menu`
> ([[abac-authorization-feature]]) and `/v1/account/roles/...` (Part B
> below). A naive `GET /v1/account/:id` route will swallow `menu`, `roles`,
> and `invite` as an `:id` value. Register the literal routes (`menu`,
> `roles`, `invite`) *before* the `:id` wildcard, or move account CRUD under
> a route group that excludes those reserved segments.

**GET /v1/account response:**

```json
{
  "data": [
    {
      "id": "cus_01h...",
      "first_name": "John",
      "last_name": "Doe",
      "username": "john_doe",
      "email": "john.doe@example.com",
      "phone_number": "+123456789",
      "status": "active",
      "role": "member",
      "created_at": "2026-06-01T10:00:00Z",
      "updated_at": "2026-06-01T10:00:00Z"
    }
  ],
  "message": "success"
}
```

**POST /v1/account/invite request:**

```json
{ "email": "jane@example.com", "role": "member", "desc": "optional note" }
```

### Error Response Shape

```json
{ "data": null, "message": "bad request", "errorCode": -400 }
```

| Code | Meaning |
|---|---|
| `0` | Success |
| `-400` | Validation error (missing field, bad email, duplicate username/email) |
| `-401` | Unauthorized |
| `-403` | Forbidden (Casbin denies `users` resource for caller's role) |
| `-404` | Account not found |
| `-500` | Internal server error |

---

## Part B — Role Permission Management

Replaces (or overlays a DB-backed adapter in front of) the static
`rbac_policy.csv` so ROOT/ADMIN can view and edit the permission matrix at
runtime instead of editing the CSV and redeploying.

### New resource: `cms/menus`

Already documented in `docs/abac-authorization-feature.md`'s permission
matrix as `ALL` for ROOT/ADMIN, `—` for STAFF/USER — these endpoints must be
guarded by that same policy entry. Mirrored on the frontend as
`RESOURCES.MENUS = 'cms/menus'` in `src/features/account/api/resources.ts`.

### Endpoints

```
GET /v1/account/roles
```
Lists the known roles.
```json
{ "data": [{ "name": "ROOT" }, { "name": "ADMIN" }, { "name": "STAFF" }, { "name": "USER" }], "message": "success" }
```

```
GET /v1/account/roles/:role/permissions
```
Returns the current Casbin policy for that role, one entry per resource
(same resource keys as `GET /v1/account/menu`'s `permission.resource`):
```json
{
  "data": {
    "role": "STAFF",
    "permissions": [
      { "resource": "cms/posts", "can_read": true, "can_create": false, "can_update": false, "can_delete": false },
      { "resource": "cms/categories", "can_read": true, "can_create": false, "can_update": false, "can_delete": false },
      { "resource": "cms/tasks", "can_read": true, "can_create": true, "can_update": true, "can_delete": true },
      { "resource": "cms/menus", "can_read": false, "can_create": false, "can_update": false, "can_delete": false }
    ]
  },
  "message": "success"
}
```

```
PUT /v1/account/roles/:role/permissions
```
Body is the same `permissions` array (full replace, not a patch — the
frontend always sends one entry per known resource). Persists as Casbin
policy rows (`p, <role>, <resource>, <action>` per truthy `can_*` flag) and
should re-generate/overwrite the relevant lines in `rbac_policy.csv` (or the
DB-backed policy table, if the adapter is migrated off CSV).

**Recommendation:** reject edits where `:role == "ROOT"` with `-400` — ROOT
should stay hardcoded to full access so there's always an unlockable admin
path if a policy edit goes wrong.

### Error Response Shape

Same shape/codes as Part A, plus:

| Code | Meaning |
|---|---|
| `-400` | Unknown role, unknown resource key, or attempt to edit `ROOT` |

---

## Implementation Plan

### Files to Modify (per `docs/abac-authorization-feature.md`'s architecture)

| File | Change |
|---|---|
| `internal/adapters/casbin/rbac_policy.csv` | Add `cms/menus` rows for ROOT/ADMIN (`ALL`) |
| `internal/adapters/casbin/authorization_adapter.go` | Add `SetPolicy`/`SavePolicy` write path if not already exposed |
| `internal/core/ports/ports.go` | Add `RoleService` interface (`ListRoles`, `GetRolePermissions`, `UpdateRolePermissions`) |
| `internal/core/domain/authz.go` | Add `RolePermissions`, `UpdateRolePermissionsRequest` DTOs |
| `internal/adapters/handler/role_handler.go` (new) | `GET/PUT /v1/account/roles/:role/permissions`, `GET /v1/account/roles` |
| `internal/adapters/handler/account_handler.go` (new) | Part A CRUD handlers |
| `cmd/routes.go` | Register both route groups under the existing `AuthorizationMiddleware` |

### Route Summary

```
GET    /v1/account
GET    /v1/account/:id
POST   /v1/account
PUT    /v1/account/:id
DELETE /v1/account/:id
POST   /v1/account/invite

GET    /v1/account/roles
GET    /v1/account/roles/:role/permissions
PUT    /v1/account/roles/:role/permissions
```

---

## Frontend (already implemented against this contract)

- `src/features/users/api/{types,api,queries,utils}.ts` — calls `/v1/account*`.
- `src/features/roles/api/{types,api,queries}.ts` — calls `/v1/account/roles*`.
- `src/features/roles/index.tsx` + `components/role-permission-matrix.tsx` —
  role tabs + a resource × action switch matrix, gated by
  `useCanAccess(RESOURCES.MENUS, 'read' | 'update')`.
- Route: `/settings/roles` (`src/routes/_authenticated/settings/roles.tsx`),
  linked from the Settings nav group.

Until the backend endpoints above exist, both pages will show loading/error
states from React Query — no mock fallback was added, since the mock data
the `users` feature previously shipped with has been removed.
