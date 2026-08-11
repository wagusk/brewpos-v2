/**
 * CrudToolbar - the standard title + search + add button row
 * used above DataTable in every CRUD tab.
 */

import { Stack, Typography, Button, Box } from '@mui/material';
import { Add } from '@mui/icons-material';
import { useTheme } from '../../core/theme/monoTheme';
import { SearchBar } from '../searchbar';

interface Props {
  title: string;
  count?: number;
  search: string;
  onSearchChange: (val: string) => void;
  onAdd: () => void;
  addLabel?: string;
  searchPlaceholder?: string;
  extraActions?: React.ReactNode;
}

export default function CrudToolbar({
  title, count, search, onSearchChange, onAdd,
  addLabel = 'Add', searchPlaceholder = 'Search...', extraActions,
}: Props) {
  const c = useTheme();
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
      <Stack direction="row" alignItems="baseline" spacing={1}>
        <Typography sx={{ color: c.text, fontSize: c.fontSize('h6'), fontWeight: 700 }}>
          {title}
  </Typography>
        {count !== undefined && (
          <Typography sx={{ color: c.subtext, fontSize: c.fontSize('body2') }}>
            ({count})
  </Typography>
        )}
    </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        {extraActions}
        <SearchBar
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={onAdd}
          sx={{
            backgroundImage: 'none',
            bgcolor: c.button, color: c.bg,
            borderRadius: c.ui.buttonRadius + 'px',
            textTransform: 'none',
            '&:hover': { backgroundImage: 'none', bgcolor: c.buttonHover },
          }}
        >
          {addLabel}
  </Button>
    </Stack>
  </Stack>
  );
}
