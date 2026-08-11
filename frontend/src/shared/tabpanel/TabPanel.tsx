/**
 * TabPanel - generic content wrapper for tab pages.
 * Replaces the duplicated TabPanel helpers in AdminPage and SettingsPage.
 */

import { Box } from '@mui/material';

interface Props {
  value: number;
  index: number;
  children: React.ReactNode;
}

export default function TabPanel({ value, index, children }: Props) {
  if (value !== index) return null;
  return (
    <Box sx={{ pt: 2 }}>
      {children}
 </Box>
  );
}
