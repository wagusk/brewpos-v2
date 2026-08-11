/**
 * LayoutSlider — shared slider primitive used by Settings tabs.
 * Theme-driven. No hardcoded values.
 */

import { Box, Typography, Button } from '@mui/material';
import { useTheme } from '../../../core/theme/monoTheme';

interface Props {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

export default function LayoutSlider({ label, unit, value, min, max, step, onChange }: Props) {
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
        <Box sx={{ flex: 1, height: 6, bgcolor: c.input, borderRadius: 3, border: '1px solid ' + c.inputBorder, position: 'relative' }}>
          <Box sx={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: ((value - min) / (max - min)) * 100 + '%',
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
