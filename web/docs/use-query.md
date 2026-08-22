# Using useQuery

`useQuery` is for fetching and caching data. It automatically handles loading states, errors, and caching.

## Basic Usage

```tsx
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

function Users() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.get('/users').then(res => res.data)
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return (
    <ul>
      {data?.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

## With Parameters

```tsx
function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user', userId],  // Include ID in key for cache isolation
    queryFn: () => apiClient.get(`/users/${userId}`).then(res => res.data),
    enabled: !!userId  // Don't run query if userId is falsy
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error</div>
  
  return <div>{data?.name}</div>
}
```

## Returned Values

```tsx
const {
  data,           // The fetched data
  status,         // 'pending' | 'error' | 'success'
  isLoading,      // true while first fetch is in progress
  isFetching,     // true while ANY fetch is in progress (refetch, etc)
  error,          // Error object if fetch failed
  isError,        // true if query errored
  isPending,      // true if loading and no cached data
  dataUpdatedAt,  // Timestamp of last successful fetch
} = useQuery({
  queryKey: ['data'],
  queryFn: () => apiClient.get('/data').then(res => res.data)
})
```

## Common Options

```tsx
useQuery({
  queryKey: ['users'],
  queryFn: () => apiClient.get('/users').then(res => res.data),
  
  // Only run if condition is true
  enabled: true,
  
  // How long to consider data fresh (ms)
  staleTime: 5 * 60 * 1000,
  
  // How long to keep unused data in cache (ms)
  gcTime: 10 * 60 * 1000,
  
  // Number of retries on failure
  retry: 1,
  
  // Refetch when window regains focus
  refetchOnWindowFocus: false,
  
  // Custom error handling
  throwOnError: false,
})
```

## Dependent Queries

Run queries in sequence:

```tsx
function UserPosts({ userId }: { userId: string }) {
  // Fetch user first
  const userQuery = useQuery({
    queryKey: ['user', userId],
    queryFn: () => apiClient.get(`/users/${userId}`).then(res => res.data)
  })

  // Fetch posts only after user is loaded
  const postsQuery = useQuery({
    queryKey: ['posts', userId],
    queryFn: () => apiClient.get(`/users/${userId}/posts`).then(res => res.data),
    enabled: !!userQuery.data  // Only run after user loads
  })

  if (userQuery.isLoading) return <div>Loading user...</div>
  if (postsQuery.isLoading) return <div>Loading posts...</div>
  
  return (
    <div>
      <h1>{userQuery.data?.name}</h1>
      <ul>
        {postsQuery.data?.map(post => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  )
}
```

## Parallel Queries

```tsx
function Dashboard() {
  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.get('/users').then(res => res.data)
  })

  const statsQuery = useQuery({
    queryKey: ['stats'],
    queryFn: () => apiClient.get('/stats').then(res => res.data)
  })

  const isLoading = usersQuery.isLoading || statsQuery.isLoading

  if (isLoading) return <div>Loading...</div>
  
  return (
    <div>
      <Users data={usersQuery.data} />
      <Stats data={statsQuery.data} />
    </div>
  )
}
```

## Multiple Queries with `useQueries`

For dynamic numbers of queries:

```tsx
import { useQueries } from '@tanstack/react-query'

function UsersList({ userIds }: { userIds: string[] }) {
  const queries = useQueries({
    queries: userIds.map(id => ({
      queryKey: ['user', id],
      queryFn: () => apiClient.get(`/users/${id}`).then(res => res.data)
    }))
  })

  const isLoading = queries.some(q => q.isLoading)

  if (isLoading) return <div>Loading...</div>
  
  return (
    <ul>
      {queries.map(query => (
        <li key={query.data?.id}>{query.data?.name}</li>
      ))}
    </ul>
  )
}
```

## Select/Transform Data

```tsx
function UserName({ userId }: { userId: string }) {
  const { data: userName } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => apiClient.get(`/users/${userId}`).then(res => res.data),
    select: (data) => data.name  // Only return name
  })

  return <div>{userName}</div>
}
```

## Infinite Queries

For pagination or "load more":

```tsx
import { useInfiniteQuery } from '@tanstack/react-query'

function InfiniteUsersList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching
  } = useInfiniteQuery({
    queryKey: ['users'],
    queryFn: ({ pageParam = 1 }) => 
      apiClient.get(`/users?page=${pageParam}`).then(res => res.data),
    getNextPageParam: (lastPage) => lastPage.nextPage
  })

  return (
    <>
      {data?.pages.map(page => (
        page.users.map(user => <div key={user.id}>{user.name}</div>)
      ))}
      <button 
        onClick={() => fetchNextPage()} 
        disabled={!hasNextPage || isFetching}
      >
        Load More
      </button>
    </>
  )
}
```
