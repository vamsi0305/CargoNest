import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { useAuthStore } from '../../features/auth/auth-store'
import { getVisiblePageLinks } from '../../features/forms/page-links'

export function PlainLayout() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const visibleLinks = getVisiblePageLinks(user)

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="plain-root">
      <div className="top-nav-shell">
        <nav className="top-nav" aria-label="Form pages">
          {visibleLinks.map((page) => (
            <NavLink
              key={page.to}
              to={page.to}
              className={({ isActive }) =>
                `top-nav-link ${isActive ? 'top-nav-link--active' : ''}`
              }
            >
              {page.label}
            </NavLink>
          ))}
        </nav>
        <div className="top-session-strip">
          <span className="top-session-user">{user?.username ?? 'User'}</span>
          <button type="button" className="top-nav-logout" onClick={() => void handleLogout()}>
            LOGOUT
          </button>
        </div>
      </div>

      <Outlet />
    </div>
  )
}
