/**
 * CashierSettingsPopup — gear icon + dialog with live sliders.
 *
 * Lets an admin/master adjust every layout dimension for the cashier
 * page (currently the floor plan). Writes through to localStorage;
 * the cashier page re-renders via useCashierLayout.
 *
 * Role gating: read the user role from localStorage 'brewpos_user'.
 * Only admin / master can see the gear. Other roles don't render it
 * at all — keeps the UI clean and matches "managed later" until a
 * full role_allowance system is built.
 */

import { useState } from 'react';
import { Box, Tooltip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Paper } from '@mui/material';
import { Settings as SettingsIcon, RestartAlt, OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../core/theme/monoTheme';
import { useCashierLayout, CASHIER_LAYOUT_DEFAULTS } from '../layoutConfig';

function getCurrentRole(): string | null {
  try {
    const raw = localStorage.getItem('brewpos_user');
    if (!raw) return null;
    const u = JSON.parse(raw);
    return u?.role ?? null;
  } catch {
    return null;
  }
}

interface SliderRowProps {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

function SliderRow({ label, unit, value, min, max, step, onChange }: SliderRowProps) {
  const c = useTheme();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: c.fontSize('body2'), color: c.text, fontWeight: 600 }}>
          {label}
       </Typography>
        <Typography sx={{ fontSize: c.fontSize('body2'), color: c.subtext, fontFamily: 'monospace' }}>
          {value}{unit}
       </Typography>
     </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          onClick={() => onChange(Math.max(min, value - step))}
          sx={{
            minWidth: 36, color: c.text, borderColor: c.buttonBorder, bgcolor: c.card,
            backgroundImage: 'none',
            '&:hover': { bgcolor: c.cardHover, borderColor: c.button, backgroundImage: 'none' },
          }}
        >
          −
       </Button>
        <Box sx={{ flex: 1, height: 6, bgcolor: c.input, borderRadius: 3, border: `1px solid ${c.inputBorder}`, position: 'relative' }}>
          <Box sx={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${((value - min) / (max - min)) * 100}%`,
            bgcolor: c.button, borderRadius: 3,
          }} />
       </Box>
        <Button
          size="small"
          variant="outlined"
          onClick={() => onChange(Math.min(max, value + step))}
          sx={{
            minWidth: 36, color: c.text, borderColor: c.buttonBorder, bgcolor: c.card,
            backgroundImage: 'none',
            '&:hover': { bgcolor: c.cardHover, borderColor: c.button, backgroundImage: 'none' },
          }}
        >
          +
       </Button>
     </Box>
   </Box>
  );
}

export default function CashierSettingsPopup() {
  const c = useTheme();
  const { config, setLayout, reset } = useCashierLayout();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const role = getCurrentRole();
  const canEdit = role === 'admin' || role === 'master';

  if (!canEdit) return null;

  return (
    <>
      <Tooltip title="Cashier layout settings">
        <IconButton
          size="small"
          onClick={() => setOpen(true)}
          sx={{
            color: c.subtext, bgcolor: c.card, border: `1px solid ${c.cardBorder}`,
            borderRadius: `${c.ui.inputRadius}px`,
            backgroundImage: 'none',
            '&:hover': { bgcolor: c.cardHover, color: c.text, borderColor: c.button, backgroundImage: 'none' },
          }}
        >
          <SettingsIcon fontSize="small" />
       </IconButton>
     </Tooltip>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: c.card,
            color: c.text,
            border: `1px solid ${c.cardBorder}`,
            borderRadius: `${c.ui.cardRadius}px`,
            boxShadow: c.ui.cardShadow,
          },
        }}
      >
        <DialogTitle sx={{ color: c.text, fontSize: c.fontSize('h6'), fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Cashier Layout Settings</span>
          <Button
            size="small"
            variant="outlined"
            startIcon={<RestartAlt />}
            onClick={reset}
            sx={{
              color: c.subtext, borderColor: c.buttonBorder, bgcolor: c.input,
              borderRadius: `${c.ui.inputRadius}px`,
              fontSize: c.fontSize('caption'),
              minHeight: c.ui.minTouchTarget * 0.7,
              backgroundImage: 'none',
              '&:hover': { bgcolor: c.cardHover, borderColor: c.button, backgroundImage: 'none' },
            }}
          >
            Reset defaults
         </Button>
       </DialogTitle>
        <DialogContent>
          <Paper sx={{
            p: 2,
            bgcolor: c.input,
            border: `1px solid ${c.inputBorder}`,
            borderRadius: `${c.ui.inputRadius}px`,
            mb: 2,
            boxShadow: 'none',
          }}>
            <Typography sx={{ fontSize: c.fontSize('caption'), color: c.subtext, mb: 0.5 }}>
              Defaults
           </Typography>
            <Typography sx={{ fontSize: c.fontSize('caption'), color: c.text, fontFamily: 'monospace' }}>
              {JSON.stringify(CASHIER_LAYOUT_DEFAULTS)}
           </Typography>
         </Paper>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <SliderRow
              label="Bill column width (left)"
              unit="px"
              value={config.floorLeftWidth}
              min={240}
              max={800}
              step={10}
              onChange={(v) => setLayout({ floorLeftWidth: v })}
            />
            <SliderRow
              label="Table tile height"
              unit="px"
              value={config.floorTileHeight}
              min={80}
              max={180}
              step={4}
              onChange={(v) => setLayout({ floorTileHeight: v })}
            />
            <SliderRow
              label="Table tile min width"
              unit="px"
              value={config.floorTileMin}
              min={80}
              max={240}
              step={10}
              onChange={(v) => setLayout({ floorTileMin: v })}
            />
            <SliderRow
              label="Tile gap"
              unit="px"
              value={config.floorGap}
              min={4}
              max={24}
              step={2}
              onChange={(v) => setLayout({ floorGap: v })}
            />
            <SliderRow
              label="Header strip height"
              unit="px"
              value={config.headerHeight}
              min={48}
              max={96}
              step={4}
              onChange={(v) => setLayout({ headerHeight: v })}
            />
         </Box>
       </DialogContent>
        <DialogActions>
          <Button
            onClick={() => { setOpen(false); nav('/settings/ui'); }}
            startIcon={<OpenInNewIcon />}
            sx={{
              color: c.subtext, borderColor: c.buttonBorder,
              borderRadius: `${c.ui.buttonRadius}px`,
              minHeight: c.ui.buttonMinHeight,
              backgroundImage: 'none',
              '&:hover': { bgcolor: c.cardHover, borderColor: c.button, backgroundImage: 'none' },
            }}
          >
            More UI settings
       </Button>
          <Button
            onClick={() => setOpen(false)}
            sx={{
              color: c.text, borderColor: c.buttonBorder,
              borderRadius: `${c.ui.buttonRadius}px`,
              minHeight: c.ui.buttonMinHeight,
              backgroundImage: 'none',
              '&:hover': { bgcolor: c.cardHover, borderColor: c.button, backgroundImage: 'none' },
            }}
          >
            Close
      </Button>
    </DialogActions>
     </Dialog>
    </>
  );
}
