import type { ReactNode } from 'react'
import { Grid3X3, RefreshCw } from 'lucide-react'
import { title } from './format'

export function PanelTitle({
  title: label,
  action,
}: {
  title: string
  action?: ReactNode
}) {
  return (
    <div className="panel-title">
      <h2>{label}</h2>
      {action}
    </div>
  )
}

export function Loading() {
  return (
    <div className="loading">
      <RefreshCw className="spin" size={20} />
      Loading workspace…
    </div>
  )
}

export function Empty({ title: label, text }: { title: string; text: string }) {
  return (
    <div className="empty">
      <Grid3X3 size={24} />
      <strong>{label}</strong>
      <span>{text}</span>
    </div>
  )
}

// Generic metric tile used by the dashboard. Accepts any lucide icon component.
type IconComponent = typeof RefreshCw
export function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number
  icon: IconComponent
}) {
  return (
    <div className="metric">
      <div className="metric-icon">
        <Icon size={21} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  )
}

// Re-export `title` so screens can do a single import: `import { PanelTitle, title } from '../common/chrome'`
export { title }
