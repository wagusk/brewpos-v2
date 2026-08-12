/**
 * TableTile — single tile in the TableView grid.
 *
 * Color rules per instructions:
 * - Free table: green
 * - Occupied table: blue
 * - Printed or payment progress: light red
 */

import { useTheme } from '../../core/theme/monoTheme';
import { POSCard, POSIcon } from '../../components';
import { TableRestaurant as TableIcon } from '@mui/icons-material';
import { t } from '../multilingual/i18n';
import { getStatusInfo, type TableViewConfig } from './tableviewConfig';

export interface TableData {
  id: number;
  name: string;
  seats: number;
  active: boolean;
  section: string;
  sort: number;
  order_id: number | null;
  order_number: number | null;
  order_status: string | null;
  order_total: number | null;
  items_count: number | null;
  opened_at: string | null;
  occupancy_seconds: number | null;
  server_id: number | null;
  server_name: string | null;
  payment_status: string | null;
  paid_amount: number | null;
  outstanding_amount: number | null;
}

interface Props {
  table: TableData;
  selected: boolean;
  config: TableViewConfig;
  onSelect: (t: TableData) => void;
  sectionColor?: string;
}

function formatMoney(n: number | null | undefined): string {
  if (n == null) return '$0.00';
  return `$${n.toFixed(2)}`;
}

export default function TableTile({ table, selected, onSelect }: Props) {
  const c = useTheme();
  const isDisabled = !table.active;

  // Determine card background color and text color per user rules:
  // - Free table: green
  // - Occupied table: blue
  // - Printed or payment progress: light red
  let bgColor = c.card;
  let textColor = c.text;
  let subTextColor = c.subtext;

  const isFree = table.order_id == null || table.order_status === 'paid' || table.order_status === 'void';
  const isProgressOrPrinted = table.order_status === 'preparing' || table.order_status === 'ready' || table.order_status === 'served' || table.payment_status === 'partial' || table.payment_status === 'unpaid';

  if (!table.active) {
    bgColor = c.input;
    textColor = c.muted;
    subTextColor = c.muted;
  } else if (selected) {
    bgColor = c.button;
    textColor = c.buttonText;
    subTextColor = 'rgba(255,255,255,0.85)';
  } else if (isFree) {
    bgColor = c.success; // green
    textColor = c.buttonText;
    subTextColor = 'rgba(255,255,255,0.85)';
  } else if (isProgressOrPrinted) {
    bgColor = '#fee2e2'; // light red
    textColor = '#991b1b'; // dark red text for high contrast
    subTextColor = '#7f1d1d';
  } else {
    // Occupied table
    bgColor = c.button; // blue
    textColor = c.buttonText;
    subTextColor = 'rgba(255,255,255,0.85)';
  }

  const billAmount = table.order_total != null ? formatMoney(table.order_total) : (table.active ? t('tablesview.status.free') : '—');

  return (
    <POSCard
      variant="default"
      clickable
      selected={selected}
      disabled={isDisabled}
      onClick={() => onSelect(table)}
      padding="lg"
      minHeight={110}
      elevation="sm"
      style={{
        position: 'relative',
        border: 'none',
        backgroundColor: bgColor,
        borderRadius: `${c.ui.cardRadius}px`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        opacity: table.active ? 1 : 0.6,
        transition: 'transform 0.1s ease, box-shadow 0.1s ease',
      }}
    >
      {/* Title (Table Name) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: `${c.ui.spacingBase}px` }}>
          <POSIcon
            icon={<TableIcon />}
            size="md"
            color={textColor}
          />
          <span
            style={{
              fontWeight: 800,
              fontSize: c.fontSize('h5'),
              color: textColor,
              lineHeight: 1.1,
            }}
          >
            {table.name}
          </span>
        </div>
      </div>

      {/* Amount of bill */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: `${c.ui.spacingBase}px` }}>
        <span
          style={{
            fontSize: c.fontSize('caption'),
            color: subTextColor,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {table.order_id != null ? t('tablesview.field.total') : t('tablesview.status.free')}
        </span>
        <span
          style={{
            fontSize: c.fontSize('h6'),
            fontWeight: 800,
            color: textColor,
            fontFamily: 'monospace',
          }}
        >
          {billAmount}
        </span>
      </div>
    </POSCard>
  );
}
