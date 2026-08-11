/**
 * TopBar — app chrome top bar.
 *
 * Layout: [username] .......... [title] .......... [clock] [logout]
 * All dimensions from useTheme (barHeight, fontScale).
 * Clock updates every second.
 */

import { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../core/theme/monoTheme';
import { t } from '../../modules/multilingual/i18n';

interface Props {
  title: string;
}

export default function TopBar({ title }: Props) {
  const nav = useNavigate();
  const c = useTheme();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const userStr = localStorage.getItem('brewpos_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userName = user?.name || t('shell.role');

  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <Box
      sx={{
        height: c.ui.barHeight + 'px',
        bgcolor: c.card,
        borderBottom: '1px solid ' + c.cardBorder,
        display: 'flex',
        alignItems: 'center',
        px: 2,
        gap: 2,
        flexShrink: 0,
      }}
    >
      {/* Left: logged-in username */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: c.fontSize('body1'),
            color: c.text,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {userName}
        </Typography>
      </Box>

      {/* Middle: title */}
      <Typography
        sx={{
          fontSize: c.fontSize('h5'),
          color: c.text,
          fontWeight: 700,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {title}
      </Typography>

      {/* Right: clock + logout */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
        <Typography
          sx={{
            fontSize: c.fontSize('body2'),
            color: c.subtext,
            fontFamily: 'monospace',
            whiteSpace: 'nowrap',
            mr: 0.5,
          }}
        >
          {timeStr}
        </Typography>
        <IconButton
          onClick={() => { localStorage.clear(); nav('/login'); }}
          sx={{ color: c.subtext, width: 48, height: 48, flexShrink: 0 }}
        >
          <LogoutIcon fontSize="medium" />
        </IconButton>
      </Box>
    </Box>
  );
}
