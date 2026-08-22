# Feature: ABAC Authorization with Casbin + Menu System

## Overview

Implemented role-based access control (RBAC/ABAC) using the Casbin library, embedded JWT role claims, and a role-filtered navigation menu built from a static definition (no admin CRUD, no DB-backed menu table).

---

## Architecture

```
Request
  → AuthenticationMiddleware  (validate JWT → set user_id, user_role in context)
  → AuthorizationMiddleware   (Casbin policy check per resource → 403 if denied)
  → Handler
```

```
internal/
├── core/
│   ├── domain/
│   │   ├── authz.go      # AuthzInput, AuthzResult
│   │   └── menu.go       # NavItem, NavGroup, MenuResponse, ResourcePermission
│   └── ports/ports.go    # AuthorizationService, MenuService
├── adapters/
│   ├── casbin/
│   │   ├── authorization_adapter.go   # Casbin enforcer, IsAllowed()
│   │   ├── menu_service.go            # MenuServiceAdapter (static nav def, Casbin-filtered)
│   │   ├── rbac_model.conf            # Casbin model definition
│   │   └── rbac_policy.csv           # Policy rules per role/resource/action
│   ├── http/
│   │   └── middleware.go              # AuthenticationMiddleware, AuthorizationMiddleware
│   └── handler/
│       └── menu_handler.go            # GET /v1/account/menu
```

---

## Roles

| Role  | Description                                  |
|-------|----------------------------------------------|
| ROOT  | Full access to all resources                 |
| ADMIN | Full access to CMS, messages, users          |
| STAFF | Read-only on posts/categories; full on tasks/notes/drawings/timetables |
| USER  | GET and POST on messages only                |

---

## Permission Matrix

| Resource         | ROOT | ADMIN | STAFF | USER     |
|-----------------|------|-------|-------|----------|
| cms/posts       | ALL  | ALL   | GET   | —        |
| cms/categories  | ALL  | ALL   | GET   | —        |
| cms/tasks       | ALL  | ALL   | ALL   | —        |
| cms/notes       | ALL  | ALL   | ALL   | —        |
| cms/drawings    | ALL  | ALL   | ALL   | —        |
| cms/timetables  | ALL  | ALL   | ALL   | —        |
| cms/tags        | ALL  | ALL   | ALL   | —        |
| cms/menus (guards permission grant/revoke endpoints) | ALL | ALL | — | — |
| cms/upload      | ALL  | ALL   | POST  | —        |
| messages        | ALL  | ALL   | —     | GET,POST |
| users           | ALL  | ALL   | —     | —        |

---

## JWT Changes

The access token now embeds a `role` claim:

```json
{
  "iss": "golang-hexagonal-access",
  "sub": "<user_id>",
  "role": "ADMIN",
  "iat": 1234567890,
  "exp": 1234654290
}
```

`GenerateAccessToken(userID, role, jwtSecret string)` — signature updated.
`ValidateToken(authHeader, jwtSecret string) (userID, role string, err error)` — now returns role.

---

## API Endpoints

### Authentication menu (any authenticated user)

```
GET /v1/account/menu
Authorization: Bearer <token>
```

Returns role-filtered sidebar navigation matching the frontend `SidebarData.navGroups` shape:

```json
{
  "role": "STAFF",
  "navGroups": [
    {
      "title": "Content Management",
      "items": [
        {
          "title": "CMS",
          "icon": "layout",
          "items": [
            {
              "title": "Posts",
              "url": "/cms/posts",
              "icon": "file-text",
              "permission": {
                "resource": "cms/posts",
                "can_read": true,
                "can_create": false,
                "can_update": false,
                "can_delete": false
              }
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Menu Resolution Logic

`GET /v1/account/menu` resolution order:

1. Iterate the hardcoded static nav definition (`allNavGroups` in `menu_service.go`)
2. Filter leaf items by Casbin `Enforce(role, resource, "GET")`
3. Build `permission` object per leaf (checks GET/POST/PUT/DELETE)
4. Group headers (items with children) are included only if ≥1 child is accessible

There is no admin CRUD for menu entries and no `menus` database table — the nav tree is defined in code and filtered per-request by role/permissions.

---

## Frontend Type Mapping

| Backend type      | Frontend type       |
|-------------------|---------------------|
| `MenuResponse`    | `SidebarData` (partial — no `user`/`teams`) |
| `NavGroup`        | `NavGroup`          |
| `NavItem` (leaf)  | `NavLink`           |
| `NavItem` (children) | `NavCollapsible` |

---

## Login Response Change

`POST /v1/auth/login` now returns `role` in the user profile:

```json
{
  "access_token": "...",
  "refresh_token": "...",
  "user": {
    "id": "...",
    "username": "admin",
    "full_name": "Super Admin",
    "role": "ADMIN"
  }
}
```
