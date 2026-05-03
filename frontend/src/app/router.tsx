import { createBrowserRouter } from 'react-router-dom'

import { AuthGuard } from '../components/auth/auth-guard'
import { HomeRedirect } from '../components/auth/home-redirect'
import { RequireAccess } from '../components/auth/require-access'
import { PlainLayout } from '../components/layout/plain-layout'
import { AdminDashboardPage } from '../features/auth/admin-dashboard-page'
import { LoginPage } from '../features/auth/login-page'
import { SecurityPage } from '../features/auth/security-page'
import { OverviewPage } from '../features/forms/overview-page'
import { PurchaseOrderPage } from '../features/forms/purchase-order-page'
import { ShipmentPage } from '../features/forms/shipment-page'
import { StockInspectionPage } from '../features/forms/stock-inspection-page'
import { StockPhtPage } from '../features/forms/stock-pht-page'
import { StockReglazingPage } from '../features/forms/stock-reglazing-page'
import { StockRepackingPage } from '../features/forms/stock-repacking-page'
import { StockSamplingPage } from '../features/forms/stock-sampling-page'
import { VehicleDetailsPage } from '../features/forms/vehicle-details-page'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <PlainLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <HomeRedirect /> },
      {
        path: 'overview',
        element: (
          <RequireAccess accessKey="overview">
            <OverviewPage />
          </RequireAccess>
        ),
      },
      {
        path: 'purchase-order',
        element: (
          <RequireAccess accessKey="purchase_order">
            <PurchaseOrderPage />
          </RequireAccess>
        ),
      },
      {
        path: 'stock-reglazing',
        element: (
          <RequireAccess accessKey="stock_reglazing">
            <StockReglazingPage />
          </RequireAccess>
        ),
      },
      {
        path: 'stock-repacking',
        element: (
          <RequireAccess accessKey="stock_repacking">
            <StockRepackingPage />
          </RequireAccess>
        ),
      },
      {
        path: 'stock-sampling',
        element: (
          <RequireAccess accessKey="stock_sampling">
            <StockSamplingPage />
          </RequireAccess>
        ),
      },
      {
        path: 'stock-inspection',
        element: (
          <RequireAccess accessKey="stock_inspection">
            <StockInspectionPage />
          </RequireAccess>
        ),
      },
      {
        path: 'stock-pht',
        element: (
          <RequireAccess accessKey="stock_pht">
            <StockPhtPage />
          </RequireAccess>
        ),
      },
      {
        path: 'shipment',
        element: (
          <RequireAccess accessKey="shipment">
            <ShipmentPage />
          </RequireAccess>
        ),
      },
      {
        path: 'vehicle-details',
        element: (
          <RequireAccess accessKey="vehicle_details">
            <VehicleDetailsPage />
          </RequireAccess>
        ),
      },
      {
        path: 'admin-dashboard',
        element: (
          <RequireAccess adminOnly>
            <AdminDashboardPage />
          </RequireAccess>
        ),
      },
      {
        path: 'security',
        element: <SecurityPage />,
      },
    ],
  },
])

