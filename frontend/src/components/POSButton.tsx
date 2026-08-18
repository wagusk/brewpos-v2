import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { children?: ReactNode; variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline'; size?: 'sm' | 'md' | 'lg'; loading?: boolean; icon?: ReactNode; fullWidth?: boolean }

export function POSButton({ children, variant = 'secondary', size = 'md', loading, icon, fullWidth, className = '', disabled, ...props }: Props) {
  return <button className={`pos-button pos-button-${variant} pos-button-${size} ${fullWidth ? 'is-full' : ''} ${className}`} disabled={disabled || loading} {...props}>{loading ? <span className="button-loader" /> : icon}{children}</button>
}
