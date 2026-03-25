import {
  Bell,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Package2,
  ShipWheel,
  Truck,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import { cn } from '../../lib/cn'
import { useUIStore } from '../../store/ui-store'

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/purchase-orders', label: 'Purchase Orders', icon: Package2 },
  { to: '/shipments', label: 'Shipments', icon: ShipWheel },
  { to: '/vehicles', label: 'Vehicles', icon: Truck },
]

export function AppShell() {
  const { isSidebarCollapsed, toggleSidebar } = useUIStore()

  return (
    <div className="shell">
      <aside className={cn('sidebar', isSidebarCollapsed && 'sidebar--collapsed')}>
        <div className="sidebar__brand">
          <div className="sidebar__brand-mark">CN</div>
          {!isSidebarCollapsed && (
            <div>
              <strong>CargoNest</strong>
              <p>Export Command Center</p>
            </div>
          )}
        </div>

        <button className="sidebar__toggle" onClick={toggleSidebar} type="button">
          {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        <nav className="sidebar__nav">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn('sidebar__link', isActive && 'sidebar__link--active')}
            >
              <Icon size={18} />
              {!isSidebarCollapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Frozen seafood export operations</p>
            <h1>Operational visibility from PO to shipment</h1>
          </div>

          <div className="topbar__actions">
            <button className="ghost-button" type="button" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <div className="profile-chip">
              <span>VS</span>
              <div>
                <strong>Vamsi</strong>
                <p>Admin</p>
              </div>
            </div>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
