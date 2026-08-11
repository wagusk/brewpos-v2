/**
 * TableFloor — right side of the cashier page.
 *
 * Grid of ALL tables regardless of `active` status (per the requirement
 * that the floor view always shows every table). Inactive tables are
 * dimmed and labelled so staff can still see them. Click a tile to
 * select that table and reveal its bill in the left column.
 *
 * Tile dimensions come from useCashierLayout so they're live-adjustable
 * via the gear popup or Settings page.
 */

import { Box, Typography, Chip } from '@mui/material';
import { TableRestaurant as TableIcon } from '@mui/icons-material';
import { useTheme } from '../../../core/theme/monoTheme';
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Sub-header */}
      <Box sx={{
        height: `${config.headerHeight}px`,
        px: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${c.divider}`,
        bgcolor: c.card,
      }}>
        <Typography sx={{ fontWeight: 700, fontSize: c.fontSize('h6'), color: c.text }}>
          {'All Tables (' + tables.length + ')'}
       </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            size="small"
            label={tables.filter((t) => t.active).length + ' active'}
            sx={{
              bgcolor: c.success, color: c.buttonText,
              fontWeight: 600, fontSize: c.fontSize('caption'),
            }}
          />
          {tables.some((t) => !t.active) && (
            <Chip
              size="small"
              label={tables.filter((t) => !t.active).length + ' inactive'}
              sx={{
                bgcolor: c.muted, color: c.buttonText,
                fontWeight: 600, fontSize: c.fontSize('caption'),
              }}
            />
          )}
       </Box>
     </Box>

      {/* Tile grid */}
      <Box
        sx={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fill, minmax(${config.floorTileMin}px, 1fr))`,
          gap: `${config.floorGap}px`,
          p: 2,
          overflow: 'auto',
          alignContent: 'start',
        }}
      >
        {tables.length === 0 && (
          <Typography sx={{ color: c.subtext, fontSize: c.fontSize('body2'), p: 4 }}>
            No tables found
         </Typography>
        )}
        {tables.map((tbl) => {
          const active = selectedTableId === tbl.id;
          return (
            <Box
              key={tbl.id}
              onClick={() => onSelectTable(tbl)}
              sx={{
                position: 'relative',
                minHeight: `${config.floorTileHeight}px`,
                p: 2,
                cursor: 'pointer',
                bgcolor: active ? c.chipActive : (tbl.active ? c.card : c.input),
                border: `2px solid ${
                  active
                    ? c.button
                    : tbl.active
                      ? c.cardBorder
                      : c.divider
                }`,
                borderRadius: `${c.ui.cardRadius}px`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                opacity: tbl.active ? 1 : 0.55,
                backgroundImage: 'none',
                transition: 'background-color 0.15s, border-color 0.15s, opacity 0.15s',
                '&:hover': {
                  bgcolor: active ? c.chipActive : (tbl.active ? c.cardHover : c.card),
                  borderColor: c.button,
                  backgroundImage: 'none',
                },
              }}
            >
              {/* Top row: icon + name */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{
                  width: 40, height: 40, borderRadius: `${c.ui.inputRadius}px`,
                  bgcolor: tbl.active ? c.button : c.muted,
                  color: c.buttonText,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <TableIcon sx={{ fontSize: c.ui.iconSize }} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{
                    fontWeight: 700,
                    fontSize: c.fontSize('subtitle1'),
                    color: active ? c.buttonText : c.text,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {tbl.name}
                  </Typography>
                  <Typography sx={{
                    fontSize: c.fontSize('body2'),
                    color: active ? c.buttonText : c.subtext,
                  }}>
                    {tbl.seats + ' seats'}
                  </Typography>
                </Box>
              </Box>

              {/* Bottom row: status badge */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Chip
                  size="small"
                  label={tbl.active ? 'Active' : 'Inactive'}
                  sx={{
                    height: 28,
                    fontSize: c.fontSize('body2'),
                    bgcolor: tbl.active ? c.success : c.muted,
                    color: c.buttonText,
                    fontWeight: 600,
                  }}
                />
                {active && (
                  <Typography sx={{ fontSize: c.fontSize('body2'), color: c.buttonText, fontWeight: 700 }}>
                    Selected
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
     </Box>
   </Box>
  );
}
