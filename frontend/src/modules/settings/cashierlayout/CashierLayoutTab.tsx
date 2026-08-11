/**
 * CashierLayoutTab — live-adjustable cashier page dimensions.
 * Slider values are read/written through useCashierLayout (localStorage).
 */

import { Box, Typography, Paper, Button, Stack } from '@mui/material';
import { RestartAlt } from '@mui/icons-material';
import { useTheme } from '../../../core/theme/monoTheme';
import { useCashierLayout, CASHIER_LAYOUT_DEFAULTS } from '../../cashier/layoutConfig';
import LayoutSlider from './LayoutSlider';

export default function CashierLayoutTab() {
  const c = useTheme();
  const { config, setLayout, reset } = useCashierLayout();

  return (
    <Paper sx={{ p: 3, maxWidth: 600 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Cashier Layout</Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<RestartAlt />}
          onClick={reset}
          sx={{
            color: c.subtext, borderColor: c.buttonBorder, bgcolor: c.card,
            borderRadius: c.ui.inputRadius + 'px',
            minHeight: c.ui.minTouchTarget * 0.7,
            backgroundImage: 'none',
            '&:hover': { bgcolor: c.cardHover, borderColor: c.button, backgroundImage: 'none' },
          }}
        >
          Reset to defaults
    </Button>
  </Box>
      <Typography sx={{ color: c.subtext, fontSize: c.fontSize('body2'), mb: 2 }}>
        Changes apply live to the cashier page. Values are stored in your browser.
  </Typography>
      <Stack spacing={2}>
        <LayoutSlider
          label="Bill column width (left)"
          unit="px"
          value={config.floorLeftWidth}
          min={240}
          max={800}
          step={10}
          onChange={(v) => setLayout({ floorLeftWidth: v })}
        />
        <LayoutSlider
          label="Table tile min width"
          unit="px"
          value={config.floorTileMin}
          min={80}
          max={240}
          step={10}
          onChange={(v) => setLayout({ floorTileMin: v })}
        />
        <LayoutSlider
          label="Table tile height"
          unit="px"
          value={config.floorTileHeight}
          min={80}
          max={180}
          step={4}
          onChange={(v) => setLayout({ floorTileHeight: v })}
        />
        <LayoutSlider
          label="Tile gap"
          unit="px"
          value={config.floorGap}
          min={4}
          max={24}
          step={2}
          onChange={(v) => setLayout({ floorGap: v })}
        />
        <LayoutSlider
          label="Header strip height"
          unit="px"
          value={config.headerHeight}
          min={48}
          max={96}
          step={4}
          onChange={(v) => setLayout({ headerHeight: v })}
        />
   </Stack>
      <Box sx={{ mt: 3, p: 2, bgcolor: c.input, border: '1px solid ' + c.inputBorder, borderRadius: c.ui.inputRadius + 'px' }}>
        <Typography sx={{ fontSize: c.fontSize('caption'), color: c.subtext, mb: 0.5 }}>
          Defaults
     </Typography>
        <Typography sx={{ fontSize: c.fontSize('caption'), color: c.text, fontFamily: 'monospace' }}>
          {JSON.stringify(CASHIER_LAYOUT_DEFAULTS, null, 0)}
     </Typography>
   </Box>
</Paper>
  );
}
