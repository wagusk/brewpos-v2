/**
 * TableViewPage — the first operational screen after login.
 * Shows only the color-coded table grid and bottom navigation bar (no top header bar).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  TableRestaurant as TableIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../core/theme/monoTheme';
import { usePermissions } from '../../core/permissions';
import { api } from '../../core/api';
import { t } from '../multilingual/i18n';
import { RootState } from '../../core/store';
import { tablesSlice } from '../../core/store/tablesSlice';
import { onWebSocketMessage } from '../../core/ws';
import { useNotifications, Toasts } from '../../shared/notifications/useNotifications';
import ConfirmDialog from '../../shared/dialog/ConfirmDialog';
import EmptyState from '../../shared/states/EmptyState';
import TableTile, { type TableData } from './TableTile';
import { useTableViewConfig } from './tableviewConfig';

export default function TableViewPage() {
  const c = useTheme();
  const nav = useNavigate();
  const dispatch = useDispatch();
  const { can } = usePermissions();
  const { config } = useTableViewConfig();
  const notifications = useNotifications();
  const notificationsRef = useRef(notifications);
  notificationsRef.current = notifications;

  const tablesMap = useSelector((state: RootState) => state.tables.tables);
  const tables = Object.values(tablesMap) as TableData[];
  const [loading, setLoading] = useState(true);
  const [pendingTable, setPendingTable] = useState<TableData | null>(null);

  const loadData = useCallback(async () => {
    try {
      const tbls = await api.getTables();
      dispatch(tablesSlice.actions.setTables(Array.isArray(tbls) ? tbls : []));
    } catch (e: any) {
      notificationsRef.current.error(e?.message || 'Failed to load tables');
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    setLoading(true);
    loadData();

    const unsubscribe = onWebSocketMessage((event) => {
      if (
        event === 'table_created' ||
        event === 'table_updated' ||
        event === 'table_deleted' ||
        event === 'order_created' ||
        event === 'order_updated' ||
        event === 'order_accepted' ||
        event === 'order_served' ||
        event === 'order_closed' ||
        event === 'order_cancelled'
      ) {
        loadData();
      }
    });

    const pollInterval = setInterval(() => {
      loadData();
    }, 30000);

    const onFocus = (): void => { loadData(); };
    const onVisibility = (): void => {
      if (document.visibilityState === 'visible') loadData();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [dispatch, loadData]);

  const handleTableTap = useCallback((table: TableData): void => {
    if (!can('order.open') && !can('pos.view')) {
      notificationsRef.current.error('You do not have permission to open a table');
      return;
    }
    if (table.order_id != null && (table.order_status !== 'paid' && table.order_status !== 'void')) {
      nav(`/order?order_id=${table.order_id}&table_id=${table.id}`);
      return;
    }
    setPendingTable(table);
  }, [can, nav]);

  const handleConfirmOpen = useCallback((): void => {
    if (!pendingTable) return;
    const tableId = pendingTable.id;
    setPendingTable(null);
    if (pendingTable.order_id != null) {
      nav(`/order?order_id=${pendingTable.order_id}&table_id=${tableId}`);
    } else {
      nav(`/order?table_id=${tableId}`);
    }
  }, [pendingTable, nav]);

  const handleCancelOpen = useCallback((): void => {
    setPendingTable(null);
  }, []);

  const dialogTitle = pendingTable
    ? (pendingTable.order_id != null
        ? t('tablesview.resumeTitle')
        : t('tablesview.openTitle'))
    : '';
  const dialogMessage = pendingTable
    ? (pendingTable.order_id != null
        ? `${pendingTable.name} — ${t('tablesview.billOnTable').replace('{n}', String(pendingTable.order_number ?? ''))}${pendingTable.order_total != null ? ` · $${pendingTable.order_total.toFixed(2)}` : ''}`
        : `${pendingTable.name} — ${t('tablesview.startNewBill')}`)
    : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', backgroundColor: c.page }}>
      {/* ── Main content: All Tables Grid ────────────────── */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: `${c.ui.spacingBase * 2}px` }}>
        {loading && tables.length === 0 ? (
          <EmptyState title={t('common.loading')} icon={<TableIcon />} />
        ) : tables.length === 0 ? (
          <EmptyState
            title={t('tablesview.noTables')}
            subtitle={t('tablesview.noTablesHint')}
            icon={<TableIcon />}
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: `${c.ui.cardGap}px`,
            }}
          >
            {tables.map((tbl) => (
              <TableTile
                key={tbl.id}
                table={tbl}
                selected={false}
                config={config}
                onSelect={handleTableTap}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Open-table confirmation dialog ──────────────────── */}
      <ConfirmDialog
        open={!!pendingTable}
        title={dialogTitle}
        message={dialogMessage}
        confirmLabel={t('common.yes')}
        cancelLabel={t('common.no')}
        destructive={!pendingTable?.active}
        onConfirm={handleConfirmOpen}
        onCancel={handleCancelOpen}
      />

      <Toasts controller={notifications} />
    </div>
  );
}
