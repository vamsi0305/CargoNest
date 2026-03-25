type KpiCardProps = {
  label: string
  value: number
  tone?: 'default' | 'warning' | 'danger'
}

export function KpiCard({ label, value, tone = 'default' }: KpiCardProps) {
  return (
    <article className={`kpi-card kpi-card--${tone}`}>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  )
}
