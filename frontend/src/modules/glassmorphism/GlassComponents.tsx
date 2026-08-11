import { ReactNode } from 'react';
import { Card, CardProps, Box, Typography, Button, ButtonProps, AppBar, AppBarProps, IconButton, IconButtonProps, Tooltip, TooltipProps, Chip, ChipProps } from '@mui/material';

// ─── GlassCard ────────────────────────────────────────────────────
interface GlassCardProps extends CardProps {
  children: ReactNode;
  hover?: boolean;
}

export function GlassCard({ children, hover = true, sx, ...props }: GlassCardProps) {
  return (
    <Card
      sx={{
        bgcolor: 'rgba(15, 15, 42, 0.6)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        transition: 'all 0.3s ease',
        ...(hover && {
          '&:hover': {
            bgcolor: 'rgba(25, 25, 55, 0.75)',
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
          },
        }),
        ...sx,
      }}
      {...props}
    >
      {children}
    </Card>
  );
}

// ─── GlassButton ───────────────────────────────────────────────────
interface GlassButtonProps extends ButtonProps {
  children: ReactNode;
  glass?: boolean;
}

export function GlassButton({ children, glass = false, sx, ...props }: GlassButtonProps) {
  if (glass) {
    return (
      <Button
        sx={{
          bgcolor: 'rgba(15, 15, 42, 0.6)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          color: '#fff',
          textTransform: 'none',
          fontWeight: 600,
          px: 3,
          py: 1,
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: 'rgba(25, 25, 55, 0.8)',
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
          },
          ...sx,
        }}
        {...props}
      >
        {children}
      </Button>
    );
  }

  return (
    <Button
      sx={{
        borderRadius: '16px',
        textTransform: 'none',
        fontWeight: 600,
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)',
        boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
        transition: 'all 0.2s ease',
        '&:hover': {
          background: 'linear-gradient(135deg, #7c83ff, #a78bfa, #f472b6)',
          boxShadow: '0 8px 28px rgba(99, 102, 241, 0.6)',
          transform: 'translateY(-2px)',
        },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
}

// ─── GlassNav ─────────────────────────────────────────────────────
interface GlassNavProps extends AppBarProps {
  children: ReactNode;
}

export function GlassNav({ children, sx, ...props }: GlassNavProps) {
  return (
    <AppBar
      position="static"
      sx={{
        bgcolor: 'rgba(15, 15, 42, 0.6)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
        borderRadius: 0,
        ...sx,
      }}
      {...props}
    >
      {children}
    </AppBar>
  );
}

// ─── GlassIconButton ──────────────────────────────────────────────
interface GlassIconButtonProps extends IconButtonProps {
  children: ReactNode;
}

export function GlassIconButton({ children, sx, ...props }: GlassIconButtonProps) {
  return (
    <IconButton
      sx={{
        bgcolor: 'rgba(15, 15, 42, 0.6)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: '#fff',
        transition: 'all 0.2s ease',
        '&:hover': {
          bgcolor: 'rgba(124, 131, 255, 0.2)',
          transform: 'scale(1.05)',
        },
        ...sx,
      }}
      {...props}
    >
      {children}
    </IconButton>
  );
}

// ─── GlassChip ───────────────────────────────────────────────────
interface GlassChipProps extends ChipProps {
  children: ReactNode;
}

export function GlassChip({ children, sx, ...props }: GlassChipProps) {
  return (
    <Chip
      sx={{
        bgcolor: 'rgba(15, 15, 42, 0.6)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        color: '#fff',
        fontWeight: 600,
        ...sx,
      }}
      {...props}
    >
      {children}
    </Chip>
  );
}

// ─── GradientText ────────────────────────────────────────────────
interface GradientTextProps {
  children: ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'subtitle1' | 'subtitle2' | 'body1' | 'body2';
  sx?: any;
}

export function GradientText({ children, variant = 'h6', sx }: GradientTextProps) {
  return (
    <Typography
      variant={variant}
      sx={{
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        fontWeight: 700,
        ...sx,
      }}
    >
      {children}
    </Typography>
  );
}

// ─── Tooltip ─────────────────────────────────────────────────────
interface GlassTooltipProps extends TooltipProps {
  children: ReactElement;
}

export function GlassTooltip({ children, ...props }: GlassTooltipProps) {
  return (
    <Tooltip
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: 'rgba(15, 15, 42, 0.9)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            fontSize: 12,
            fontWeight: 500,
          },
        },
      }}
      {...props}
    >
      {children}
    </Tooltip>
  );
}
