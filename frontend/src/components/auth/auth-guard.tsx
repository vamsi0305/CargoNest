import type { PropsWithChildren } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuthStore } from '../../features/auth/auth-store'

export function AuthGuard({ children }: PropsWithChildren) {
  const status = useAuthStore((state) => state.status)

  if (status === 'loading') {
    return <main className="page-canvas"><section className="form-sheet">Loading session...</section></main>
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
