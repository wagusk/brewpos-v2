/**
 * POSIcon — centralized icon wrapper for consistent sizing and theming.
 *
 * All icons in the UI pass through this wrapper so size/color can be
 * controlled globally via theme tokens without changing component code.
 *
 * Props:
 *   - icon: ReactNode (MUI Icon component)
 *   - size: 'sm' | 'md' | 'lg' (icon size)
 *   - color?: string (override color, defaults to theme.text)
 *   - variant?: 'default' | 'muted' | 'success' | 'error' | 'warning' | 'info'
 */

import { ReactNode, CSSProperties } from 'react';
import { useTheme } from '../core/theme/monoTheme';

export interface POSIconProps {
  icon: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  variant?: 'default' | 'muted' | 'success' | 'error' | 'warning' | 'info';
  style?: CSSProperties;
}

export default function POSIcon({
  icon,
  size = 'md',
  color,
  variant = 'default',
  style = {},
}: POSIconProps) {
  const theme = useTheme();

  // Size map
  const sizeMap: Record<string, number> = {
    sm: 20,
    md: 24,
    lg: 32,
  };
  const iconSize = sizeMap[size];

  // Variant color map
  const colorMap: Record<string, string> = {
    default: color || theme.text,
    muted: color || theme.muted,
    success: color || theme.success,
    error: color || theme.error,
    warning: color || theme.warning,
    info: color || theme.info,
  };
  const iconColor = colorMap[variant];

  const iconStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: `${iconSize}px`,
    height: `${iconSize}px`,
    color: iconColor,
    flexShrink: 0,
    ...style,
  };

  return (
    <div style={iconStyle}>
      {icon}
    </div>
  );
}
