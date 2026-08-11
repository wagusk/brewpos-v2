/**
 * EmptyState - centered icon + title + subtitle.
 * Used by every list/grid when there's no data.
 */

import { Box, Typography } from '@mui/material';
import { Inbox as InboxIcon } from '@mui/icons-material';
import { useTheme } from '../../core/theme/monoTheme';

interface Props {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  height?: string | number;
}

export default function EmptyState({ title = 'Nothing here yet', subtitle, icon, height = '100%' }: Props) {
  const c = useTheme();
  return (
    <Box sx={{
      height, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 1,
      opacity: 0.7, p: 4,
    }}>
      <Box sx={{ fontSize: '3rem', color: c.subtext, opacity: 0.6 }}>
        {icon ?? <InboxIcon sx={{ fontSize: '3rem' }} />}
    </Box>
      <Typography sx={{ color: c.text, fontSize: c.fontSize('body1'), fontWeight: 600 }}>
        {title}
  </Typography>
      {subtitle && (
        <Typography sx={{ color: c.subtext, fontSize: c.fontSize('body2'), textAlign: 'center', maxWidth: 360 }}>
          {subtitle}
      </Typography>
     )}
 </Box>
  );
}
