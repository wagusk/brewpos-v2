/**
 * TableBill — left side of the cashier page.
 *
 * Shows the bills (orders) attached to the currently selected table.
 * Lists open + paid orders so the cashier can close any unpaid ones.
 * Action buttons: print receipt, close bill (for the latest open order).
 *
 * Width comes from useCashierLayout.
 */

import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Button, Chip, Divider, Alert, Snackbar } from '@mui/material';
import { Receipt as ReceiptIcon, Payment as PaymentIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useTheme } from '../../../core/theme/monoTheme';
import { useCashierLayout } from '../layoutConfig';
import { api } from '../../../core/api';
import type { Table } from '../tableview/TableView';

interface OrderItem {
  id: number;
  qty: number;
  name: string;
  price: number;
  status: string;
}

interface Order {
  id: number;
  number: number;
  table_id?: number;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  items: OrderItem[];
  payment_method?: string;
  created_at: string;
}

interface Props {
  table: Table | null;
}

export default function TableBill({ table }: Props) {
  const c = useTheme();
  const { config } = useCashierLayout();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadOrders = async () => {
    if (!table) {
      setOrders([]);
      return;
    }
    setLoading(true);
    try {
      const data = await api.listOrders();
      const filtered = (data || []).filter(
        (o: Order) => o.table_id === table.id && o.status !== 'cancelled'
      );
      // Sort: open orders first (newest at top), then paid.
      filtered.sort((a: Order, b: Order) => {
        const aOpen = a.status !== 'paid' && a.status !== 'voided';
        const bOpen = b.status !== 'paid' && b.status !== 'voided';
        if (aOpen !== bOpen) return aOpen ? -1 : 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setOrders(filtered);
    } catch (e: any) {
      setError(e.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table?.id]);

  const totals = useMemo(() => {
    const open = orders.filter((o) => o.status !== 'paid' && o.status !== 'voided');
    const paid = orders.filter((o) => o.status === 'paid');
    return {
      openCount: open.length,
      paidCount: paid.length,
      openTotal: open.reduce((s, o) => s + o.total, 0),
      paidTotal: paid.reduce((s, o) => s + o.total, 0),
    };
  }, [orders]);

  const handlePrint = async (orderId: number) => {
    try {
      await api.printReceipt(orderId);
      setSuccess('Receipt sent to printer');
    } catch (e: any) {
      setError(e.message || 'Print failed');
    }
  };

  const handleCloseBill = async (order: Order) => {
    try {
      await api.closeOrder(order.id, {
        payment_method: 'cash',
        tendered: order.total,
      });
      setSuccess('Bill #' + order.number + ' closed');
      await loadOrders();
    } catch (e: any) {
      setError(e.message || 'Close bill failed');
    }
  };

  return (
    <Box sx={{
      width: `${config.floorLeftWidth}px`,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      borderRight: `1px solid ${c.divider}`,
      bgcolor: c.card,
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      overflow: 'hidden',
    }}>
      {/* Header strip */}
      <Box sx={{
        height: `${config.headerHeight}px`,
        px: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${c.divider}`,
      }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: c.fontSize('h6'), color: c.text }}>
            {table ? table.name : 'Select a table'}
      </Typography>
          <Typography sx={{ fontSize: c.fontSize('caption'), color: c.subtext }}>
            {table ? `${table.seats} seats · ${totals.openCount} open · ${totals.paidCount} paid` : 'No table selected'}
      </Typography>
    </Box>
        <Button
          size="small"
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadOrders}
          disabled={!table || loading}
          sx={{
            color: c.subtext, borderColor: c.buttonBorder, bgcolor: c.input,
            borderRadius: `${c.ui.inputRadius}px`,
            minHeight: c.ui.minTouchTarget * 0.7,
            backgroundImage: 'none',
            '&:hover': { bgcolor: c.cardHover, borderColor: c.button, backgroundImage: 'none' },
          }}
        >
          Refresh
    </Button>
  </Box>

      {/* Bill list */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {!table && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 1 }}>
            <Typography sx={{ fontSize: '3rem', opacity: 0.4 }}>🪑</Typography>
            <Typography sx={{ fontSize: c.fontSize('body2'), color: c.subtext }}>
              Select a table from the floor to view its bill
        </Typography>
      </Box>
        )}

        {table && orders.length === 0 && !loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 1 }}>
            <Typography sx={{ fontSize: '3rem', opacity: 0.4 }}>🧾</Typography>
            <Typography sx={{ fontSize: c.fontSize('body2'), color: c.subtext }}>
              No bills for this table
        </Typography>
      </Box>
        )}

        {table && orders.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {orders.map((order) => {
              const isOpen = order.status !== 'paid' && order.status !== 'voided';
              return (
                <Box
                  key={order.id}
                  sx={{
                    p: 1.5,
                    bgcolor: isOpen ? c.input : c.card,
                    border: `1px solid ${isOpen ? c.buttonBorder : c.cardBorder}`,
                    borderRadius: `${c.ui.inputRadius}px`,
                    opacity: isOpen ? 1 : 0.75,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: c.fontSize('body1'), color: c.text }}>
                        {'Bill #' + order.number}
                </Typography>
                      <Chip
                        size="small"
                        label={order.status}
                        sx={{
                          height: 20,
                          fontSize: c.fontSize('caption'),
                          bgcolor: isOpen
                            ? (order.status === 'ready' || order.status === 'served' ? c.warning : c.info)
                            : (order.status === 'voided' ? c.errorText : c.success),
                          color: c.buttonText,
                          fontWeight: 600,
                        }}
                      />
              </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: c.fontSize('body1'), color: c.text }}>
                      {'$' + order.total.toFixed(2)}
              </Typography>
            </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, mb: 1 }}>
                    {order.items.map((item) => (
                      <Box
                        key={item.id}
                        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        <Typography sx={{ fontSize: c.fontSize('caption'), color: c.text }}>
                          {item.qty + '× ' + item.name}
                  </Typography>
                        <Typography sx={{ fontSize: c.fontSize('caption'), color: c.subtext }}>
                          {'$' + (item.price * item.qty).toFixed(2)}
                  </Typography>
                </Box>
                    ))}
            </Box>

                  <Divider sx={{ my: 0.5, borderColor: c.divider }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                    <Typography sx={{ fontSize: c.fontSize('body2'), color: c.subtext }}>
                      {new Date(order.created_at).toLocaleString()}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        startIcon={<ReceiptIcon />}
                        onClick={() => handlePrint(order.id)}
                        sx={{
                          color: c.text, borderColor: c.buttonBorder, bgcolor: 'transparent',
                          borderRadius: `${c.ui.inputRadius}px`,
                          fontSize: c.fontSize('body2'),
                          minHeight: c.ui.buttonMinHeight,
                          px: 2, backgroundImage: 'none',
                          '&:hover': { bgcolor: c.cardHover, borderColor: c.button, backgroundImage: 'none' },
                        }}
                      >
                        Print
                      </Button>
                      {isOpen && (
                        <Button
                          variant="contained"
                          startIcon={<PaymentIcon />}
                          onClick={() => handleCloseBill(order)}
                          sx={{
                            bgcolor: c.success, color: c.buttonText,
                            borderRadius: `${c.ui.inputRadius}px`,
                            fontSize: c.fontSize('body2'),
                            fontWeight: 700,
                            minHeight: c.ui.buttonMinHeight,
                            px: 2, backgroundImage: 'none', boxShadow: 'none',
                            '&:hover': { opacity: 0.9, backgroundImage: 'none', boxShadow: 'none' },
                          }}
                        >
                          Close
                        </Button>
                      )}
                    </Box>
                  </Box>
          </Box>
              );
            })}
    </Box>
        )}
  </Box>

      {/* Footer: totals summary when bills exist */}
      {table && orders.length > 0 && (
        <Box sx={{ p: 2, borderTop: `1px solid ${c.divider}` }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography sx={{ fontSize: c.fontSize('body2'), color: c.text }}>Open</Typography>
            <Typography sx={{ fontSize: c.fontSize('body2'), color: c.text, fontWeight: 600 }}>
              {'$' + totals.openTotal.toFixed(2)}
      </Typography>
    </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography sx={{ fontSize: c.fontSize('body2'), color: c.text }}>Paid</Typography>
            <Typography sx={{ fontSize: c.fontSize('body2'), color: c.text, fontWeight: 600 }}>
              {'$' + totals.paidTotal.toFixed(2)}
      </Typography>
    </Box>
          <Divider sx={{ my: 0.5, borderColor: c.divider }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ fontWeight: 700, fontSize: c.fontSize('body1'), color: c.text }}>Total</Typography>
            <Typography sx={{ fontWeight: 700, fontSize: c.fontSize('h6'), color: c.text }}>
              {'$' + (totals.openTotal + totals.paidTotal).toFixed(2)}
      </Typography>
    </Box>
  </Box>
      )}

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}>
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{ bgcolor: c.errorBg, color: c.errorText, border: `1px solid ${c.errorBorder}` }}
        >
          {error}
  </Alert>
</Snackbar>
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess(null)}>
        <Alert
          severity="success"
          onClose={() => setSuccess(null)}
          sx={{ bgcolor: c.chip, color: c.success, border: `1px solid ${c.success}` }}
        >
          {success}
  </Alert>
</Snackbar>
</Box>
  );
}
