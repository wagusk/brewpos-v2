/**
 * POSButton — unified button component for all interactive actions.
 *
 * Touch-optimized with large min height, card-based visual design.
 * All styling driven by theme tokens.
 *
 * Props:
 *   - variant: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' (button style)
 *   - size: 'sm' | 'md' | 'lg' | 'xl' (button size)
 *   - onClick: () => void
 *   - disabled: boolean
 *   - loading: boolean (shows spinner, disables click)
 *   - fullWidth: boolean (stretch to container width)
 *   - icon?: ReactNode (icon before text)
 *   - iconPosition?: 'left' | 'right'
 *   - children: ReactNode (text content)
 */

import { ReactNode, CSSProperties } from 'react';
import { useTheme } from '../core/theme/monoTheme';

export interface POSButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  type?: 'button' | 'submit' | 'reset';
}

export default function POSButton({
  variant = 'primary',
  size = 'lg',
  onClick,
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  children,
  className = '',
  style = {},
  type = 'button',
}: POSButtonProps) {
  const theme = useTheme();

  // Size configurations
  const sizeConfig: Record<string, { height: number; paddingX: number; paddingY: number; fontSize: string }> = {
    sm: { height: 40, paddingX: 12, paddingY: 4, fontSize: '0.75rem' },
    md: { height: 52, paddingX: 14, paddingY: 6, fontSize: '0.875rem' },
    lg: { height: 64, paddingX: 16, paddingY: 8, fontSize: '1rem' },
    xl: { height: 72, paddingX: 20, paddingY: 10, fontSize: '1.125rem' },
  };
  const sizeValues = sizeConfig[size];

  // Variant colors
  const variantConfig: Record<string, { bg: string; text: string; hover: string; border: string }> = {
    primary: {
      bg: theme.button,
      text: theme.buttonText,
      hover: theme.buttonHover,
      border: theme.button,
    },
    secondary: {
      bg: theme.buttonSecondary,
      text: theme.buttonSecondaryText,
      hover: theme.buttonSecondaryHover,
      border: theme.buttonSecondaryHover,
    },
    danger: {
      bg: theme.error,
      text: '#fff',
      hover: theme.errorDark,
      border: theme.error,
    },
    success: {
      bg: theme.success,
      text: '#fff',
      hover: theme.successDark,
      border: theme.success,
    },
    ghost: {
      bg: 'transparent',
      text: theme.text,
      hover: theme.cardHover,
      border: 'transparent',
    },
    outline: {
      bg: 'transparent',
      text: theme.text,
      hover: theme.cardHover,
      border: theme.text,
    },
  };
  const colors = variantConfig[variant];

  const buttonStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: `${theme.ui.spacingBase}px`,
    minHeight: `${sizeValues.height}px`,
    minWidth: fullWidth ? '100%' : `${sizeValues.height}px`,
    width: fullWidth ? '100%' : 'auto',
    paddingLeft: `${sizeValues.paddingX}px`,
    paddingRight: `${sizeValues.paddingX}px`,
    paddingTop: `${sizeValues.paddingY}px`,
    paddingBottom: `${sizeValues.paddingY}px`,
    backgroundColor: disabled || loading ? theme.buttonDisabled : colors.bg,
    color: disabled || loading ? theme.buttonDisabledText : colors.text,
    border: `2px solid ${disabled ? theme.buttonDisabled : colors.border}`,
    borderRadius: `${theme.ui.buttonRadius}px`,
    fontSize: sizeValues.fontSize,
    fontWeight: 600,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: theme.ui.animationDuration > 0
      ? `all ${theme.ui.animationDuration}ms ease-out`
      : 'none',
    textTransform: 'none',
    userSelect: 'none',
    ...style,
  };

  return (
    <button
      type={type}
      className={className}
      style={buttonStyle}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          (e.currentTarget as HTMLElement).style.backgroundColor = colors.hover;
          (e.currentTarget as HTMLElement).style.boxShadow = theme.ui.elevationShadow.md;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          (e.currentTarget as HTMLElement).style.backgroundColor = colors.bg;
          (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        }
      }}
    >
      {loading ? (
        <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
          <span style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</span>
          {icon && iconPosition === 'right' && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
        </>
      )}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
}
