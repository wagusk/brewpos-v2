import type { ReactNode } from 'react'

export function POSIcon({ icon, size = 'md', variant = 'default' }: { icon: ReactNode; size?: 'sm' | 'md' | 'lg'; variant?: 'default' | 'muted' | 'success' | 'error' | 'warning' | 'info' }) {
  return <span className={`pos-icon pos-icon-${size} pos-icon-${variant}`}>{icon}</span>
}
