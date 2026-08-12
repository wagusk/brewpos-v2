/**
 * TableFloor — right side of the cashier page.
 * Grid of ALL tables regardless of `active` status.
 * Uses POSCard, POSChip, POSIcon for all rendering.
 */

import { TableRestaurant as TableIcon } from '@mui/icons-material';
import { useTheme } from '../../../core/theme/monoTheme';
import { POSCard, POSChip, POSIcon } from '../../../components';
import { useCashierLayout } from '../layoutConfig';

export interface Table {
  id: number;
  name: string;
  seats: number;
  active: boolean;
}

interface Props {
  tables: Table[];
  selectedTableId: number | null;
  onSelect: (table: Table) => void;
}

export default function TableFloor({ tables, selectedTableId, onSelect }: Props) {
  const c = useTheme();
  const { config } = useCashierLayout();

  const activeCount = tables.filter(t => t.active).length;
  const inactiveCount = tables.filter(t => !t.active).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Sub-header */}
      <div style={{
        height: `${config.headerHeight}px`,
        padding: `0 ${c.ui.cardGap * 2}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${c.divider}`,
        backgroundColor: c.card,
      }}>
        <span style={{ fontWeight: 700, fontSize: c.fontSize('h6'), color: c.text }}>
          All Tables ({tables.length})
        </span>
        <div style={{ display: 'flex', gap: `${c.ui.spacingBase / 2}px` }}>
          <POSChip variant="status" size="sm" status="ready">
            {activeCount} active
          </POSChip>
          {inactiveCount > 0 && (
            <POSChip variant="status" size="sm" status="served">
              {inactiveCount} inactive
            </POSChip>
          )}
        </div>
      </div>

      {/* Tile grid */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${config.floorTileMin}px, 1fr))`,
        gap: `${config.floorGap}px`,
        padding: `${c.ui.cardGap * 2}px`,
        overflow: 'auto',
        alignContent: 'start',
      }}>
        {tables.length === 0 && (
          <span style={{ color: c.subtext, fontSize: c.fontSize('body2'), padding: `${c.ui.cardGap * 4}px`, gridColumn: '1 / -1' }}>
            No tables found
          </span>
        )}
        {tables.map((tbl) => {
          const active = selectedTableId === tbl.id;
          return (
            <POSCard
              key={tbl.id}
              variant={active ? 'selected' : tbl.active ? 'default' : 'outline'}
              padding="md"
              clickable
              onClick={() => onSelect(tbl)}
              style={{
                minHeight: `${config.floorTileHeight}px`,
                opacity: tbl.active ? 1 : 0.55,
                transition: 'background-color 0.15s, border-color 0.15s, opacity 0.15s',
              }}
            >
              {/* Top row: icon + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: `${c.ui.spacingBase * 1.5}px` }}>
                <div style={{
                  width: 40, height: 40,
                  borderRadius: `${c.ui.inputRadius}px`,
                  backgroundColor: tbl.active ? c.button : c.muted,
                  color: c.buttonText,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <POSIcon variant={active ? 'primary' : tbl.active ? 'default' : 'muted'} size="sm">
                    <TableIcon sx={{ fontSize: c.ui.iconSize }} />
                  </POSIcon>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <span style={{
                    fontWeight: 700,
                    fontSize: c.fontSize('body1'),
                    color: active ? c.buttonText : c.text,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                  }}>
                    {tbl.name}
                  </span>
                  <span style={{
                    fontSize: c.fontSize('caption'),
                    color: active ? c.buttonText : c.subtext,
                  }}>
                    {tbl.seats} seats
                  </span>
                </div>
              </div>

              {/* Bottom row: status badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: `${c.ui.spacingBase}px` }}>
                <POSChip variant="status" size="sm" status={tbl.active ? 'ready' : 'served'}>
                  {tbl.active ? 'Active' : 'Inactive'}
                </POSChip>
                {active && (
                  <span style={{ fontSize: c.fontSize('caption'), color: c.buttonText, fontWeight: 700 }}>
                    Selected
                  </span>
                )}
              </div>
            </POSCard>
          );
        })}
      </div>
    </div>
  );
}
