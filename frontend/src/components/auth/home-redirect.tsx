import { Navigate } from 'react-router-dom'

import { useAuthStore } from '../../features/auth/auth-store'
import { getDefaultRoute } from '../../features/forms/page-links'

export function HomeRedirect() {
  const user = useAuthStore((state) => state.user)
  return <Navigate to={getDefaultRoute(user)} replace />
}
