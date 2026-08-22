# Setup & Configuration

## QueryClient Setup

### In `main.tsx`

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes (cache time)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    }
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
)
```

## Configuration Options

### Query Options

| Option | Default | Description |
|--------|---------|-------------|
| `staleTime` | 0 | Time before data is considered stale |
| `gcTime` | 5 min | How long unused data stays in cache |
| `retry` | 3 | Number of retries on failure |
| `retryDelay` | exponential | Delay between retries |
| `refetchOnWindowFocus` | true | Refetch when window regains focus |
| `refetchOnMount` | true | Refetch when component mounts |
| `refetchOnReconnect` | true | Refetch when reconnecting to network |

### Environment Variables

Create `.env` file in project root:

```env
VITE_API_URL=http://localhost:3000/api
```

The API client automatically uses this URL as base URL.

## API Client Configuration

The API client is located at `src/lib/api-client.ts`:

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

// Auto-inject auth token
apiClient.interceptors.request.use((config) => {
  const token = Cookies.get(ACCESS_TOKEN)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### Features

- ✅ Auto-includes auth token from cookies
- ✅ Configurable base URL via environment
- ✅ Default JSON content-type
- ✅ Returns axios AxiosInstance

## DevTools (Optional)

For debugging queries in development:

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

Then install:

```bash
npm install -D @tanstack/react-query-devtools
```
