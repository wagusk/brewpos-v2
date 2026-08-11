/**
 * CashierPage — full-screen table grid.
 *
 * Shows all tables. Clicking a table opens a confirmation dialog:
 *   "Open Table?" [No] [Yes]
 * If Yes → navigate to /order?table_id=<id>
 *
 * No hardcoded values — all dimensions from useCashierLayout.
 */

import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Alert, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../core/theme/monoTheme';
import { useCashierLayout } from './layoutConfig';
import { api } from '../../core/api';
import TableFloor, { type Table } from './tableview/TableView';

export default function CashierPage() {
  const nav = useNavigate();
  const c = useTheme();
  const { config } = useCashierLayout();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingTable, setPendingTable] = useState<Table | null>(null);

  const loadTables = useCallback(async () => {
    try {
      const ts = await api.getTables();
      setTables(ts || []);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load tables');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadTables();
    const id = window.setInterval(loadTables, 10000);
    const onFocus = () => { loadTables(); };
    const onVisibility = () => { if (document.visibilityState === 'visible') loadTables(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [loadTables]);

  const handleOpenTable = () => {
    if (!pendingTable) return;
    const tableId = pendingTable.id;
    setPendingTable(null);
    nav(`/order?table_id=${tableId}`);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', bgcolor: c.page }}>
      {/* Full-screen table grid */}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <TableFloor
          tables={tables}
          selectedTableId={null}
          onSelect={(t) => setPendingTable(t)}
        />
      </Box>

      {/* Open Table dialog */}
      <Dialog
        open={!!pendingTable}
        onClose={() => setPendingTable(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: c.card,
            color: c.text,
            border: `1px solid ${c.cardBorder}`,
            borderRadius: `${c.ui.cardRadius}px`,
            boxShadow: c.ui.cardShadow,
          },
        }}
      >
        <DialogTitle sx={{ color: c.text, fontSize: c.fontSize('h6'), fontWeight: 700 }}>
          Open Table?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: c.fontSize('body2'), color: c.subtext }}>
            {pendingTable ? `Table: ${pendingTable.name} (${pendingTable.seats} seats)` : ''}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ pb: 2, px: 3, gap: 1 }}>
          <Button
            onClick={() => setPendingTable(null)}
            sx={{
              color: c.text, borderColor: c.buttonBorder,
              borderRadius: `${c.ui.buttonRadius}px`,
              minHeight: c.ui.buttonMinHeight,
              backgroundImage: 'none',
              '&:hover': { bgcolor: c.cardHover, borderColor: c.button, backgroundImage: 'none' },
            }}
          >
            No
          </Button>
          <Button
            onClick={handleOpenTable}
            variant="contained"
            sx={{
              bgcolor: c.button, color: c.buttonText,
              borderRadius: `${c.ui.buttonRadius}px`,
              minHeight: c.ui.buttonMinHeight,
              fontWeight: 700,
              backgroundImage: 'none', boxShadow: 'none',
              '&:hover': { bgcolor: c.buttonHover, backgroundImage: 'none', boxShadow: 'none' },
            }}
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError(null)}>
        <Alert
          severity="warning"
          onClose={() => setError(null)}
          sx={{ bgcolor: c.errorBg, color: c.errorText, border: `1px solid ${c.errorBorder}` }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
