/**
 * SearchBar - themed search input.
 * Replaces the repeated <TextField> + onChange filter pattern across tabs.
 */

import { Box, TextField, InputAdornment } from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon, IconButton } from '@mui/material';
import { useTheme } from '../../core/theme/monoTheme';

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  width?: string | number;
}

export default function SearchBar({ value, onChange, placeholder = 'Search...', width = 240 }: Props) {
  const c = useTheme();
  return (
    <TextField
      size="small"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      sx={{
        width,
        '& .MuiOutlinedInput-root': {
          bgcolor: c.input,
          color: c.text,
          borderRadius: c.ui.inputRadius + 'px',
          '& fieldset': { borderColor: c.buttonBorder },
          '&:hover fieldset': { borderColor: c.button },
          '&.Mui-focused fieldset': { borderColor: c.button },
        },
        '& input': { color: c.text, fontSize: c.fontSize('body2') },
        '& input::placeholder': { color: c.subtext, opacity: 0.7 },
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: c.subtext, fontSize: '1rem' }} />
         </InputAdornment>
        ),
        endAdornment: value ? (
          <InputAdornment position="end">
            <IconButton size="small" onClick={() => onChange('')}>
              <ClearIcon sx={{ fontSize: '1rem', color: c.subtext }} />
         </IconButton>
         </InputAdornment>
        ) : undefined,
      }}
    />
  );
}
