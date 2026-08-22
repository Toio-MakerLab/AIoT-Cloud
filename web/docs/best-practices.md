# Best Practices

## Cache Invalidation

After mutations, refresh related data:

```tsx
import { useQueryClient } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

function CreatePost() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (postData) => 
      apiClient.post('/posts', postData).then(res => res.data),
    
    onSuccess: (newPost) => {
      // Invalidate list - will refetch
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      
      // OR set data directly without refetch
      queryClient.setQueryData(['posts'], (old) => [...old, newPost])
      
      // OR invalidate specific page
      queryClient.invalidateQueries({ queryKey: ['posts', { page: 1 }] })
    }
  })

  return <button onClick={() => mutation.mutate({ title: 'New' })}>
    Create
  </button>
}
```

## Query Keys

Use consistent, hierarchical keys for cache management:

```tsx
// ✅ Good - hierarchical, easily invalidated
const userQueryKey = (userId) => ['user', userId]
const usersQueryKey = () => ['users']
const userPostsQueryKey = (userId) => ['user', userId, 'posts']
const postsQueryKey = () => ['posts']

// Usage:
useQuery({
  queryKey: userQueryKey('123'),
  queryFn: () => apiClient.get('/users/123').then(res => res.data)
})

// Invalidate all user-related queries:
queryClient.invalidateQueries({ queryKey: ['user'] })

// Invalidate only this user:
queryClient.invalidateQueries({ queryKey: ['user', '123'] })
```

## Error Handling

```tsx
import { AxiosError } from 'axios'

function UserForm() {
  const [errorMessage, setErrorMessage] = useState('')

  const mutation = useMutation({
    mutationFn: (data) => apiClient.post('/users', data).then(res => res.data),
    
    onError: (error: AxiosError) => {
      if (error.response?.status === 400) {
        setErrorMessage('Invalid input')
      } else if (error.response?.status === 409) {
        setErrorMessage('User already exists')
      } else {
        setErrorMessage('Something went wrong')
      }
    }
  })

  return (
    <>
      {errorMessage && <div className="error">{errorMessage}</div>}
      <button onClick={() => mutation.mutate({ email: 'test@test.com' })}>
        Submit
      </button>
    </>
  )
}
```

## Conditional Queries

Only fetch when needed:

```tsx
function UserProfile({ userId }: { userId?: string }) {
  // Only fetch if userId is provided
  const { data } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => apiClient.get(`/users/${userId}`).then(res => res.data),
    enabled: !!userId  // Important!
  })

  if (!userId) return <div>No user selected</div>
  return <div>{data?.name}</div>
}
```

## Loading States

Use appropriate loading states:

```tsx
function UserList() {
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.get('/users').then(res => res.data)
  })

  return (
    <>
      {isLoading && <div>Initial load...</div>}
      {isFetching && !isLoading && <div>Updating...</div>}
      
      <ul>
        {data?.map(user => <li key={user.id}>{user.name}</li>)}
      </ul>
    </>
  )
}
```

- **`isLoading`** - First load (no cached data)
- **`isFetching`** - Any fetch in progress (including refetches)

## Stale Time vs GC Time

```tsx
useQuery({
  queryKey: ['users'],
  queryFn: () => apiClient.get('/users').then(res => res.data),
  
  // staleTime: how long until data is "stale" (needs refetch)
  staleTime: 5 * 60 * 1000,  // 5 minutes - data considered fresh
  
  // gcTime: how long to keep stale data in cache
  gcTime: 10 * 60 * 1000,  // 10 minutes - then discard
})
```

Timeline:
```
0s - 5min: Fresh (no refetch)
5min - 10min: Stale but cached (refetch if accessed)
After 10min: Removed from cache
```

## Pagination

```tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

function PaginatedUsers() {
  const [page, setPage] = useState(1)
  const pageSize = 10

  const { data, isLoading } = useQuery({
    queryKey: ['users', { page, pageSize }],  // Include pagination in key
    queryFn: () => 
      apiClient.get('/users', {
        params: { page, limit: pageSize }
      }).then(res => res.data)
  })

  return (
    <>
      <ul>
        {data?.users.map(user => <li key={user.id}>{user.name}</li>)}
      </ul>
      <button 
        onClick={() => setPage(p => p - 1)} 
        disabled={page === 1}
      >
        Previous
      </button>
      <span>Page {page}</span>
      <button 
        onClick={() => setPage(p => p + 1)} 
        disabled={!data?.hasMore}
      >
        Next
      </button>
    </>
  )
}
```

## Debounced Search

```tsx
import { useDeferredValue, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

function SearchUsers() {
  const [searchInput, setSearchInput] = useState('')
  const search = useDeferredValue(searchInput)

  const { data } = useQuery({
    queryKey: ['users', search],
    queryFn: () => 
      apiClient.get('/users/search', { 
        params: { q: search } 
      }).then(res => res.data),
    enabled: search.length > 2  // Only search if 3+ chars
  })

  return (
    <>
      <input 
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        placeholder="Search users..."
      />
      <ul>
        {data?.map(user => <li key={user.id}>{user.name}</li>)}
      </ul>
    </>
  )
}
```

## Prevent Multiple Submissions

```tsx
function SubmitForm() {
  const mutation = useMutation({
    mutationFn: (data) => apiClient.post('/submit', data).then(res => res.data)
  })

  return (
    <button 
      onClick={() => mutation.mutate({ name: 'test' })}
      disabled={mutation.isPending}  // Disable while pending
    >
      {mutation.isPending ? 'Submitting...' : 'Submit'}
    </button>
  )
}
```

## Extract Query Logic to Hooks

Keep components clean:

```tsx
// hooks/useUsers.ts
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.get('/users').then(res => res.data)
  })
}

// components/UserList.tsx
import { useUsers } from '@/hooks/useUsers'

export function UserList() {
  const { data, isLoading, error } = useUsers()
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error</div>
  
  return (
    <ul>
      {data?.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  )
}
```

## Synchronized Mutations

Wait for multiple operations:

```tsx
function UserSettings() {
  const saveNameMutation = useMutation({
    mutationFn: (name) => apiClient.patch('/user/name', { name })
  })

  const saveEmailMutation = useMutation({
    mutationFn: (email) => apiClient.patch('/user/email', { email })
  })

  const isSaving = saveNameMutation.isPending || saveEmailMutation.isPending

  return (
    <>
      <button onClick={() => saveNameMutation.mutate('John')} disabled={isSaving}>
        Save Name
      </button>
      <button onClick={() => saveEmailMutation.mutate('john@example.com')} disabled={isSaving}>
        Save Email
      </button>
      {isSaving && <div>Saving...</div>}
    </>
  )
}
```

## Reset Mutation State

```tsx
function Form() {
  const mutation = useMutation({
    mutationFn: (data) => apiClient.post('/submit', data).then(res => res.data)
  })

  const handleClose = () => {
    mutation.reset()  // Clear error/success state
  }

  return (
    <dialog open={true}>
      {mutation.isSuccess && <div>Submitted!</div>}
      {mutation.isError && <div>{mutation.error.message}</div>}
      <button onClick={handleClose}>Close</button>
    </dialog>
  )
}
```
