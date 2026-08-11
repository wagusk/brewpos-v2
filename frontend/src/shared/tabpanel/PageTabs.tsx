/**
 * PageTabs - orchestrator that renders Tabs + TabPanels in one shot.
 * Each tab is a small component; PageTabs handles the index state.
 */

import { useState } from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import { useTheme } from '../../core/theme/monoTheme';
import TabPanel from './TabPanel';

export interface TabSpec {
  label: string;
  icon?: React.ReactNode;
  component: React.ReactNode;
}

interface Props {
  tabs: TabSpec[];
  defaultIndex?: number;
  onChange?: (idx: number) => void;
}

export default function PageTabs({ tabs, defaultIndex = 0, onChange }: Props) {
  const c = useTheme();
  const [tab, setTab] = useState(defaultIndex);
  return (
    <Box>
      <Tabs
        value={tab}
        onChange={(_, v) => { setTab(v); onChange?.(v); }}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          borderBottom: '1px solid ' + c.divider,
          minHeight: 48,
          '& .MuiTab-root': {
            color: c.subtext,
            textTransform: 'none',
            fontSize: c.fontSize('body1'),
            fontWeight: 600,
            minHeight: 48,
            px: 3,
          },
          '& .Mui-selected': { color: c.text + ' !important' },
          '& .MuiTabs-indicator': { backgroundColor: c.button, height: 3 },
        }}
      >
        {tabs.map((t, i) => (
          <Tab key={i} label={t.label} icon={t.icon} iconPosition="start" />
        ))}
     </Tabs>
      {tabs.map((t, i) => (
        <TabPanel key={i} value={tab} index={i}>
          {t.component}
     </TabPanel>
      ))}
   </Box>
  );
}
