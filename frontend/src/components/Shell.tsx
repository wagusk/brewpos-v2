/**
 * Shell — app chrome with bottom navigation bar.
 *
 * Full-screen content area with a configurable-height bottom bar.
 * Each page button shows icon + label. Active page highlighted.
 * Logout at the right end of the bar.
 */

import {
  Box, Tooltip,
} from '@mui/material';
import {
  PointOfSale as PointOfSaleIcon,
  Restaurant as RestaurantIcon,
  SoupKitchen as SoupKitchenIcon,
  LocalBar as LocalBarIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Settings as SettingsIcon,
  Percent as PercentIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { MODULES } from '../app/moduleRegistry';
import { useTheme } from '../core/theme/monoTheme';
import { t } from '../modules/multilingual/i18n';
import TopBar from '../shared/header/TopBar';

const ICONS: Record<string, React.ReactNode> = {
  PointOfSale: <PointOfSaleIcon fontSize="small" />,
  Restaurant: <RestaurantIcon fontSize="small" />,
  SoupKitchen: <SoupKitchenIcon fontSize="small" />,
  LocalBar: <LocalBarIcon fontSize="small" />,
  AdminPanelSettings: <AdminPanelSettingsIcon fontSize="small" />,
  Settings: <SettingsIcon fontSize="small" />,
  Percent: <PercentIcon fontSize="small" />,
  Cancel: <CancelIcon fontSize="small" />,
};

export default function Shell({ children, title = 'Brew-POS v2' }: { children: React.ReactNode; title?: string }) {
  const nav = useNavigate();
  const location = useLocation();
  const c = useTheme();

  const userStr = localStorage.getItem('brewpos_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userRole = user?.role;
  const userPermissions: string[] = user?.permissions || [];

  const hasPermission = (permission?: string | null) => {
    if (!permission) return true;
    if (userRole === 'admin' || userRole === 'master') return true;
    return userPermissions.includes(permission);
  };

  // Only show top-level pages in bottom bar (e.g. /pos, /admin — not /admin/discount)
  const visibleModules = MODULES.filter(m => m.enabled && m.path !== '/login' && !m.path.includes('/', 1) && hasPermission(m.permission));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: c.page }}>
      {/* Top bar */}
      <TopBar title={title} />

      {/* Full-screen content area */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {children}
      </Box>

      {/* Bottom navigation bar */}
      <Box
        sx={{
          height: c.ui.bottomBarHeight + 'px',
          bgcolor: c.card,
          borderTop: '1px solid ' + c.cardBorder,
          display: 'flex',
          alignItems: 'center',
          px: 1,
          gap: 0.5,
          boxShadow: 'none',
          flexShrink: 0,
        }}
      >
        {/* Page buttons */}
        {visibleModules.map((m) => {
          const isActive = location.pathname === m.path || location.pathname.startsWith(m.path + '/');
          const icon = ICONS[m.icon || ''] || <PointOfSaleIcon fontSize="small" />;
          return (
            <Tooltip key={m.key} title={t(m.labelKey)}>
              <Box
                onClick={() => nav(m.path)}
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.25,
                  height: c.ui.bottomBarHeight - 12 + 'px',
                  borderRadius: c.ui.inputRadius + 'px',
                  cursor: 'pointer',
                  bgcolor: isActive ? c.chipActive : 'transparent',
                  color: isActive ? c.chipActiveText : c.muted,
                  border: isActive ? '1px solid ' + c.chipBorder : '1px solid transparent',
                  '&:hover': {
                    bgcolor: isActive ? c.buttonHover : c.chip,
                    borderColor: c.chipBorder,
                    color: c.text,
                  },
                  backgroundImage: 'none',
                  transition: 'background-color 0.15s, color 0.15s',
                }}
              >
                {icon}
                <Box component="span" sx={{ fontSize: c.fontSize('caption'), lineHeight: 1, fontWeight: isActive ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', textAlign: 'center' }}>
                  {t(m.labelKey)}
                </Box>
              </Box>
            </Tooltip>
          );
        })}

        {/* Spacer */}
        <Box sx={{ flex: 0.5 }} />


      </Box>
    </Box>
  );
}
