/**
 * CrudToolbar - the standard title + search + add button row
 * used above DataTable in every CRUD tab.
 * Uses POSButton, POSIcon, SearchBar.
 */

import { useTheme } from '../../core/theme/monoTheme';
import { POSButton, POSIcon } from '../../components';
import { Add } from '@mui/icons-material';
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
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: `${c.ui.cardGap}px`,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: `${c.ui.spacingBase}px` }}>
        <span style={{ color: c.text, fontSize: c.fontSize('h6'), fontWeight: 700 }}>
          {title}
        </span>
        {count !== undefined && (
          <span style={{ color: c.subtext, fontSize: c.fontSize('body2') }}>
            ({count})
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: `${c.ui.spacingBase}px`, alignItems: 'center' }}>
        {extraActions}
        <SearchBar
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />
        <POSButton
          variant="primary"
          size="md"
          icon={<Add />}
          onClick={onAdd}
        >
          {addLabel}
        </POSButton>
      </div>
    </div>
  );
}
