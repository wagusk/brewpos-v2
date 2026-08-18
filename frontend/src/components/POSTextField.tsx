import type { ChangeEvent, InputHTMLAttributes, ReactNode } from 'react'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> & { label?: string; error?: string; icon?: ReactNode; onChange?: (event: ChangeEvent<HTMLInputElement>) => void }

export function POSTextField({ label, error, icon, className = '', ...props }: Props) {
  return <label className={`pos-field ${error ? 'has-error' : ''} ${className}`}>{label && <span>{label}</span>}<span className="pos-field-control">{icon}{<input {...props} />}</span>{error && <small>{error}</small>}</label>
}
