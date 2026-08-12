/**
 * POSTextField — unified input component for all text/number input needs.
 *
 * Card-based, large touch targets, theme-driven styling.
 *
 * Props:
 *   - variant: 'default' | 'search' | 'pin' (input type)
 *   - size: 'sm' | 'md' | 'lg' (input size)
 *   - label: string (optional label above input)
 *   - placeholder: string
 *   - value: string
 *   - onChange: (value: string) => void
 *   - disabled: boolean
 *   - error: boolean | string (error state + message)
 *   - icon?: ReactNode (icon inside input, left side)
 *   - fullWidth: boolean
 */

import { CSSProperties } from 'react';
import { useTheme } from '../core/theme/monoTheme';
import POSCard from './POSCard';

export interface POSTextFieldProps {
  variant?: 'default' | 'search' | 'pin';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean | string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  type?: 'text' | 'password' | 'email' | 'number' | 'tel';
  className?: string;
  autoFocus?: boolean;
}

export default function POSTextField({
  variant = 'default',
  size = 'md',
  label,
  placeholder,
  value,
  onChange,
  disabled = false,
  error = false,
  icon,
  fullWidth = false,
  type = 'text',
  className = '',
  autoFocus = false,
}: POSTextFieldProps) {
  const theme = useTheme();

  // Size configurations
  const sizeConfig: Record<string, { height: number; paddingX: number; fontSize: string }> = {
    sm: { height: 40, paddingX: 10, fontSize: '0.875rem' },
    md: { height: 48, paddingX: 12, fontSize: '0.875rem' },
    lg: { height: 56, paddingX: 14, fontSize: '1rem' },
  };
  const sizeValues = sizeConfig[size];

  // Handle PIN variant (numeric, centered, spaced)
  const isPIN = variant === 'pin';
  const inputType = isPIN ? 'tel' : type;

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

  const inputStyle: CSSProperties = {
    flex: 1,
    minHeight: `${sizeValues.height}px`,
    paddingLeft: icon ? '8px' : `${sizeValues.paddingX}px`,
    paddingRight: `${sizeValues.paddingX}px`,
    paddingTop: '8px',
    paddingBottom: '8px',
    border: 'none',
    borderRadius: `${theme.ui.inputRadius}px`,
    backgroundColor: disabled ? theme.inputDisabled : theme.input,
    color: disabled ? theme.muted : theme.inputText,
    fontSize: sizeValues.fontSize,
    fontWeight: 500,
    outline: 'none',
    transition: theme.ui.animationDuration > 0
      ? `all ${theme.ui.animationDuration}ms ease-out`
      : 'none',
    textAlign: isPIN ? 'center' : 'left',
    letterSpacing: isPIN ? '8px' : 'normal',
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
          <input
            type={inputType}
            className={className}
            style={inputStyle}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            autoFocus={autoFocus}
            onFocus={(e) => {
              if (!disabled) {
                (e.currentTarget.parentElement?.parentElement as HTMLElement).style.borderColor = theme.inputBorderFocus;
              }
            }}
            onBlur={(e) => {
              (e.currentTarget.parentElement?.parentElement as HTMLElement).style.borderColor = error ? theme.errorBorder : theme.inputBorder;
            }}
          />
        </div>
      </POSCard>
      {error && typeof error === 'string' && <div style={errorMessageStyle}>{error}</div>}
    </div>
  );
}
