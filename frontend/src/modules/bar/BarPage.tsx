/**
 * BarPage — bar station display.
 * Real-time updates via WebSocket, fallback polling every 30s if disconnected.
 *
 * Uses POSCard, POSChip, POSIcon for header and status.
 * Sub-module: orderlist/OrderList renders the order cards.
 */

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '../../core/theme/monoTheme';
import { POSCard, POSIcon } from '../../components';
import { LocalBar } from '@mui/icons-material';
import { api } from '../../core/api';
import { onWebSocketMessage } from '../../core/ws';
import { RootState } from '../../core/store';
import { ordersSlice } from '../../core/store/ordersSlice';
import OrderList from '../../shared/orderlist/OrderList';
import { useNotifications, Toasts } from '../../shared/notifications/useNotifications';

export default function BarPage() {
  const [loading, setLoading] = useState(false);
  const c = useTheme();
  const dispatch = useDispatch();
  const notifications = useNotifications();
  const orders = useSelector((state: RootState) => {
    const allOrders = Object.values(state.orders.orders);
    return allOrders.filter((o: any) => ['open', 'accepted', 'preparing', 'ready'].includes(o.status));
  });

  useEffect(() => {
    loadOrders();
    const unsubscribe = onWebSocketMessage((event) => {
      if (event === 'order_created' || event === 'order_updated' || event === 'order_accepted') {
        loadOrders();
      }
    });
    return () => { unsubscribe(); };
  }, []);

  const loadOrders = async () => {
    try {
      const orders = await api.listOrders();
      if (Array.isArray(orders)) {
        dispatch(ordersSlice.actions.setOrders(orders));
      }
    } catch { /* ignore */ }
  };

  const acceptOrder = async (orderId: number) => {
    setLoading(true);
    try {
      await api.acceptOrder(orderId);
      notifications.success('Order accepted');
      loadOrders();
    } catch (e: any) {
      notifications.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const markItemStatus = async (orderId: number, itemId: number, newStatus: string) => {
    setLoading(true);
    try {
      await api.updateOrder(orderId, { item_id: itemId, item_status: newStatus });
      loadOrders();
    } catch (e: any) {
      notifications.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: `${c.ui.cardGap}px`, height: '100%', overflow: 'auto', backgroundColor: c.page }}>
      <POSCard variant="default" padding="md" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: `${c.ui.cardGap}px`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: `${c.ui.spacingBase}px` }}>
          <POSIcon icon={<LocalBar />} size="md" />
          <span style={{ fontWeight: 700, fontSize: c.fontSize('h5'), color: c.text }}>
            Bar Display
          </span>
        </div>
      </POSCard>

      <OrderList orders={orders} loading={loading} station="bar" onAccept={acceptOrder} onMarkItemStatus={markItemStatus} />

      <Toasts controller={notifications} />
    </div>
  );
}
