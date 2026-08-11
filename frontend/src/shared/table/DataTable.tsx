/**
 * DataTable - generic themed table used by CRUD tabs.
 * Renders columns from a spec; rows are passed in. Theme-driven.
 */

import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Stack } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { useTheme } from '../../core/theme/monoTheme';
import { EmptyState } from '../states';

export interface ColumnSpec {
  key: string;
  label: string;
  width?: string | number;
  align?: 'left' | 'right' | 'center';
  render?: (row: any) => React.ReactNode;
}

interface Props {
  rows: any[];
  columns: ColumnSpec[];
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  emptyTitle?: string;
  emptySubtitle?: string;
  rowKey?: string;
}

export default function DataTable({
  rows, columns, onEdit, onDelete,
  emptyTitle = 'No data', emptySubtitle,
  rowKey = 'id',
}: Props) {
  const c = useTheme();
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} subtitle={emptySubtitle} height={300} />;
  }
  return (
    <TableContainer component={Paper} sx={{ bgcolor: c.card, border: '1px solid ' + c.divider }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell
                key={col.key}
                align={col.align}
                sx={{
                  color: c.subtext,
                  fontSize: c.fontSize('caption'),
                  fontWeight: 700,
                  width: col.width,
                  borderBottom: '1px solid ' + c.divider,
                }}
              >
                {col.label}
        </TableCell>
            ))}
            {(onEdit || onDelete) && (
              <TableCell align="right" sx={{ borderBottom: '1px solid ' + c.divider, width: 96 }}>
                Actions
        </TableCell>
            )}
    </TableRow>
   </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row[rowKey]}>
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  align={col.align}
                  sx={{ color: c.text, fontSize: c.fontSize('body2'), borderBottom: '1px solid ' + c.divider }}
                >
                  {col.render ? col.render(row) : row[col.key]}
        </TableCell>
              ))}
              {(onEdit || onDelete) && (
                <TableCell align="right" sx={{ borderBottom: '1px solid ' + c.divider }}>
                  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                    {onEdit && (
                      <IconButton size="small" onClick={() => onEdit(row)}>
                        <Edit fontSize="small" sx={{ color: c.button }} />
              </IconButton>
                    )}
                    {onDelete && (
                      <IconButton size="small" onClick={() => onDelete(row)}>
                        <Delete fontSize="small" sx={{ color: c.errorText }} />
              </IconButton>
                    )}
        </Stack>
        </TableCell>
              )}
      </TableRow>
          ))}
  </TableBody>
</Table>
</TableContainer>
  );
}
