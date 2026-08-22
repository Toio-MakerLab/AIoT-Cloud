# Using useMutation

`useMutation` is for creating, updating, or deleting data. It doesn't cache or auto-refetch.

## Basic Usage

```tsx
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

function CreateUserForm() {
  const mutation = useMutation({
    mutationFn: (userData) => 
      apiClient.post('/users', userData).then(res => res.data),
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    mutation.mutate({ name: 'John', email: 'john@example.com' })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" placeholder="Name" />
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Creating...' : 'Create User'}
      </button>
      {mutation.isError && <div>Error: {mutation.error.message}</div>}
      {mutation.isSuccess && <div>User created!</div>}
    </form>
  )
}
```

## Returned Values

```tsx
const {
  mutate,           // Function to trigger mutation
  mutateAsync,      // Returns promise
  data,             // Result data
  status,           // 'idle' | 'pending' | 'error' | 'success'
  isPending,        // true while mutation is in progress
  isError,          // true if mutation failed
  isSuccess,        // true if mutation succeeded
  error,            // Error object if failed
  reset,            // Clear mutation state
} = useMutation({
  mutationFn: (data) => apiClient.post('/endpoint', data).then(res => res.data)
})
```

## With Callbacks

```tsx
useMutation({
  mutationFn: (userData) => 
    apiClient.post('/users', userData).then(res => res.data),
  
  onSuccess: (data) => {
    console.log('Success:', data)
    // Refresh list, show toast, etc.
  },
  
  onError: (error) => {
    console.log('Error:', error)
  },
  
  onMutate: (variables) => {
    // Called before mutation starts
    // Good for optimistic updates
  },
  
  onSettled: (data, error) => {
    // Called when mutation finishes (success or error)
  }
})
```

## Update Operations

### POST (Create)
```tsx
const createMutation = useMutation({
  mutationFn: (userData) => 
    apiClient.post('/users', userData).then(res => res.data)
})

createMutation.mutate({ name: 'John', email: 'john@example.com' })
```

### PUT (Replace)
```tsx
const updateMutation = useMutation({
  mutationFn: ({ id, userData }) => 
    apiClient.put(`/users/${id}`, userData).then(res => res.data)
})

updateMutation.mutate({ id: '1', userData: { name: 'Jane' } })
```

### PATCH (Partial Update)
```tsx
const patchMutation = useMutation({
  mutationFn: ({ id, updates }) => 
    apiClient.patch(`/users/${id}`, updates).then(res => res.data)
})

patchMutation.mutate({ id: '1', updates: { name: 'Jane' } })
```

### DELETE
```tsx
const deleteMutation = useMutation({
  mutationFn: (userId) => 
    apiClient.delete(`/users/${userId}`)
})

deleteMutation.mutate('1')
```

## With Cache Invalidation

After mutation, refresh the cached data:

```tsx
import { useQueryClient } from '@tanstack/react-query'

function CreateUser() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (userData) => 
      apiClient.post('/users', userData).then(res => res.data),
    
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: ['users'] })
    }
  })

  return <button onClick={() => mutation.mutate({ name: 'John' })}>
    Create
  </button>
}
```

## Optimistic Updates

Update UI before server responds:

```tsx
function EditUser({ userId, currentName }: { userId: string, currentName: string }) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (newName) => 
      apiClient.patch(`/users/${userId}`, { name: newName }).then(res => res.data),
    
    onMutate: async (newName) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey: ['user', userId] })

      // Save old data for rollback
      const previousData = queryClient.getQueryData(['user', userId])

      // Update cache immediately
      queryClient.setQueryData(['user', userId], (old) => ({
        ...old,
        name: newName
      }))

      return { previousData }
    },
    
    onError: (err, newName, context) => {
      // Rollback on error
      queryClient.setQueryData(['user', userId], context?.previousData)
    },
    
    onSuccess: () => {
      // Confirm with server data
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
    }
  })

  return (
    <button onClick={() => mutation.mutate('New Name')}>
      Update Name
    </button>
  )
}
```

## Multiple Mutations

```tsx
function UserForm() {
  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/users', data).then(res => res.data)
  })

  const deleteMutation = useMutation({
    mutationFn: (userId) => apiClient.delete(`/users/${userId}`)
  })

  return (
    <>
      <button onClick={() => createMutation.mutate({ name: 'John' })}>
        Create
      </button>
      <button onClick={() => deleteMutation.mutate('1')}>
        Delete
      </button>
      {createMutation.isPending && <div>Creating...</div>}
      {deleteMutation.isPending && <div>Deleting...</div>}
    </>
  )
}
```

## With TypeScript

```tsx
interface User {
  id: string
  name: string
  email: string
}

interface CreateUserInput {
  name: string
  email: string
}

function CreateUser() {
  const mutation = useMutation<User, Error, CreateUserInput>({
    mutationFn: (userData) => 
      apiClient.post('/users', userData).then(res => res.data)
  })

  return <button onClick={() => mutation.mutate({ name: 'John', email: 'john@example.com' })}>
    Create
  </button>
}
```

## Common Options

```tsx
useMutation({
  mutationFn: (data) => apiClient.post('/endpoint', data).then(res => res.data),
  
  // Number of retries on failure
  retry: 1,
  
  // Delay between retries (ms)
  retryDelay: 1000,
  
  // Max number of inflight mutations
  maxMutations: 1,
  
  // Persist mutation across page reloads
  persist: true,
})
```
