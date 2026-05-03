import type { PropsWithChildren } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuthStore } from '../../features/auth/auth-store'
import { getDefaultRoute, hasAccess } from '../../features/forms/page-links'

type RequireAccessProps = PropsWithChildren<{
  accessKey?: string
  adminOnly?: boolean
}>

export function RequireAccess({ accessKey, adminOnly = false, children }: RequireAccessProps) {
  const user = useAuthStore((state) => state.user)
  const status = useAuthStore((state) => state.status)

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace />
  }

  if (!hasAccess(user, accessKey, adminOnly)) {
    return <Navigate to={getDefaultRoute(user)} replace />
  }

  return <>{children}</>
}
