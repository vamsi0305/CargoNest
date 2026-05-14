import { Link, useParams } from 'react-router-dom'

import { StatusBadge } from '../../components/ui/status-badge'
import { FormPageHeader, FormSheet } from '../forms/common'
import { usePurchaseOrder } from './hooks'

export function PurchaseOrderDetailPage() {
  const { orderId = '' } = useParams()
  const { data, isLoading, isError } = usePurchaseOrder(orderId)

  if (isLoading) {
    return (
      <main className="page-canvas">
        <FormPageHeader title="Purchase Order Detail" />
        <FormSheet>
          <p className="muted-copy">Loading purchase order details...</p>
        </FormSheet>
      </main>
    )
  }

  if (isError || !data) {
    return (
      <main className="page-canvas">
        <FormPageHeader title="Purchase Order Detail" />
        <FormSheet>
          <p className="muted-copy">Purchase order details are unavailable right now.</p>
        </FormSheet>
      </main>
    )
  }

  return (
    <main className="page-canvas">
      <FormPageHeader title="Purchase Order Detail" />
      <FormSheet>
        <div className="section-block compact-top">
          <div className="detail-heading">
            <div>
              <h2>
                {data.cargo_no} / {data.po_no}
              </h2>
              <p className="muted-copy">Operational detail derived from the saved form workflow.</p>
            </div>
            <StatusBadge status={data.status} />
          </div>

          <div className="detail-grid">
            <div className="detail-card">
              <span>Buyer</span>
              <strong>{data.buyer}</strong>
            </div>
            <div className="detail-card">
              <span>Agent</span>
              <strong>{data.agent_name}</strong>
            </div>
            <div className="detail-card">
              <span>Destination</span>
              <strong>{data.destination}</strong>
            </div>
            <div className="detail-card">
              <span>PO Date</span>
              <strong>{data.po_date}</strong>
            </div>
            <div className="detail-card">
              <span>Total Quantity</span>
              <strong>{data.total_quantity_kg.toLocaleString()} kg</strong>
            </div>
            <div className="detail-card">
              <span>Shipment Target</span>
              <strong>{data.shipment_target}</strong>
            </div>
          </div>
        </div>

        <div className="section-block">
          <div className="detail-heading">
            <div>
              <p className="muted-copy">Workflow readiness</p>
              <h2>What this purchase order has unlocked</h2>
            </div>
          </div>

          <ul className="check-list">
            <li>Purchase order data is now visible from the saved backend records.</li>
            <li>Progress reflects downstream form activity across processing, inspection, and shipment.</li>
            <li>Shipment target is pulled from ETA or destination details when available.</li>
            <li>Queue access respects the same authenticated permissions as the rest of the app.</li>
          </ul>

          <div className="inline-actions">
            <Link className="btn btn--attach btn--small" to="/purchase-orders">
              Back to Queue
            </Link>
            <Link className="btn btn--blue btn--small" to="/purchase-order">
              Open PO Form
            </Link>
          </div>
        </div>
      </FormSheet>
    </main>
  )
}
