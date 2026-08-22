# API & Data Fetching Documentation

Complete guide for using TanStack Query (React Query) and making API calls in this project.

## Quick Start

```tsx
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

function MyComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.get('/users').then(res => res.data)
  })
}
```

## Documentation

- **[Setup & Configuration](./setup.md)** - QueryClient setup and configuration
- **[Using useQuery](./use-query.md)** - Fetching data with useQuery
- **[Using useMutation](./use-mutation.md)** - Creating, updating, deleting data with useMutation
- **[API Client Integration](./api-client.md)** - How the axios client works
- **[Best Practices](./best-practices.md)** - Patterns and recommendations
- **[Examples](./examples/)** - Real-world code examples

## Key Concepts

| Concept | Use Case |
|---------|----------|
| **useQuery** | Fetch and cache data, auto-refetch |
| **useMutation** | Create/update/delete data, no auto-refetch |
| **queryKey** | Unique identifier for caching |
| **useQueryClient** | Access cache, invalidate queries, refetch |
| **Interceptors** | Auto-inject auth tokens, error handling |

## Project Setup

The project uses:
- **Axios** (`src/lib/api-client.ts`) - HTTP client with auth interceptor
- **TanStack Query** - Data fetching and caching
- **Cookies** - Token storage (js-cookie)
- **Base URL** - Configured via `VITE_API_URL` env var (default: `http://localhost:3000/api`)

## Common Tasks

### Fetch Data
See [Using useQuery](./use-query.md)

### Create/Update/Delete
See [Using useMutation](./use-mutation.md)

### Invalidate Cache After Changes
See [Best Practices - Cache Invalidation](./best-practices.md#cache-invalidation)

### Handle Errors
See [Best Practices - Error Handling](./best-practices.md#error-handling)
