/**
 * POSChip — unified badge/chip component for status, category, station, etc.
 *
 * Small card-based surface for labeling and filtering.
 *
 * Props:
 *   - variant: 'default' | 'status' | 'station' | 'payment' (chip type)
 *   - status: string (for status variant: 'pending' | 'accepted' | 'preparing' | 'ready' | 'served' | 'void')
 *   - color: string (for default variant or custom colors)
 *   - icon?: ReactNode (icon before text)
 *   - selected?: boolean
 *   - disabled?: boolean
 *   - onClick?: () => void
 *   - children: ReactNode
 */

import { ReactNode, CSSProperties } from 'react';
import { useTheme } from '../core/theme/monoTheme';

export interface POSChipProps {
  variant?: 'default' | 'status' | 'station' | 'payment' | 'category';
  status?: 'pending' | 'accepted' | 'preparing' | 'ready' | 'served' | 'void';
  stationType?: 'kitchen' | 'bar' | 'both';
  paymentType?: 'cash' | 'card' | 'mobile';
  color?: string;
  icon?: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: CSSProperties;
}

export default function POSChip({
  variant = 'default',
  status,
  stationType,
  paymentType,
  color,
  icon,
  selected = false,
  disabled = false,
  onClick,
  children,
  size = 'md',
  className = '',
  style = {},
}: POSChipProps) {
  const theme = useTheme();

  // Size configurations
  const sizeConfig: Record<string, { height: number; paddingX: number; fontSize: string }> = {
    sm: { height: 28, paddingX: 8, fontSize: '0.75rem' },
    md: { height: 36, paddingX: 12, fontSize: '0.875rem' },
    lg: { height: 44, paddingX: 14, fontSize: '1rem' },
  };
  const sizeValues = sizeConfig[size];

  // Determine colors based on variant
  let backgroundColor = theme.chip;
  let textColor = theme.text;

  if (variant === 'status' && status) {
    const statusColors: Record<string, { bg: string; text: string }> = {
      pending: { bg: theme.statusPending, text: '#fff' },
      accepted: { bg: theme.statusAccepted, text: '#fff' },
      preparing: { bg: theme.statusPreparing, text: '#fff' },
      ready: { bg: theme.statusReady, text: '#fff' },
      served: { bg: theme.statusServed, text: '#fff' },
      void: { bg: theme.statusVoid, text: '#fff' },
    };
    const statusColor = statusColors[status];
    backgroundColor = statusColor.bg;
    textColor = statusColor.text;
  } else if (variant === 'station' && stationType) {
    const stationColors: Record<string, { bg: string; text: string }> = {
      kitchen: { bg: theme.stationKitchen, text: '#fff' },
      bar: { bg: theme.stationBar, text: '#fff' },
      both: { bg: theme.stationBoth, text: '#fff' },
    };
    const stationColor = stationColors[stationType];
    backgroundColor = stationColor.bg;
    textColor = stationColor.text;
  } else if (variant === 'payment' && paymentType) {
    const paymentColors: Record<string, { bg: string; text: string }> = {
      cash: { bg: theme.paymentCash, text: '#fff' },
      card: { bg: theme.paymentCard, text: '#fff' },
      mobile: { bg: theme.paymentMobile, text: '#fff' },
    };
    const paymentColor = paymentColors[paymentType];
    backgroundColor = paymentColor.bg;
    textColor = paymentColor.text;
  } else if (color) {
    backgroundColor = color;
    textColor = '#fff';
  }

  if (selected && variant === 'default') {
    backgroundColor = theme.chipActive;
    textColor = theme.chipActiveText;
  }

  if (disabled) {
    backgroundColor = theme.chipDisabled;
    textColor = theme.muted;
  }

  const chipStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    minHeight: `${sizeValues.height}px`,
    paddingLeft: `${sizeValues.paddingX}px`,
    paddingRight: `${sizeValues.paddingX}px`,
    borderRadius: theme.ui.chipRadius,
    backgroundColor,
    color: textColor,
    fontSize: sizeValues.fontSize,
    fontWeight: 600,
    border: variant === 'default' && !selected ? `1px solid ${theme.chipBorder}` : 'none',
    cursor: onClick && !disabled ? 'pointer' : 'default',
    transition: theme.ui.animationDuration > 0
      ? `all ${theme.ui.animationDuration}ms ease-out`
      : 'none',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    ...style,
  };

  return (
    <div
      className={className}
      style={chipStyle}
      onClick={onClick && !disabled ? onClick : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && !disabled && (e.key === 'Enter' || e.key === ' ')) {
          onClick();
        }
      }}
      onMouseEnter={(e) => {
        if (onClick && !disabled) {
          (e.currentTarget as HTMLElement).style.opacity = '0.85';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick && !disabled) {
          (e.currentTarget as HTMLElement).style.opacity = '1';
        }
      }}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      <span>{children}</span>
    </div>
  );
}
