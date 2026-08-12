/**
 * POSCard — unified card component.
 * Updated to use React state for hover effects instead of DOM queries (`data-card`).
 */

import { ReactNode, CSSProperties, useState } from 'react';
import { useTheme } from '../core/theme/monoTheme';

export interface POSCardProps {
  variant?: 'default' | 'elevated' | 'outlined';
  clickable?: boolean;
  selected?: boolean;
  disabled?: boolean;
  elevation?: 'sm' | 'md' | 'lg' | 'xl';
  padding?: number | 'sm' | 'md' | 'lg';
  minHeight?: number | 'auto';
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export default function POSCard({
  variant = 'default',
  clickable = false,
  selected = false,
  disabled = false,
  elevation = 'md',
  padding = 'md',
  minHeight = 'auto',
  onClick,
  children,
  className = '',
  style = {},
}: POSCardProps) {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  const paddingMap: Record<string, number> = { sm: 8, md: 16, lg: 24 };
  const resolvedPadding = typeof padding === 'string' ? paddingMap[padding] : padding;

  const shadowMap = theme.ui.elevationShadow;
  let boxShadow = shadowMap[elevation];

  let backgroundColor = theme.card;
  let borderColor = theme.cardBorder;
  let borderWidth = 1;

  if (variant === 'elevated') {
    borderWidth = 0;
  } else if (variant === 'outlined') {
    backgroundColor = 'transparent';
    borderWidth = 2;
  }

  if (selected && !disabled) {
    backgroundColor = theme.chipActive;
    borderColor = theme.chipActive;
  }

  if (disabled) {
    backgroundColor = theme.inputDisabled;
    borderColor = theme.chipDisabled;
  }

  // Handle hover background / shadow override if style doesn't have custom solid background
  const hasCustomBg = style.backgroundColor !== undefined;
  if (isHovered && clickable && !disabled && variant !== 'outlined' && !hasCustomBg) {
    backgroundColor = theme.cardHover;
    if (variant === 'elevated') {
      boxShadow = shadowMap.lg;
    }
  }

  const cardStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    backgroundColor,
    borderRadius: `${theme.ui.cardRadius}px`,
    border: `${borderWidth}px solid ${borderColor}`,
    padding: `${resolvedPadding}px`,
    minHeight: minHeight === 'auto' ? 'auto' : `${minHeight}px`,
    boxShadow: variant === 'elevated' ? boxShadow : 'none',
    cursor: clickable && !disabled ? 'pointer' : 'default',
    opacity: disabled ? 0.6 : 1,
    transition: theme.ui.animationDuration > 0
      ? `all ${theme.ui.animationDuration}ms ease-out`
      : 'none',
    ...style,
  };

  return (
    <div
      className={className}
      style={cardStyle}
      onClick={clickable && !disabled ? onClick : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable && !disabled ? 0 : undefined}
      onKeyDown={(e) => {
        if (clickable && !disabled && (e.key === 'Enter' || e.key === ' ')) {
          onClick?.();
        }
      }}
    >
      {children}
    </div>
  );
}
