/**
 * TableBill — left side of the cashier page.
 *
 * Shows the bills (orders) attached to the currently selected table.
 * Lists open + paid orders so the cashier can close any unpaid ones.
 * Action buttons: print receipt, close bill (for the latest open order).
 *
 * Width comes from useCashierLayout.
 *
 * UI Design Rule compliant — uses POSCard, POSButton, POSChip, POSIcon,
 * and theme tokens throughout. No raw MUI components.
 */

import { useState, useEffect, useMemo } from 'react';
import { Receipt as ReceiptIcon, Payment as PaymentIcon, Refresh as RefreshIcon, Chair as ChairIcon } from '@mui/icons-material';
import { useTheme } from '../../../core/theme/monoTheme';
import { useCashierLayout } from '../layoutConfig';
import { useNotifications, Toasts } from '../../../shared/notifications';
import { POSCard, POSButton, POSChip, POSIcon } from '../../../components';
import { api } from '../../../core/api';
import PaymentDialog from '../../payment/PaymentDialog';
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
  const toast = useNotifications();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);

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
      toast.error(e.message || 'Failed to load orders');
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
      toast.success('Receipt sent to printer');
    } catch (e: any) {
      toast.error(e.message || 'Print failed');
    }
  };

  const handleCloseBill = async (order: Order) => {
    setPaymentOrder(order);
  };

  const openStatusColor = (status: string): 'pending' | 'accepted' | 'preparing' | 'ready' | 'served' | 'void' => {
    if (status === 'ready' || status === 'served') return 'ready';
    if (status === 'voided') return 'void';
    if (status === 'pending') return 'pending';
    if (status === 'accepted') return 'accepted';
    if (status === 'preparing') return 'preparing';
    return 'pending';
  };

  const paidStatusColor = (status: string): 'pending' | 'accepted' | 'preparing' | 'ready' | 'served' | 'void' => {
    if (status === 'voided') return 'void';
    return 'ready'; // paid uses success/ready green
  };

  return (
    <div style={{
      width: `${config.floorLeftWidth}px`,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      borderRight: `1px solid ${c.divider}`,
      backgroundColor: c.card,
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      overflow: 'hidden',
    }}>
      {/* Header strip */}
      <div style={{
        height: `${config.headerHeight}px`,
        padding: `0 ${c.ui.spacingBase * 2}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${c.divider}`,
      }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: c.fontSize('h6'), color: c.text, display: 'block' }}>
            {table ? table.name : 'Select a table'}
          </span>
          <span style={{ fontSize: c.fontSize('caption'), color: c.subtext, display: 'block' }}>
            {table ? `${table.seats} seats · ${totals.openCount} open · ${totals.paidCount} paid` : 'No table selected'}
          </span>
        </div>
        <POSButton
          variant="outline"
          size="sm"
          icon={<POSIcon icon={<RefreshIcon />} size="sm" />}
          onClick={loadOrders}
          disabled={!table || loading}
        >
          Refresh
        </POSButton>
      </div>

      {/* Bill list */}
      <div style={{ flex: 1, overflow: 'auto', padding: `${c.ui.spacingBase * 2}px` }}>
        {!table && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100%', gap: `${c.ui.spacingBase}px`,
          }}>
            <POSIcon icon={<ChairIcon />} size="lg" variant="muted" />
            <span style={{ fontSize: c.fontSize('body2'), color: c.subtext }}>
              Select a table from the floor to view its bill
            </span>
          </div>
        )}

        {table && orders.length === 0 && !loading && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100%', gap: `${c.ui.spacingBase}px`,
          }}>
            <POSIcon icon={<ReceiptIcon />} size="lg" variant="muted" />
            <span style={{ fontSize: c.fontSize('body2'), color: c.subtext }}>
              No bills for this table
            </span>
          </div>
        )}

        {table && orders.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${c.ui.cardGap}px` }}>
            {orders.map((order) => {
              const isOpen = order.status !== 'paid' && order.status !== 'voided';
              return (
                <POSCard
                  key={order.id}
                  variant="default"
                  padding="sm"
                  minHeight="auto"
                  style={{ opacity: isOpen ? 1 : 0.75 }}
                >
                  {/* Order header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: `${c.ui.spacingBase}px`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: `${c.ui.spacingBase}px` }}>
                      <span style={{ fontWeight: 700, fontSize: c.fontSize('body1'), color: c.text }}>
                        {'Bill #' + order.number}
                      </span>
                      <POSChip
                        variant="status"
                        status={isOpen ? openStatusColor(order.status) : paidStatusColor(order.status)}
                        size="sm"
                      >
                        {order.status}
                      </POSChip>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: c.fontSize('body1'), color: c.text }}>
                      {'$' + order.total.toFixed(2)}
                    </span>
                  </div>

                  {/* Items list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: c.ui.listGap, marginBottom: `${c.ui.spacingBase}px` }}>
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        <span style={{ fontSize: c.fontSize('caption'), color: c.text }}>
                          {item.qty + '× ' + item.name}
                        </span>
                        <span style={{ fontSize: c.fontSize('caption'), color: c.subtext }}>
                          {'$' + (item.price * item.qty).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, backgroundColor: c.divider, margin: `${c.ui.spacingBase / 2}px 0` }} />

                  {/* Footer: timestamp + actions */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: `${c.ui.spacingBase}px`,
                  }}>
                    <span style={{ fontSize: c.fontSize('body2'), color: c.subtext }}>
                      {new Date(order.created_at).toLocaleString()}
                    </span>
                    <div style={{ display: 'flex', gap: `${c.ui.spacingBase}px` }}>
                      <POSButton
                        variant="outline"
                        size="md"
                        icon={<POSIcon icon={<ReceiptIcon />} size="sm" />}
                        onClick={() => handlePrint(order.id)}
                      >
                        Print
                      </POSButton>
                      {isOpen && (
                        <POSButton
                          variant="success"
                          size="md"
                          icon={<POSIcon icon={<PaymentIcon />} size="sm" />}
                          onClick={() => handleCloseBill(order)}
                        >
                          Close
                        </POSButton>
                      )}
                    </div>
                  </div>
                </POSCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer: totals summary when bills exist */}
      {table && orders.length > 0 && (
        <div style={{
          padding: `${c.ui.spacingBase * 2}px`,
          borderTop: `1px solid ${c.divider}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: c.ui.spacingBase / 2 }}>
            <span style={{ fontSize: c.fontSize('body2'), color: c.text }}>Open</span>
            <span style={{ fontSize: c.fontSize('body2'), color: c.text, fontWeight: 600 }}>
              {'$' + totals.openTotal.toFixed(2)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: c.ui.spacingBase / 2 }}>
            <span style={{ fontSize: c.fontSize('body2'), color: c.text }}>Paid</span>
            <span style={{ fontSize: c.fontSize('body2'), color: c.text, fontWeight: 600 }}>
              {'$' + totals.paidTotal.toFixed(2)}
            </span>
          </div>
          <div style={{ height: 1, backgroundColor: c.divider, margin: `${c.ui.spacingBase / 2}px 0` }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: c.fontSize('body1'), color: c.text }}>Total</span>
            <span style={{ fontWeight: 700, fontSize: c.fontSize('h6'), color: c.text }}>
              {'$' + (totals.openTotal + totals.paidTotal).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      <Toasts controller={toast} />

      {/* M35 - Payment dialog */}
      <PaymentDialog
        open={!!paymentOrder}
        onClose={() => setPaymentOrder(null)}
        order={paymentOrder ? { id: paymentOrder.id, number: paymentOrder.number, total: paymentOrder.total, status: paymentOrder.status } : null}
        onSuccess={() => {
          setPaymentOrder(null);
          toast.success('Payment completed');
          loadOrders();
        }}
        onError={(msg) => toast.error(msg)}
      />
    </div>
  );
}
