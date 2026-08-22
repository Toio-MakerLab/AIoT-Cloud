# API Client Integration

The project uses Axios for HTTP requests with automatic authentication and configuration.

## Overview

Located at `src/lib/api-client.ts`:

```tsx
import axios from 'axios'
import Cookies from 'js-cookie'
import { ACCESS_TOKEN } from '@/stores/authStore'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Auto-inject Bearer token from cookies
apiClient.interceptors.request.use((config) => {
  const token = Cookies.get(ACCESS_TOKEN)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

## Features

✅ **Automatic Auth** - Injects Bearer token from cookies into all requests  
✅ **Base URL** - Configured via `VITE_API_URL` environment variable  
✅ **JSON by Default** - Sets Content-Type to application/json  
✅ **Typescript Support** - Full type inference with axios  

## Usage with Queries

### GET Request
```tsx
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

const { data } = useQuery({
  queryKey: ['users'],
  queryFn: () => apiClient.get('/users').then(res => res.data)
})
```

### Relative Path
```tsx
// Full URL: http://localhost:3000/api/users
apiClient.get('/users')

// Full URL: http://localhost:3000/api/users/1
apiClient.get('/users/1')
```

### With Query Parameters
```tsx
// URL: /users?page=1&limit=10
apiClient.get('/users', {
  params: {
    page: 1,
    limit: 10
  }
})

// In useQuery:
const { data } = useQuery({
  queryKey: ['users', { page: 1, limit: 10 }],
  queryFn: ({ signal }) => 
    apiClient.get('/users', {
      params: { page: 1, limit: 10 },
      signal
    }).then(res => res.data)
})
```

## Usage with Mutations

### POST (Create)
```tsx
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

const mutation = useMutation({
  mutationFn: (userData) => 
    apiClient.post('/users', userData).then(res => res.data)
})

// Usage:
mutation.mutate({ name: 'John', email: 'john@example.com' })
```

### PATCH (Update)
```tsx
const mutation = useMutation({
  mutationFn: ({ id, updates }) => 
    apiClient.patch(`/users/${id}`, updates).then(res => res.data)
})

mutation.mutate({ 
  id: '1', 
  updates: { name: 'Jane' } 
})
```

### DELETE
```tsx
const mutation = useMutation({
  mutationFn: (userId) => 
    apiClient.delete(`/users/${userId}`).then(res => res.data)
})

mutation.mutate('1')
```

## Request/Response Interceptors

The client automatically handles:

### Request Interceptor
- Injects `Authorization: Bearer <token>` header
- Only if token exists in cookies

```tsx
apiClient.interceptors.request.use((config) => {
  const token = Cookies.get(ACCESS_TOKEN)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

## Adding Custom Interceptors

For error handling or logging, add to `src/lib/api-client.ts`:

```tsx
// Error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Logging
apiClient.interceptors.response.use((response) => {
  console.log(`[API] ${response.config.method?.toUpperCase()} ${response.config.url}`)
  return response
})
```

## Environment Configuration

### Development
```bash
# .env.local
VITE_API_URL=http://localhost:3000/api
```

### Production
```bash
# .env.production
VITE_API_URL=https://api.example.com
```

Default: `http://localhost:3000/api` (if env var not set)

## Axios Methods

All standard axios methods are available:

| Method | Use | Example |
|--------|-----|---------|
| `get(url)` | Fetch data | `apiClient.get('/users')` |
| `post(url, data)` | Create | `apiClient.post('/users', data)` |
| `put(url, data)` | Replace | `apiClient.put('/users/1', data)` |
| `patch(url, data)` | Partial update | `apiClient.patch('/users/1', data)` |
| `delete(url)` | Delete | `apiClient.delete('/users/1')` |
| `head(url)` | Get headers | `apiClient.head('/users')` |

## Response Structure

```tsx
const response = await apiClient.get('/users')

response.data        // { id: 1, name: 'John' }
response.status      // 200
response.statusText  // 'OK'
response.headers     // { 'content-type': 'application/json', ... }
response.config      // Original request config
```

## Error Handling

```tsx
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { AxiosError } from 'axios'

const { data, error } = useQuery({
  queryKey: ['users'],
  queryFn: () => apiClient.get('/users').then(res => res.data)
})

if (error && error instanceof AxiosError) {
  console.log('Status:', error.response?.status)
  console.log('Message:', error.response?.data?.message)
}
```

## TypeScript Typing

```tsx
interface User {
  id: string
  name: string
  email: string
}

const { data } = useQuery<User[]>({
  queryKey: ['users'],
  queryFn: () => apiClient.get('/users').then(res => res.data)
})

// data is now typed as User[]
```

## Cancellation (for cleanup)

With React Query, pass signal for automatic cancellation:

```tsx
const { data } = useQuery({
  queryKey: ['users'],
  queryFn: ({ signal }) => 
    apiClient.get('/users', { signal }).then(res => res.data)
})
```
