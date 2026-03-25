import { NavLink, Outlet } from 'react-router-dom'

import { pageLinks } from '../../features/forms/page-links'

export function PlainLayout() {
  return (
    <div className="plain-root">
      <div className="top-nav-shell">
        <nav className="top-nav" aria-label="Form pages">
          {pageLinks.map((page) => (
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
      </div>

      <Outlet />
    </div>
  )
}
