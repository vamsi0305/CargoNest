import { cn } from '../../lib/cn'

type StatusBadgeProps = {
  status: string
}

const LABELS: Record<string, string> = {
  draft: 'Draft',
  processing: 'Processing',
  inspection: 'Inspection',
  shipment_ready: 'Shipment Ready',
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn('status-badge', `status-badge--${status}`)}
      aria-label={`Status: ${LABELS[status] ?? status}`}
    >
      {LABELS[status] ?? status}
    </span>
  )
}
