import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { PropsWithChildren } from 'react'

import { useAuthStore } from '../features/auth/auth-store'
import { installGlobalErrorHandlers, reportAsyncError } from '../lib/monitoring'

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      reportAsyncError('react_query', error)
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      reportAsyncError('react_query_mutation', error)
    },
  }),
})

function AuthBootstrap({ children }: PropsWithChildren) {
  const initialize = useAuthStore((state) => state.initialize)

  useEffect(() => {
    installGlobalErrorHandlers()
    void initialize()
  }, [initialize])

  return <>{children}</>
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap>{children}</AuthBootstrap>
    </QueryClientProvider>
  )
}
