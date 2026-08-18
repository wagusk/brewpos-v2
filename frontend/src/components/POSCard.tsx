import type { HTMLAttributes, ReactNode } from 'react'

type Props = HTMLAttributes<HTMLElement> & { children: ReactNode; clickable?: boolean; selected?: boolean; disabled?: boolean; as?: 'article' | 'section' | 'div' }

export function POSCard({ children, clickable, selected, disabled, as = 'article', className = '', ...props }: Props) {
  const Component = as
  return <Component className={`pos-card ${clickable ? 'is-clickable' : ''} ${selected ? 'is-selected' : ''} ${disabled ? 'is-disabled' : ''} ${className}`} aria-disabled={disabled || undefined} {...props}>{children}</Component>
}
