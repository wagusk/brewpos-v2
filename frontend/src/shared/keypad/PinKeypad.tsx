/**
 * PinKeypad - shared numeric PIN entry.
 * Replaces the ad-hoc keypad in LoginPage.
 *
 * Theme-driven, no hardcoded colors.
 */

import { Box, Button, TextField, IconButton, Stack } from '@mui/material';
import { Backspace as BackspaceIcon } from '@mui/icons-material';
import { useTheme } from '../../core/theme/monoTheme';

interface Props {
  value: string;
  onChange: (val: string) => void;
  maxLength?: number;
  masked?: boolean;
  disabled?: boolean;
}

export default function PinKeypad({ value, onChange, maxLength = 6, masked = true, disabled }: Props) {
  const c = useTheme();
  const press = (k: string) => {
    if (disabled) return;
    if (k === 'C') return onChange('');
    if (k === '<') return onChange(value.slice(0, -1));
    if (value.length < maxLength) onChange(value + k);
  };

  const keys: string[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '<'];

  return (
    <Stack spacing={2} alignItems="center">
      <TextField
        value={masked ? '•'.repeat(value.length) : value}
        placeholder="—"
        inputProps={{ readOnly: true, style: { textAlign: 'center', letterSpacing: 8, fontSize: '1.5rem' } }}
        sx={{
          width: 240,
          '& .MuiOutlinedInput-root': {
            bgcolor: c.input,
            color: c.text,
            '& fieldset': { borderColor: c.buttonBorder },
          },
        }}
      />
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: c.ui.cardGap,
        width: 240,
      }}>
        {keys.map((k) => (
          <Button
            key={k}
            variant="contained"
            disabled={disabled}
            onClick={() => press(k)}
            sx={{
              minHeight: c.ui.buttonMinHeight,
              fontSize: c.fontSize('h6'),
              fontWeight: 600,
              borderRadius: c.ui.buttonRadius + 'px',
              bgcolor: k === 'C' ? c.errorBorder : c.button,
              color: c.bg,
              backgroundImage: 'none',
              '&:hover': {
                backgroundImage: 'none',
                bgcolor: k === 'C' ? c.errorText : c.buttonHover,
              },
              '&.Mui-disabled': {
                bgcolor: c.input,
                color: c.subtext,
                opacity: 0.4,
              },
            }}
          >
            {k === '<' ? <BackspaceIcon fontSize="small" /> : k}
  </Button>
        ))}
  </Box>
</Stack>
  );
}
