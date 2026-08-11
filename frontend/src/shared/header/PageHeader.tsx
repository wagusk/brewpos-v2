/**
 * PageHeader - consistent page title bar.
 * Replaces ad-hoc Box+Typography header rows.
 */

import { Box, Typography, Stack, Chip } from '@mui/material';
import { useTheme } from '../../core/theme/monoTheme';

interface Props {
  title: string;
  subtitle?: string;
  badge?: { label: string; color?: string };
  actions?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, badge, actions }: Props) {
  const c = useTheme();
  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      mb: 2, pb: 1.5, borderBottom: '1px solid ' + c.divider,
    }}>
      <Stack spacing={0.25}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography variant="h5" sx={{ color: c.text, fontWeight: 700 }}>
            {title}
     </Typography>
          {badge && (
            <Chip
              size="small"
              label={badge.label}
              sx={{
                bgcolor: badge.color ?? c.chip,
                color: c.text,
                fontSize: c.fontSize('caption'),
                height: 22,
              }}
            />
          )}
       </Stack>
        {subtitle && (
          <Typography sx={{ color: c.subtext, fontSize: c.fontSize('body2') }}>
            {subtitle}
     </Typography>
     )}
     </Stack>
      {actions && (
        <Stack direction="row" spacing={1}>
          {actions}
       </Stack>
      )}
   </Box>
  );
}
