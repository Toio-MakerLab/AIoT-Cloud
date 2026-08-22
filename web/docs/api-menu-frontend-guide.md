# API Guide: Menu & Auth for Frontend Integration

## Base URL
```
https://<host>/v1
```

---

## 1. Login

```
POST /v1/auth/login
Content-Type: application/json
```

**Request:**
```json
{ "username": "admin", "password": "secret" }
```

**Response:**
```json
{
  "data": {
    "access_token": "<jwt>",
    "refresh_token": "<jwt>",
    "user": {
      "id": "123456789",
      "username": "admin",
      "full_name": "Super Admin",
      "role": "ADMIN"
    }
  },
  "message": "Login success!"
}
```

Store `access_token` and `user.role` in app state. The role controls which menu items are visible.

---

## 2. Get Navigation Menu

```
GET /v1/account/menu
Authorization: Bearer <access_token>
```

**Response shape** (maps directly to `SidebarData.navGroups`):
```json
{
  "data": {
    "role": "ADMIN",
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
                  "can_create": true,
                  "can_update": true,
                  "can_delete": true
                }
              },
              {
                "title": "Categories",
                "url": "/cms/categories",
                "icon": "folder",
                "permission": {
                  "resource": "cms/categories",
                  "can_read": true,
                  "can_create": true,
                  "can_update": true,
                  "can_delete": true
                }
              }
            ]
          }
        ]
      },
      {
        "title": "Communication",
        "items": [
          {
            "title": "Messages",
            "url": "/messages",
            "icon": "message-square",
            "permission": {
              "resource": "messages",
              "can_read": true,
              "can_create": true,
              "can_update": false,
              "can_delete": false
            }
          }
        ]
      }
    ]
  },
  "message": "success"
}
```

---

## 3. Frontend Integration

### TypeScript mapping

```ts
// Backend response type
interface MenuApiResponse {
  data: {
    role: string
    navGroups: NavGroup[]  // maps directly to SidebarData.navGroups
  }
  message: string
}

// Permission type (extra field on NavItem from backend)
interface Permission {
  resource: string
  can_read: boolean
  can_create: boolean
  can_update: boolean
  can_delete: boolean
}
```

### Fetch and apply to sidebar

```ts
async function fetchSidebarMenu(token: string): Promise<SidebarData['navGroups']> {
  const res = await fetch('/v1/account/menu', {
    headers: { Authorization: `Bearer ${token}` },
  })
  const json = await res.json()
  return json.data.navGroups
}
```

### Use with permission guards

```ts
// Check if user can perform a CRUD action
function canAccess(item: NavItem, action: 'read' | 'create' | 'update' | 'delete'): boolean {
  const p = (item as any).permission
  if (!p) return true  // group header
  return p[`can_${action}`] === true
}

// Example: hide delete button
const canDelete = canAccess(menuItem, 'delete')
```

---

## 4. Role-based behaviour summary

| Role  | Sees in menu |
|-------|-------------|
| ROOT  | Everything |
| ADMIN | CMS (all), Messages, Accounts |
| STAFF | CMS Posts (read), Categories (read), Tasks/Notes/Drawings/Timetables (full) |
| USER  | Messages only |
