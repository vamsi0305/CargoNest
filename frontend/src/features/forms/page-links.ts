import type { AuthUser } from '../auth/types'

export type PageLink = {
  to: string
  label: string
  accessKey?: string
  adminOnly?: boolean
}

export const pageLinks: PageLink[] = [
  { to: '/overview', label: 'OVERVIEW', accessKey: 'overview' },
  { to: '/purchase-order', label: 'PURCHASE ORDER', accessKey: 'purchase_order' },
  { to: '/stock-reglazing', label: 'STOCK - REGLAZING', accessKey: 'stock_reglazing' },
  { to: '/stock-repacking', label: 'STOCK - REPACKING', accessKey: 'stock_repacking' },
  { to: '/stock-sampling', label: 'STOCK - SAMPLING', accessKey: 'stock_sampling' },
  { to: '/stock-inspection', label: 'STOCK - INSPECTION', accessKey: 'stock_inspection' },
  { to: '/stock-pht', label: 'STOCK - PHT', accessKey: 'stock_pht' },
  { to: '/shipment', label: 'SHIPMENT', accessKey: 'shipment' },
  { to: '/vehicle-details', label: 'VEHICLE DETAILS', accessKey: 'vehicle_details' },
  { to: '/admin-dashboard', label: 'ADMIN DASHBOARD', adminOnly: true },
  { to: '/security', label: 'SECURITY' },
]

export function isAdmin(user: AuthUser | null) {
  return user?.role_name === 'admin'
}

export function hasAccess(user: AuthUser | null, accessKey?: string, adminOnly = false) {
  if (!user) {
    return false
  }

  if (isAdmin(user)) {
    return true
  }

  if (adminOnly) {
    return false
  }

  if (!accessKey) {
    return true
  }

  return user.allowed_forms.includes(accessKey)
}

export function getVisiblePageLinks(user: AuthUser | null) {
  return pageLinks.filter((page) => hasAccess(user, page.accessKey, page.adminOnly))
}

export function getDefaultRoute(user: AuthUser | null) {
  if (isAdmin(user)) {
    return '/admin-dashboard'
  }

  const firstPage = getVisiblePageLinks(user)[0]
  return firstPage?.to ?? '/login'
}

