/**
 * LoadingState - centered spinner with theme-driven colors.
 * Replaces ad-hoc CircularProgress + Box wrappers across pages.
 */

import { Box, CircularProgress, Typography } from '@mui/material';
import { useTheme } from '../../core/theme/monoTheme';

interface Props {
  message?: string;
  size?: number;
  height?: string | number;
}

export default function LoadingState({ message, size = 36, height = '100%' }: Props) {
  const c = useTheme();
  return (
    <Box sx={{
      height, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 1.5,
    }}>
      <CircularProgress size={size} sx={{ color: c.button }} />
      {message && (
        <Typography sx={{ color: c.subtext, fontSize: c.fontSize('body2') }}>
          {message}
     </Typography>
    )}
 </Box>
  );
}
