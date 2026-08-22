# Architecture Documentation

## vkhangstack Blog Backoffice Dashboard

A modern React-based admin dashboard built with TypeScript, TanStack Router, and shadcn/ui.

---

## Table of Contents

1. [Overview](#overview)
2. [Directory Structure](#directory-structure)
3. [Architectural Patterns](#architectural-patterns)
4. [Component Organization](#component-organization)
5. [Feature Modules](#feature-modules)
6. [State Management](#state-management)
7. [Data Flow](#data-flow)
8. [Configuration](#configuration)
9. [Technology Stack](#technology-stack)

---

## Overview

This application is a feature-rich admin dashboard with:
- Authentication and authorization
- Task and user management
- Dashboard analytics
- Settings and preferences
- Error handling and routing

**Key Characteristics:**
- Type-safe with strict TypeScript
- File-based routing with automatic code splitting
- Hybrid state management (Zustand + React Query + Context)
- Component-driven UI with shadcn/ui
- Responsive and accessible design
- Dark mode support

---

## Directory Structure

```
src/
├── assets/              # Static assets (SVG logos)
├── components/          # Shared UI components
│   ├── ui/              # shadcn/ui component library (50+ components)
│   ├── layout/          # Layout components
│   │   ├── data/        # Sidebar navigation data
│   │   ├── authenticated-layout.tsx
│   │   ├── app-sidebar.tsx
│   │   ├── header.tsx
│   │   └── ...
│   ├── profile-dropdown.tsx
│   ├── theme-switch.tsx
│   ├── search.tsx
│   └── ...
├── config/              # Configuration files
│   └── fonts.ts
├── context/             # React Context providers
│   ├── theme-context.tsx
│   ├── font-context.tsx
│   └── search-context.tsx
├── features/            # Feature modules (domain-driven)
│   ├── auth/
│   ├── dashboard/
│   ├── tasks/
│   ├── users/
│   ├── settings/
│   ├── chats/
│   ├── apps/
│   └── errors/
├── hooks/               # Custom React hooks
│   ├── use-mobile.tsx
│   └── use-dialog-state.tsx
├── lib/                 # Core utilities
│   ├── api-client.ts    # Axios HTTP client
│   └── utils.ts         # Helper functions
├── routes/              # TanStack Router routes
│   ├── __root.tsx       # Root layout
│   ├── (auth)/          # Public auth routes
│   ├── _authenticated/  # Protected routes
│   ├── (errors)/        # Error pages
│   └── clerk/           # Clerk integration
├── stores/              # Zustand stores
│   └── authStore.ts
├── utils/               # Utility functions
│   ├── handle-server-error.ts
│   └── show-submitted-data.ts
└── main.tsx             # Application entry point
```

---

## Architectural Patterns

### 1. File-Based Routing (TanStack Router)

**Location:** `src/routes/`

The application uses TanStack Router with file-based routing for automatic code splitting and type-safe navigation.

**Route Groups:**
- `(auth)` - Public authentication routes
- `_authenticated` - Protected routes requiring authentication
- `(errors)` - Error page routes
- `clerk` - Clerk-specific authentication routes

**Key Features:**
- Automatic route tree generation at build time
- Layout nesting with parent routes
- Type-safe navigation with `useNavigate()`
- Intent-based preloading for better performance

**Example Route Structure:**
```
routes/
├── __root.tsx                    # Root layout
├── _authenticated/               # Protected layout
│   ├── route.tsx                 # Auth check wrapper
│   ├── index.tsx                 # Dashboard (/)
│   ├── tasks/
│   │   └── index.tsx             # Tasks page (/tasks)
│   └── users/
│       └── index.tsx             # Users page (/users)
└── (auth)/
    ├── sign-in.tsx               # Login (/sign-in)
    └── sign-up.tsx               # Register (/sign-up)
```

### 2. Component Architecture

**Component Hierarchy:**

```
Root Layout (__root.tsx)
├── NavigationProgress (top loading bar)
├── Outlet (page content)
├── Toaster (notifications)
└── Devtools (development only)

Authenticated Layout (_authenticated/route.tsx)
├── SearchProvider
├── SidebarProvider
├── AppSidebar
│   ├── TeamSwitcher
│   ├── Navigation Groups
│   └── User Menu
└── Content Area
    ├── Header (fixed)
    │   ├── SidebarTrigger
    │   ├── Search
    │   ├── ThemeSwitch
    │   └── ProfileDropdown
    └── Main (scrollable)
        └── Page Content
```

**Component Types:**

1. **Layout Components** (`src/components/layout/`)
   - `authenticated-layout.tsx` - Protected area wrapper
   - `app-sidebar.tsx` - Main navigation sidebar
   - `header.tsx` - Top navigation bar
   - `main.tsx` - Content area wrapper

2. **UI Components** (`src/components/ui/`)
   - 50+ shadcn/ui components
   - Built on Radix UI primitives
   - Fully accessible and customizable
   - Consistent styling with Tailwind CSS

3. **Feature Components** (`src/features/*/components/`)
   - Domain-specific components
   - Data tables, forms, dialogs
   - Feature-level composition

### 3. Feature Module Pattern

**Location:** `src/features/`

Each feature is a self-contained module with its own:
- Components
- API integration
- Data schemas (Zod)
- Context/state management
- Mock data (for development)

**Structure:**
```
features/[feature-name]/
├── components/           # Feature-specific components
├── context/              # Feature state management
├── data/                 # Schemas and mock data
│   ├── schema.ts         # Zod validation schemas
│   └── [feature].ts      # Mock data
├── api/                  # API integration
└── index.tsx             # Main feature page
```

**Example: Tasks Feature**
```
features/tasks/
├── components/
│   ├── data-table.tsx
│   ├── columns.tsx
│   ├── data-table-toolbar.tsx
│   ├── tasks-dialogs.tsx
│   └── ...
├── context/
│   └── tasks-context.tsx  # Dialog state management
├── data/
│   ├── schema.ts          # Task schema (Zod)
│   └── tasks.ts           # Mock task data
└── index.tsx              # Tasks page
```

---

## Component Organization

### UI Component Library (shadcn/ui)

**Location:** `src/components/ui/`

Over 50 accessible, customizable components including:

**Form Components:**
- Input, Textarea, Select, Checkbox, Radio Group, Switch
- Button, Label, Form (with React Hook Form integration)

**Layout Components:**
- Card, Separator, Tabs, Collapsible, Scroll Area
- Sheet, Sidebar

**Data Display:**
- Table, Popover, Tooltip, Avatar
- Badge, Alert, Alert Dialog

**Navigation:**
- Dropdown Menu, Command (search palette)
- Breadcrumb

**Advanced:**
- Calendar, Date Picker, Dialog
- Context Menu, Resizable

### Shared Components

**Location:** `src/components/`

Application-wide components:
- `search.tsx` - Global search command palette
- `theme-switch.tsx` - Dark/light mode toggle
- `profile-dropdown.tsx` - User menu with logout
- `navigation-progress.tsx` - Top loading bar
- `password-input.tsx` - Password field with visibility toggle

### Layout Components

**Location:** `src/components/layout/`

**Key Components:**

1. **authenticated-layout.tsx**
   - Wraps all protected routes
   - Provides sidebar and header
   - Manages responsive layout

2. **app-sidebar.tsx**
   - Main navigation sidebar
   - Collapsible on mobile
   - Team switcher at top
   - User menu at bottom

3. **header.tsx**
   - Fixed/scrollable top bar
   - Search, theme switcher, profile
   - Responsive design

4. **nav-group.tsx & nav-user.tsx**
   - Navigation item components
   - Collapsible menu support
   - Active state indication

---

## Feature Modules

### Authentication Feature

**Location:** `src/features/auth/`

Handles user authentication flows.

**Pages:**
- Sign In (`sign-in/` and `sign-in-2.tsx`)
- Sign Up (`sign-up/`)
- Forgot Password (`forgot-password/`)
- OTP Verification (`otp/`)

**API Integration:** `api/auth-api.ts`
```typescript
authApi.login(email, password)  // Returns token + user
authApi.me()                     // Get current user
```

**Key Features:**
- Form validation with Zod
- Password hashing (SHA-256 client-side)
- Token storage in cookies
- Automatic redirection after login

**Authentication Flow:**
```
1. User submits login form
2. Password hashed with SHA-256
3. POST /auth/login with credentials
4. Response contains JWT token + user data
5. Token stored in cookie (js-cookie)
6. User data stored in Zustand (authStore)
7. Redirect to dashboard
```

### Dashboard Feature

**Location:** `src/features/dashboard/`

Main overview page with analytics.

**Components:**
- `overview.tsx` - Chart visualization with Recharts
- `recent-sales.tsx` - Recent transaction list

**Features:**
- Tab-based interface (Overview, Analytics, Reports, Notifications)
- Revenue charts (Bar, Line, Area)
- Sales metrics
- Responsive card layout

### Tasks Feature

**Location:** `src/features/tasks/`

Task management with advanced data table.

**Schema:** `src/features/tasks/data/schema.ts`
```typescript
Task {
  id: string
  title: string
  status: "todo" | "in-progress" | "done" | "canceled"
  label: "bug" | "feature" | "documentation"
  priority: "low" | "medium" | "high"
}
```

**Components:**
- Data table with TanStack Table
- Sorting, filtering, pagination
- Column visibility toggle
- Row-level actions (edit, delete)
- Bulk operations

**Dialog Management:**
```typescript
TasksContext provides:
- open: DialogType | null
- setOpen: (type: DialogType | null) => void
- currentRow: Task | null
- setCurrentRow: (row: Task | null) => void
```

**Dialogs:**
- Create Task
- Edit Task
- Delete Task (with confirmation)
- Import Tasks (bulk upload)

### Users Feature

**Location:** `src/features/users/`

User management with role-based access control.

**Schema:** `src/features/users/data/schema.ts`
```typescript
User {
  id: string
  firstName: string
  lastName: string
  username: string
  email: string
  phoneNumber: string
  status: "active" | "inactive" | "invited" | "suspended"
  role: "superadmin" | "admin" | "cashier" | "manager"
  createdAt: Date
  updatedAt: Date
}
```

**Features:**
- User listing with data table
- Invite user (email invitation)
- Add/Edit user
- Delete user
- Status management
- Role assignment

### Settings Feature

**Location:** `src/features/settings/`

User preferences and account management.

**Sections:**
- **Profile:** Personal information editing
- **Account:** Language, timezone, account management
- **Appearance:** Theme (light/dark/system) and font selection
- **Notifications:** Email/mobile notification preferences
- **Display:** UI display settings

**Navigation:** Sidebar with active section highlighting

### Error Pages

**Location:** `src/features/errors/`

Styled error pages:
- `general-error.tsx` - Generic error
- `not-found-error.tsx` - 404
- `unauthorized-error.tsx` - 401
- `forbidden.tsx` - 403
- `maintenance-error.tsx` - 503

---

## State Management

### 1. Global State (Zustand)

**Location:** `src/stores/authStore.ts`

Manages authentication state.

```typescript
useAuthStore {
  // State
  user: User | null
  accessToken: string | null

  // Actions
  setUser: (user: User | null) => void
  setAccessToken: (token: string | null) => void
  reset: () => void
}
```

**Persistence:** Access token stored in cookie (`shadcn-auth-token`)

**Usage:**
```typescript
const { user, setUser } = useAuthStore()
```

### 2. Server State (React Query)

**Location:** `src/main.tsx` (QueryClient setup)

Manages async data fetching and caching.

**Configuration:**
```typescript
QueryClient({
  defaultOptions: {
    queries: {
      retry: process.env.NODE_ENV === 'production' ? 3 : 0,
      staleTime: 10 * 1000, // 10 seconds
      refetchOnWindowFocus: false
    }
  },
  queryCache: new QueryCache({
    onError: (error) => {
      // Global error handling
      if (error.response?.status === 401) {
        // Logout and redirect
      }
      toast.error(errorMessage)
    }
  })
})
```

**Usage:**
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['tasks'],
  queryFn: () => fetchTasks()
})

const mutation = useMutation({
  mutationFn: createTask,
  onSuccess: () => {
    queryClient.invalidateQueries(['tasks'])
  }
})
```

### 3. UI State (Context API)

**Contexts:**

1. **ThemeContext** (`src/context/theme-context.tsx`)
   ```typescript
   useTheme() {
     theme: 'light' | 'dark' | 'system'
     setTheme: (theme) => void
   }
   ```
   Persisted in localStorage

2. **FontContext** (`src/context/font-context.tsx`)
   ```typescript
   useFont() {
     font: 'inter' | 'manrope' | 'system'
     setFont: (font) => void
   }
   ```
   Persisted in localStorage

3. **SearchContext** (`src/context/search-context.tsx`)
   Global search state management

### 4. Feature State (Feature Contexts)

Dialog and feature-specific state management.

**Example: TasksContext**
```typescript
TasksContext {
  open: 'create' | 'edit' | 'delete' | 'import' | null
  setOpen: (type: DialogType | null) => void
  currentRow: Task | null
  setCurrentRow: (row: Task | null) => void
}
```

**Usage Pattern:**
```typescript
// Provider in feature page
<TasksProvider>
  <TasksPage />
</TasksProvider>

// Consumer in component
const { setOpen, setCurrentRow } = useTasksContext()

const handleEdit = (task: Task) => {
  setCurrentRow(task)
  setOpen('edit')
}
```

---

## Data Flow

### HTTP Client

**Location:** `src/lib/api-client.ts`

Configured Axios instance with interceptors.

```typescript
axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
request.use((config) => {
  const token = Cookies.get(encodeURIComponent(AUTH_TOKEN_KEY))
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### API Layer

**Pattern:** Feature-based API modules

**Example:** `src/features/auth/api/auth-api.ts`
```typescript
export const authApi = {
  login: async (email: string, password: string) => {
    const hashedPassword = hashPassword(password)
    const response = await apiClient.post('/auth/login', {
      email,
      password: hashedPassword
    })
    return response.data
  },

  me: async () => {
    const response = await apiClient.get('/auth/me')
    return response.data
  }
}
```

### Form Handling

**Pattern:** React Hook Form + Zod + shadcn/ui

**Example Flow:**
```typescript
// 1. Define schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

// 2. Create form
const form = useForm({
  resolver: zodResolver(loginSchema),
  defaultValues: {
    email: '',
    password: ''
  }
})

// 3. Create mutation
const mutation = useMutation({
  mutationFn: authApi.login,
  onSuccess: (data) => {
    setAccessToken(data.token)
    setUser(data.user)
    navigate('/')
  },
  onError: (error) => {
    toast.error('Login failed')
  }
})

// 4. Handle submit
const onSubmit = form.handleSubmit((data) => {
  mutation.mutate(data)
})

// 5. Render with shadcn Form components
<Form {...form}>
  <form onSubmit={onSubmit}>
    <FormField control={form.control} name="email" />
    <Button type="submit" disabled={mutation.isPending}>
      Sign In
    </Button>
  </form>
</Form>
```

### Authentication Flow

```
┌─────────────────┐
│  UserAuthForm   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   useForm +     │
│  zodResolver    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   onSubmit      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  useMutation    │
│ (authApi.login) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Axios Client   │
│ + interceptors  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  POST /login    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Response       │
│  {token, user}  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Store token    │
│  in cookie      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Store user in  │
│  Zustand        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Navigate to /  │
└─────────────────┘
```

### Data Fetching Flow

```
┌─────────────────┐
│   Component     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   useQuery or   │
│   useMutation   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  QueryClient    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Axios Client   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Request        │
│  Interceptor    │
│  (add token)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Endpoint   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Response       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  QueryCache     │
│  Error Handler  │
│  (toast on err) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Cache Update   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Component      │
│  Re-render      │
└─────────────────┘
```

---

## Configuration

### Build Configuration

**vite.config.ts:**
```typescript
export default defineConfig({
  plugins: [
    TanStackRouterVite(), // Route generation + code splitting
    viteReact(),           // JSX + Fast Refresh
    tailwindcss()          // CSS processing
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    strictPort: true
  }
})
```

### TypeScript Configuration

**tsconfig.app.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Environment Variables

**.env.example:**
```
VITE_CLERK_PUBLISHABLE_KEY=
VITE_API_URL=http://localhost:3000/api
```

### Code Quality

**.prettierrc:**
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "printWidth": 80,
  "plugins": [
    "@trivago/prettier-plugin-sort-imports",
    "prettier-plugin-tailwindcss"
  ]
}
```

---

## Technology Stack

### Core Technologies

| Layer | Technology | Version |
|-------|-----------|---------|
| **Runtime** | React | 19.1.0 |
| **Language** | TypeScript | 5.8.3 |
| **Build Tool** | Vite | 7.0.8 |
| **Compiler** | SWC | - |

### Routing & State

| Purpose | Technology | Version |
|---------|-----------|---------|
| **Routing** | TanStack Router | 1.121.34 |
| **Server State** | TanStack Query | 5.81.2 |
| **Global State** | Zustand | 5.0.5 |
| **Form State** | React Hook Form | 7.58.1 |

### UI & Styling

| Purpose | Technology | Version |
|---------|-----------|---------|
| **UI Components** | shadcn/ui (Radix UI) | - |
| **Styling** | Tailwind CSS | 4.1.10 |
| **Icons** | Tabler Icons, Lucide | - |
| **Charts** | Recharts | 3.0.0 |
| **Tables** | TanStack Table | 8.21.3 |

### Data & Validation

| Purpose | Technology | Version |
|---------|-----------|---------|
| **HTTP Client** | Axios | 1.10.0 |
| **Validation** | Zod | 3.25.67 |
| **Date Utilities** | date-fns | 4.1.0 |
| **Cookies** | js-cookie | 3.0.5 |

### Authentication

| Purpose | Technology | Version |
|---------|-----------|---------|
| **Auth (Optional)** | Clerk | 5.32.1 |
| **Custom Auth** | JWT + Cookie storage | - |

### Developer Tools

| Purpose | Technology | Version |
|---------|-----------|---------|
| **Linting** | ESLint + TypeScript ESLint | 9.29.0 |
| **Formatting** | Prettier | 3.6.0 |
| **Unused Code** | Knip | 5.61.2 |
| **Devtools** | React Query + Router Devtools | - |

---

## Development Workflow

### Available Scripts

```bash
# Development
pnpm dev          # Start dev server on port 3000

# Build
pnpm build        # TypeScript check + Vite build

# Code Quality
pnpm lint         # Run ESLint
pnpm format       # Format with Prettier
pnpm format:check # Check formatting

# Analysis
pnpm knip         # Find unused exports
```

### Development Features

- **Hot Module Reload** - Instant updates with React Fast Refresh
- **Route Devtools** - TanStack Router devtools (bottom-right)
- **Query Devtools** - React Query devtools (bottom-left)
- **Type Safety** - Full TypeScript coverage with strict mode
- **Auto Import** - Path aliases (@/*) for clean imports
- **Error Boundaries** - Graceful error handling

---

## Best Practices

### Code Organization

1. **Feature-First Structure** - Group by feature, not file type
2. **Colocation** - Keep related files close together
3. **Clear Naming** - Use descriptive, consistent names
4. **Type Safety** - Leverage TypeScript for safety
5. **Reusability** - Extract common logic to hooks/utilities

### State Management

1. **Right Tool for the Job**
   - Zustand for global app state
   - React Query for server state
   - Context for UI state
   - Feature contexts for dialog/modal state

2. **Minimize State** - Derive when possible
3. **Single Source of Truth** - Avoid state duplication
4. **Immutability** - Never mutate state directly

### Component Design

1. **Single Responsibility** - Components do one thing well
2. **Composition** - Build complex UIs from simple parts
3. **Prop Types** - Always define TypeScript interfaces
4. **Accessibility** - Use semantic HTML and ARIA attributes
5. **Responsive** - Mobile-first design approach

### API Integration

1. **Centralized Client** - Single Axios instance
2. **Error Handling** - Global error handling via QueryCache
3. **Loading States** - Show feedback during operations
4. **Optimistic Updates** - Update UI before server confirms
5. **Retry Logic** - Automatic retry for failed requests

---

## Performance Considerations

### Code Splitting

- **Route-based splitting** - Automatic with TanStack Router
- **Lazy loading** - Use React.lazy() for heavy components
- **Tree shaking** - Vite automatically removes unused code

### Caching Strategy

- **React Query cache** - Reduces unnecessary API calls
- **Stale-while-revalidate** - Show cached data while fetching fresh
- **Cache invalidation** - Invalidate on mutations

### Bundle Optimization

- **Icon tree shaking** - Configured in vite.config.ts
- **CSS purging** - Tailwind removes unused styles
- **Asset optimization** - Vite handles image/font optimization

---

## Security

### Authentication

- **Token-based** - JWT stored in httpOnly cookies (recommended)
- **Auto-logout** - On 401 error or token expiration
- **Password hashing** - Client-side SHA-256 (server should also hash)

### API Security

- **CORS** - Configure allowed origins
- **Request signing** - Add token to Authorization header
- **Error messages** - Don't leak sensitive information

### XSS Protection

- **React escaping** - React escapes by default
- **DOMPurify** - Sanitize user input if using dangerouslySetInnerHTML
- **CSP headers** - Configure Content Security Policy

---

## Testing Strategy

### Recommended Testing Approach

1. **Unit Tests** - Test utilities, hooks, and pure functions
2. **Component Tests** - Test component behavior and rendering
3. **Integration Tests** - Test feature flows
4. **E2E Tests** - Test critical user journeys

### Testing Tools (to be added)

- **Vitest** - Fast unit test runner
- **React Testing Library** - Component testing
- **MSW** - API mocking
- **Playwright** - E2E testing

---

## Deployment

### Production Build

```bash
pnpm build
```

**Output:** `dist/` directory with optimized assets

### Environment Configuration

1. Set environment variables:
   - `VITE_API_URL` - Backend API endpoint
   - `VITE_CLERK_PUBLISHABLE_KEY` - Clerk public key (if using)

2. Configure CORS on backend to allow frontend origin

3. Serve static files with:
   - Nginx (see `nginx.conf`)
   - Docker (see `Dockerfile`)
   - CDN (Netlify, Vercel, etc.)

### Docker Deployment

```bash
# Build image
docker build -t vkhangstack-blog-backoffice .

# Run container
docker-compose up -d
```

---

## Future Enhancements

### Planned Features

- [ ] Real API integration (replace mock data)
- [ ] Unit and E2E tests
- [ ] Internationalization (i18n)
- [ ] WebSocket support for real-time updates
- [ ] Advanced analytics dashboard
- [ ] File upload with progress
- [ ] Export to CSV/PDF
- [ ] Advanced filtering and search

### Performance Improvements

- [ ] Implement virtual scrolling for large lists
- [ ] Add service worker for offline support
- [ ] Optimize images with next-gen formats (WebP, AVIF)
- [ ] Implement request debouncing for search

### Developer Experience

- [ ] Storybook for component documentation
- [ ] Component playground
- [ ] E2E test coverage
- [ ] CI/CD pipeline

---

## Resources

### Documentation Links

- [React](https://react.dev)
- [TypeScript](https://www.typescriptlang.org/docs)
- [Vite](https://vitejs.dev)
- [TanStack Router](https://tanstack.com/router/latest)
- [TanStack Query](https://tanstack.com/query/latest)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Radix UI](https://www.radix-ui.com)
- [Zustand](https://github.com/pmndrs/zustand)
- [React Hook Form](https://react-hook-form.com)
- [Zod](https://zod.dev)

### Community

- [GitHub Repository](https://github.com/vkhangstack/vkhangstack-blog-backoffice)
- [Issue Tracker](https://github.com/vkhangstack/vkhangstack-blog-backoffice/issues)
- [Discussions](https://github.com/vkhangstack/vkhangstack-blog-backoffice/discussions)

---

## License

This project is licensed under the [MIT License](./LICENSE).

---

## Credits

**Author:** [@vkhangstack](https://github.com/vkhangstack)

**Built with:**
- [shadcn/ui](https://ui.shadcn.com) - UI component library
- [TanStack](https://tanstack.com) - Routing and data fetching
- Open source community

---

*Last updated: January 2026*
