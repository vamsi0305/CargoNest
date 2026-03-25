import { Link, useParams } from 'react-router-dom'

import { StatusBadge } from '../../components/ui/status-badge'
import { usePurchaseOrder } from './hooks'

export function PurchaseOrderDetailPage() {
  const { orderId = '' } = useParams()
  const { data, isLoading, isError } = usePurchaseOrder(orderId)

  if (isLoading) {
    return <section className="panel">Loading purchase order details...</section>
  }

  if (isError || !data) {
    return (
      <section className="panel panel--error">
        Purchase order details are unavailable right now.
      </section>
    )
  }

  return (
    <div className="detail-layout">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Purchase order record</p>
            <h2>
              {data.cargo_no} / {data.po_no}
            </h2>
          </div>
          <StatusBadge status={data.status} />
        </div>

        <div className="detail-grid">
          <div>
            <span>Buyer</span>
            <strong>{data.buyer}</strong>
          </div>
          <div>
            <span>Agent</span>
            <strong>{data.agent_name}</strong>
          </div>
          <div>
            <span>Destination</span>
            <strong>{data.destination}</strong>
          </div>
          <div>
            <span>PO Date</span>
            <strong>{data.po_date}</strong>
          </div>
          <div>
            <span>Total Quantity</span>
            <strong>{data.total_quantity_kg.toLocaleString()} kg</strong>
          </div>
          <div>
            <span>Shipment Target</span>
            <strong>{data.shipment_target}</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Workflow readiness</p>
            <h3>Next implementation slices</h3>
          </div>
        </div>

        <ul className="check-list">
          <li>Reglazing and repacking job rows linked to PO products</li>
          <li>Sampling, inspection, and PHT compliance stages</li>
          <li>Shipment creation and reefer logistics tracking</li>
          <li>Vehicle gate entries, documents, and temperature logs</li>
        </ul>

        <Link className="secondary-link" to="/purchase-orders">
          Back to purchase orders
        </Link>
      </section>
    </div>
  )
}
