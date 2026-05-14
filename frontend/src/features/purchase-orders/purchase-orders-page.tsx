import { Link } from 'react-router-dom'

import { StatusBadge } from '../../components/ui/status-badge'
import { FormPageHeader, FormSheet } from '../forms/common'
import { usePurchaseOrders } from './hooks'

export function PurchaseOrdersPage() {
  const { data, isLoading, isError } = usePurchaseOrders()

  if (isLoading) {
    return (
      <main className="page-canvas">
        <FormPageHeader title="Purchase Queue" />
        <FormSheet>
          <p className="muted-copy">Loading purchase orders...</p>
        </FormSheet>
      </main>
    )
  }

  if (isError || !data) {
    return (
      <main className="page-canvas">
        <FormPageHeader title="Purchase Queue" />
        <FormSheet>
          <p className="muted-copy">
            Purchase orders could not be loaded. Make sure the API is available.
          </p>
        </FormSheet>
      </main>
    )
  }

  return (
    <main className="page-canvas">
      <FormPageHeader title="Purchase Queue" />

      <FormSheet>
        <div className="summary-grid">
          <article className="summary-card">
            <span>Active Orders</span>
            <strong>{data.metrics.active_orders}</strong>
          </article>
          <article className="summary-card">
            <span>Pending Shipments</span>
            <strong>{data.metrics.pending_shipments}</strong>
          </article>
          <article className="summary-card">
            <span>Quality Checks Due</span>
            <strong>{data.metrics.quality_checks_due}</strong>
          </article>
          <article className="summary-card">
            <span>Cold Chain Alerts</span>
            <strong>{data.metrics.cold_chain_alerts}</strong>
          </article>
        </div>

        <div className="section-block compact-top">
          <h2>All active cargo references</h2>
          <p className="muted-copy">Source: {data.source}</p>
          {data.items.length === 0 ? (
            <p className="muted-copy">No purchase orders have been saved yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="plain-table purchase-orders-table">
                <thead>
                  <tr>
                    <th>Cargo No</th>
                    <th>PO No</th>
                    <th>Buyer</th>
                    <th>Agent</th>
                    <th>Destination</th>
                    <th>Quantity</th>
                    <th>Progress</th>
                    <th>Status</th>
                    <th>Target</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <Link className="record-link" to={`/purchase-orders/${order.id}`}>
                          {order.cargo_no}
                        </Link>
                      </td>
                      <td>{order.po_no}</td>
                      <td>{order.buyer}</td>
                      <td>{order.agent_name}</td>
                      <td>{order.destination}</td>
                      <td>{order.total_quantity_kg.toLocaleString()} kg</td>
                      <td>
                        <div className="progress">
                          <div className="progress__fill" style={{ width: `${order.progress}%` }} />
                        </div>
                        <span className="progress-copy">{order.progress}%</span>
                      </td>
                      <td>
                        <StatusBadge status={order.status} />
                      </td>
                      <td>{order.shipment_target}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </FormSheet>
    </main>
  )
}
