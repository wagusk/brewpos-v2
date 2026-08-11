/**
 * ErrorState - centered error message with retry button.
 */

import { Box, Typography, Button } from '@mui/material';
import { ErrorOutline as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useTheme } from '../../core/theme/monoTheme';

interface Props {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  height?: string | number;
}

export default function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Retry',
  height = '100%',
}: Props) {
  const c = useTheme();
  return (
    <Box sx={{
      height, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 1.5,
      p: 4,
    }}>
      <ErrorIcon sx={{ fontSize: '3rem', color: c.errorText }} />
      <Typography sx={{ color: c.text, fontSize: c.fontSize('h6'), fontWeight: 700 }}>
        {title}
    </Typography>
      {message && (
        <Typography sx={{ color: c.subtext, fontSize: c.fontSize('body2'), textAlign: 'center', maxWidth: 480 }}>
          {message}
      </Typography>
     )}
      {onRetry && (
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onRetry}
          sx={{
            color: c.text, borderColor: c.buttonBorder, bgcolor: c.card,
            borderRadius: c.ui.inputRadius + 'px',
            backgroundImage: 'none',
            '&:hover': { bgcolor: c.cardHover, borderColor: c.button, backgroundImage: 'none' },
          }}
        >
          {retryLabel}
      </Button>
     )}
 </Box>
  );
}
