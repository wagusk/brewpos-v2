/**
 * POSSelect — unified select component for dropdown selections.
 *
 * Card-based, large touch targets, theme-driven styling matching POSTextField.
 */

import { CSSProperties, ReactNode } from 'react';
import { useTheme } from '../core/theme/monoTheme';
import POSCard from './POSCard';

export interface POSSelectOption {
  label: string;
  value: any;
}

export interface POSSelectProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  value: any;
  onChange: (value: any) => void;
  options: POSSelectOption[];
  disabled?: boolean;
  error?: boolean | string;
  icon?: ReactNode;
  fullWidth?: boolean;
  className?: string;
}

export default function POSSelect({
  size = 'md',
  label,
  value,
  onChange,
  options,
  disabled = false,
  error = false,
  icon,
  fullWidth = false,
  className = '',
}: POSSelectProps) {
  const theme = useTheme();

  const sizeConfig: Record<string, { height: number; paddingX: number; fontSize: string }> = {
    sm: { height: 40, paddingX: 10, fontSize: '0.875rem' },
    md: { height: 48, paddingX: 12, fontSize: '0.875rem' },
    lg: { height: 56, paddingX: 14, fontSize: '1rem' },
  };
  const sizeValues = sizeConfig[size];

  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: `${theme.ui.spacingBase}px`,
    width: fullWidth ? '100%' : 'auto',
  };

  const labelStyle: CSSProperties = {
    fontSize: theme.fontSize('body2'),
    fontWeight: 600,
    color: theme.text,
  };

  const inputContainerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: `${theme.ui.spacingBase}px`,
    width: '100%',
  };

  const selectStyle: CSSProperties = {
    flex: 1,
    minHeight: `${sizeValues.height}px`,
    paddingLeft: icon ? '8px' : `${sizeValues.paddingX}px`,
    paddingRight: `${sizeValues.paddingX + 24}px`,
    paddingTop: '8px',
    paddingBottom: '8px',
    border: 'none',
    borderRadius: `${theme.ui.inputRadius}px`,
    backgroundColor: disabled ? theme.inputDisabled : theme.input,
    color: disabled ? theme.muted : theme.inputText,
    fontSize: sizeValues.fontSize,
    fontWeight: 500,
    outline: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='${encodeURIComponent(theme.text)}' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: `right ${sizeValues.paddingX}px center`,
  };

  const errorMessageStyle: CSSProperties = {
    fontSize: theme.fontSize('caption'),
    color: theme.errorText,
    marginTop: '4px',
  };

  return (
    <div style={containerStyle}>
      {label && <label style={labelStyle}>{label}</label>}
      <POSCard
        variant="outlined"
        padding="sm"
        minHeight={sizeValues.height}
        style={{
          borderColor: error ? theme.errorBorder : theme.inputBorder,
          backgroundColor: error ? theme.errorBg : theme.input,
        }}
      >
        <div style={inputContainerStyle}>
          {icon && <span style={{ display: 'flex', alignItems: 'center', color: theme.muted }}>{icon}</span>}
          <select
            className={className}
            style={selectStyle}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            onFocus={(e) => {
              if (!disabled) {
                (e.currentTarget.parentElement?.parentElement as HTMLElement).style.borderColor = theme.inputBorderFocus;
              }
            }}
            onBlur={(e) => {
              (e.currentTarget.parentElement?.parentElement as HTMLElement).style.borderColor = error ? theme.errorBorder : theme.inputBorder;
            }}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} style={{ backgroundColor: theme.card, color: theme.text }}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </POSCard>
      {error && typeof error === 'string' && <div style={errorMessageStyle}>{error}</div>}
    </div>
  );
}
