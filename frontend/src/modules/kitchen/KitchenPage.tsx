/**
 * KitchenPage — kitchen station display.
 *
 * Sub-module: orderlist/OrderList renders the order cards.
 */

import { useState, useEffect } from 'react';
import { Box, Typography, Alert, Snackbar } from '@mui/material';
import { SoupKitchen } from '@mui/icons-material';
import { api } from '../../core/api';
import { useTheme } from '../../core/theme/monoTheme';
import OrderList from '../../shared/orderlist/OrderList';

export default function KitchenPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const c = useTheme();

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      const data = await api.listOrders();
      setOrders(data.filter((o: any) => ['open', 'accepted', 'preparing', 'ready'].includes(o.status)));
    } catch (e: any) {
      console.error('Failed to load orders', e);
    }
  };

  const acceptOrder = async (orderId: number) => {
    setLoading(true);
    try {
      await api.acceptOrder(orderId);
      setSuccess('Order accepted');
      loadOrders();
    } catch (e: any) {
      setError(e.message);
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
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto', bgcolor: c.page }}>
      <Typography sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, mb: 2, fontSize: c.fontSize('h5'), color: c.text }}>
        <SoupKitchen /> Kitchen Display
      </Typography>

      <OrderList orders={orders} loading={loading} station="kitchen" onAccept={acceptOrder} onMarkItemStatus={markItemStatus} />

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)} sx={{ bgcolor: c.errorBg, color: c.errorText, border: '1px solid ' + c.errorBorder }}>{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess(null)}>
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ bgcolor: c.chip, color: c.text, border: '1px solid ' + c.cardBorder }}>{success}</Alert>
      </Snackbar>
    </Box>
  );
}
