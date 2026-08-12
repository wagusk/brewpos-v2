/**
 * CashierPage — full-screen table grid.
 *
 * Shows all tables. Clicking a table opens a confirmation dialog:
 *   "Open Table?" [No] [Yes]
 * If Yes → navigate to /order?table_id=<id>
 *
 * No hardcoded values — all dimensions from useCashierLayout.
 * Uses POSCard, POSButton, POSChip, POSIcon, ConfirmDialog, useNotifications.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../core/theme/monoTheme';
import { useCashierLayout } from './layoutConfig';
import { api } from '../../core/api';
import TableFloor, { type Table } from './tableview/TableView';
import ConfirmDialog from '../../shared/dialog/ConfirmDialog';
import { useNotifications, Toasts } from '../../shared/notifications/useNotifications';

export default function CashierPage() {
  const nav = useNavigate();
  const c = useTheme();
  const { config } = useCashierLayout();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingTable, setPendingTable] = useState<Table | null>(null);
  const notifications = useNotifications();

  const loadTables = useCallback(async () => {
    try {
      const ts = await api.getTables();
      setTables(ts || []);
    } catch (e: any) {
      notifications.error(e?.message || 'Failed to load tables');
    } finally {
      setLoading(false);
    }
  }, [notifications]);

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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: c.page,
      }}
    >
      {/* Full-screen table grid */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <TableFloor
          tables={tables}
          selectedTableId={null}
          onSelect={(t) => setPendingTable(t)}
        />
      </div>

      {/* Open Table confirmation dialog */}
      <ConfirmDialog
        open={!!pendingTable}
        title="Open Table?"
        message={
          pendingTable
            ? `Table: ${pendingTable.name} (${pendingTable.seats} seats)`
            : undefined
        }
        confirmLabel="Yes"
        cancelLabel="No"
        onConfirm={handleOpenTable}
        onCancel={() => setPendingTable(null)}
      />

      {/* Error notifications */}
      <Toasts controller={notifications} />
    </div>
  );
}
