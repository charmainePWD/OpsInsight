import type { ReactNode } from 'react'

type SummaryCardProps = {
  label: string
  value: ReactNode
  icon: string
  iconClass: string
  footnote: ReactNode
}

function SummaryCard({
  label,
  value,
  icon,
  iconClass,
  footnote,
}: SummaryCardProps) {
  return (
    <article className="summary-card">
      <div className="card-top">
        <span>{label}</span>
        <span className={`metric-icon ${iconClass}`}>{icon}</span>
      </div>

      <div className="metric-value">{value}</div>

      <div className="metric-foot">{footnote}</div>
    </article>
  )
}

export default SummaryCard