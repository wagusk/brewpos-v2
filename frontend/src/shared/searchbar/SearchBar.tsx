/**
 * SearchBar - themed search input using POSTextField.
 * Replaces the repeated <TextField> + onChange filter pattern across tabs.
 */

import { useTheme } from '../../core/theme/monoTheme';
import { POSTextField } from '../../components';
import { Search as SearchIcon } from '@mui/icons-material';

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  width?: string | number;
}

export default function SearchBar({ value, onChange, placeholder = 'Search...', width = 240 }: Props) {
  const c = useTheme();
  return (
    <div style={{ width }}>
      <POSTextField
        variant="search"
        size="sm"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        icon={<SearchIcon />}
        fullWidth
      />
    </div>
  );
}
