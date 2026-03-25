import { Link } from 'react-router-dom'

import { StatusBadge } from '../../components/ui/status-badge'
import { usePurchaseOrders } from './hooks'

export function PurchaseOrdersPage() {
  const { data, isLoading, isError } = usePurchaseOrders()

  if (isLoading) {
    return <section className="panel">Loading purchase orders...</section>
  }

  if (isError || !data) {
    return (
      <section className="panel panel--error">
        Purchase orders could not be loaded. Make sure the API is available.
      </section>
    )
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Purchase order queue</p>
          <h2>All active cargo references</h2>
        </div>
        <div className="source-chip">Source: {data.source}</div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
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
                  <Link className="table-link" to={`/purchase-orders/${order.id}`}>
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
                  <span>{order.progress}%</span>
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
    </section>
  )
}
