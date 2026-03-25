import { Navigate, createBrowserRouter } from 'react-router-dom'

import { PlainLayout } from '../components/layout/plain-layout'
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
    path: '/',
    element: <PlainLayout />,
    children: [
      { index: true, element: <Navigate to="/purchase-order" replace /> },
      { path: 'overview', element: <OverviewPage /> },
      { path: 'purchase-order', element: <PurchaseOrderPage /> },
      { path: 'stock-reglazing', element: <StockReglazingPage /> },
      { path: 'stock-repacking', element: <StockRepackingPage /> },
      { path: 'stock-sampling', element: <StockSamplingPage /> },
      { path: 'stock-inspection', element: <StockInspectionPage /> },
      { path: 'stock-pht', element: <StockPhtPage /> },
      { path: 'shipment', element: <ShipmentPage /> },
      { path: 'vehicle-details', element: <VehicleDetailsPage /> },
    ],
  },
])
