import { useState } from 'react';
import {
  Box, Typography, Button, Paper, Alert,
} from '@mui/material';

import RestartAltIcon from '@mui/icons-material/RestartAlt';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import { useTheme } from '../../core/theme/monoTheme';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}

function Slider({ label, value, min, max, step, unit = '', onChange }: SliderProps) {
  const c = useTheme();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontSize: c.fontSize('body1'), color: c.text, fontWeight: 600 }}>{label}</Typography>
        <Typography sx={{ fontSize: c.fontSize('body2'), color: c.subtext, fontFamily: 'monospace' }}>
          {value}{unit}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          onClick={() => onChange(Math.max(min, value - step))}
          sx={{ minWidth: 36, color: c.text, borderColor: c.buttonBorder, bgcolor: c.card, '&:hover': { bgcolor: c.cardHover, borderColor: c.button } }}
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
          sx={{ minWidth: 36, color: c.text, borderColor: c.buttonBorder, bgcolor: c.card, '&:hover': { bgcolor: c.cardHover, borderColor: c.button } }}
        >
          +
        </Button>
      </Box>
    </Box>
  );
}

export default function UISettingsPage() {
  const c = useTheme();
  const [saved, setSaved] = useState(false);

  const handleReset = () => {
    c.resetUI();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto', bgcolor: c.page }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography sx={{ fontSize: c.fontSize('h2'), fontWeight: 700, color: c.text }}>UI Settings</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>

          <Button
            variant="outlined"
            startIcon={<RestartAltIcon />}
            onClick={handleReset}
            sx={{
              color: c.text, borderColor: c.buttonBorder, bgcolor: c.card,
              borderRadius: `${c.ui.buttonRadius}px`,
              minHeight: c.ui.buttonMinHeight,
              '&:hover': { bgcolor: c.cardHover, borderColor: c.button },
              backgroundImage: 'none', boxShadow: 'none',
            }}
          >
            Reset all
          </Button>
        </Box>
      </Box>

      {saved && <Alert sx={{ mb: 2, bgcolor: c.chip, color: c.text, border: `1px solid ${c.cardBorder}`, borderRadius: `${c.ui.inputRadius}px` }}>Settings saved</Alert>}

      {/* Font */}
      <Paper sx={{ p: 3, mb: 2, bgcolor: c.card, border: `1px solid ${c.cardBorder}`, borderRadius: `${c.ui.cardRadius}px`, boxShadow: 'none' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <TextFieldsIcon sx={{ color: c.text }} />
          <Typography sx={{ fontSize: c.fontSize('h5'), fontWeight: 700, color: c.text }}>Font</Typography>
        </Box>
        <Typography sx={{ fontSize: c.fontSize('caption'), color: c.subtext, mb: 2 }}>
          Scale all text in the app. Useful for touchscreens at a distance.
        </Typography>
        <Slider
          label="Font scale"
          value={c.ui.fontScale}
          min={0.8}
          max={1.6}
          step={0.05}
          unit="×"
          onChange={(v) => c.setUI({ fontScale: Number(v.toFixed(2)) })}
        />
        <Box sx={{ mt: 2, p: 2, bgcolor: c.input, borderRadius: `${c.ui.inputRadius}px`, border: `1px solid ${c.inputBorder}` }}>
          <Typography sx={{ fontSize: c.fontSize('h4'), color: c.text, fontWeight: 700 }}>Preview heading</Typography>
          <Typography sx={{ fontSize: c.fontSize('body1'), color: c.text }}>Preview body text — this is how regular content reads.</Typography>
          <Typography sx={{ fontSize: c.fontSize('caption'), color: c.subtext }}>Preview caption</Typography>
        </Box>
      </Paper>

      {/* Buttons */}
      <Paper sx={{ p: 3, mb: 2, bgcolor: c.card, border: `1px solid ${c.cardBorder}`, borderRadius: `${c.ui.cardRadius}px`, boxShadow: 'none' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <CropSquareIcon sx={{ color: c.text }} />
          <Typography sx={{ fontSize: c.fontSize('h5'), fontWeight: 700, color: c.text }}>Buttons</Typography>
        </Box>
        <Typography sx={{ fontSize: c.fontSize('caption'), color: c.subtext, mb: 2 }}>
          Adjust button size and corner radius for touch screens.
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Slider
            label="Button height"
            value={c.ui.buttonMinHeight}
            min={40}
            max={96}
            step={4}
            unit="px"
            onChange={(v) => c.setUI({ buttonMinHeight: v })}
          />
          <Slider
            label="Corner radius"
            value={c.ui.buttonRadius}
            min={0}
            max={32}
            step={2}
            unit="px"
            onChange={(v) => c.setUI({ buttonRadius: v })}
          />
          <Slider
            label="Card radius"
            value={c.ui.cardRadius}
            min={0}
            max={32}
            step={2}
            unit="px"
            onChange={(v) => c.setUI({ cardRadius: v })}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Button
            variant="contained"
            sx={{
              bgcolor: c.button, color: c.buttonText,
              minHeight: c.ui.buttonMinHeight,
              borderRadius: `${c.ui.buttonRadius}px`,
              px: 3, fontWeight: 600,
              backgroundImage: 'none', boxShadow: 'none',
              '&:hover': { bgcolor: c.buttonHover, backgroundImage: 'none' },
            }}
          >
            Primary
          </Button>
          <Button
            variant="outlined"
            sx={{
              color: c.text, borderColor: c.buttonBorder, bgcolor: c.card,
              minHeight: c.ui.buttonMinHeight,
              borderRadius: `${c.ui.buttonRadius}px`,
              px: 3, fontWeight: 600,
              backgroundImage: 'none', boxShadow: 'none',
              '&:hover': { bgcolor: c.cardHover, backgroundImage: 'none' },
            }}
          >
            Secondary
          </Button>
        </Box>
      </Paper>

      {/* Layout */}
      <Paper sx={{ p: 3, mb: 2, bgcolor: c.card, border: `1px solid ${c.cardBorder}`, borderRadius: `${c.ui.cardRadius}px`, boxShadow: 'none' }}>
        <Typography sx={{ fontSize: c.fontSize('h5'), fontWeight: 700, color: c.text, mb: 0.5 }}>Layout</Typography>
        <Typography sx={{ fontSize: c.fontSize('caption'), color: c.subtext, mb: 2 }}>
          Adjust spacing and sidebar width.
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Slider
            label="Card gap"
            value={c.ui.cardGap}
            min={4}
            max={32}
            step={2}
            unit="px"
            onChange={(v) => c.setUI({ cardGap: v })}
          />
          <Slider
            label="Bottom bar height"
            value={c.ui.bottomBarHeight}
            min={56}
            max={120}
            step={4}
            unit="px"
            onChange={(v) => c.setUI({ bottomBarHeight: v })}
          />
          <Slider
            label="Top bar height"
            value={c.ui.barHeight}
            min={48}
            max={120}
            step={4}
            unit="px"
            onChange={(v) => c.setUI({ barHeight: v })}
          />
          <Slider
            label="Sidebar width"
            value={c.ui.sidebarWidth}
            min={56}
            max={120}
            step={4}
            unit="px"
            onChange={(v) => c.setUI({ sidebarWidth: v })}
          />
        </Box>
      </Paper>

      {/* Motion */}
      <Paper sx={{ p: 3, mb: 2, bgcolor: c.card, border: `1px solid ${c.cardBorder}`, borderRadius: `${c.ui.cardRadius}px`, boxShadow: 'none' }}>
        <Typography sx={{ fontSize: c.fontSize('h5'), fontWeight: 700, color: c.text, mb: 0.5 }}>Motion</Typography>
        <Typography sx={{ fontSize: c.fontSize('caption'), color: c.subtext, mb: 2 }}>
          Brew-POS v2 is static by default (no animation). Set duration to 0 for instant transitions.
        </Typography>
        <Slider
          label="Animation duration"
          value={c.ui.animationDuration}
          min={0}
          max={500}
          step={50}
          unit="ms"
          onChange={(v) => c.setUI({ animationDuration: v })}
        />
      </Paper>

      <Button
        variant="contained"
        onClick={handleSave}
        sx={{
          bgcolor: c.button, color: c.buttonText,
          minHeight: c.ui.buttonMinHeight,
          borderRadius: `${c.ui.buttonRadius}px`,
          px: 4, fontWeight: 600,
          backgroundImage: 'none', boxShadow: 'none',
          '&:hover': { bgcolor: c.buttonHover, backgroundImage: 'none' },
        }}
      >
        Save settings
      </Button>
    </Box>
  );
}
