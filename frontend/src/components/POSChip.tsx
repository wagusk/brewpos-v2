import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; selected?: boolean; status?: string; variant?: 'default' | 'status' | 'station' | 'payment'; asText?: boolean }

export function POSChip({ children, selected, status, variant = 'default', asText, className = '', ...props }: Props) {
  const Tag = asText ? 'span' : 'button'
  return <Tag className={`pos-chip pos-chip-${variant} ${status ? `is-${status}` : ''} ${selected ? 'is-selected' : ''} ${className}`} {...(asText ? {} : props)}>{children}</Tag>
}
