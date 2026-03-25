import { ArrowRight, ThermometerSnowflake } from 'lucide-react'
import { Link } from 'react-router-dom'

import { KpiCard } from '../../components/ui/kpi-card'
import { StatusBadge } from '../../components/ui/status-badge'
import { usePurchaseOrders } from '../purchase-orders/hooks'

export function OverviewPage() {
  const { data, isLoading, isError } = usePurchaseOrders()

  if (isLoading) {
    return <section className="panel">Loading operational overview...</section>
  }

  if (isError || !data) {
    return (
      <section className="panel panel--error">
        Unable to load overview data. Check that the FastAPI server is running.
      </section>
    )
  }

  const featuredOrders = data.items.slice(0, 3)

  return (
    <div className="page-grid">
      <section className="hero-card">
        <div className="hero-card__copy">
          <p className="eyebrow">Today's control tower</p>
          <h2>Track readiness, quality checks, and shipment pressure in one place.</h2>
          <p>
            CargoNest is now running on React + FastAPI, ready for PO workflows,
            logistics updates, and Supabase-backed operations.
          </p>
          <Link className="primary-link" to="/purchase-orders">
            Open purchase orders <ArrowRight size={16} />
          </Link>
        </div>

        <div className="hero-card__signal">
          <ThermometerSnowflake size={28} />
          <strong>Cold-chain stable</strong>
          <p>1 reefer alert needs attention before dispatch.</p>
        </div>
      </section>

      <section className="kpi-grid">
        <KpiCard label="Active Orders" value={data.metrics.active_orders} />
        <KpiCard label="Pending Shipments" value={data.metrics.pending_shipments} tone="warning" />
        <KpiCard label="Quality Checks Due" value={data.metrics.quality_checks_due} tone="warning" />
        <KpiCard label="Cold Chain Alerts" value={data.metrics.cold_chain_alerts} tone="danger" />
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Priority purchase orders</p>
            <h3>What the team should look at first</h3>
          </div>
        </div>

        <div className="priority-list">
          {featuredOrders.map((order) => (
            <article className="priority-row" key={order.id}>
              <div>
                <p className="priority-row__title">{order.cargo_no}</p>
                <p>
                  {order.buyer} to {order.destination}
                </p>
              </div>
              <div className="priority-row__meta">
                <StatusBadge status={order.status} />
                <span>{order.progress}% ready</span>
                <Link to={`/purchase-orders/${order.id}`}>View</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
