/**
 * DiscountPage — bill history viewer.
 * Uses POSCard, POSButton, POSChip, POSIcon.
 */

import { useState, useEffect } from 'react';
import { useTheme } from '../../core/theme/monoTheme';
import { POSCard, POSChip, POSIcon } from '../../components';
import { Receipt } from '@mui/icons-material';
import { api } from '../../core/api';
import { useNotifications, Toasts } from '../../shared/notifications/useNotifications';
import EmptyState from '../../shared/states/EmptyState';

interface Bill {
  order_id: number;
  order_number: number;
  table_name: string | null;
  customer_name: string;
  status: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: string | null;
  created_at: string;
  items: any[];
}

export default function DiscountPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const c = useTheme();
  const notifications = useNotifications();

  useEffect(() => { loadBills(); }, []);

  const loadBills = async () => {
    try {
      const data = await api.getBillHistory('?period=day&limit=50');
      setBills(data.filter((b: Bill) => b.status === 'paid'));
    } catch (e: any) { notifications.error(e.message); }
  };

  return (
    <div style={{ padding: `${c.ui.cardGap}px`, height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <POSCard variant="default" padding="md" style={{
        display: 'flex', alignItems: 'center', gap: `${c.ui.spacingBase}px`,
        marginBottom: `${c.ui.cardGap}px`,
      }}>
        <POSIcon icon={<Receipt />} size="md" />
        <span style={{ fontSize: c.fontSize('h4'), fontWeight: 700, color: c.text }}>
          Bill History & Discounts
        </span>
      </POSCard>

      {/* Bills list */}
      {bills.length === 0 ? (
        <EmptyState title="No paid bills yet" subtitle="Paid bills will appear here" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${c.ui.listGap}px` }}>
          {bills.map(bill => (
            <POSCard key={bill.order_id} variant="default" padding="md">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: `${c.ui.spacingBase}px` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: `${c.ui.spacingBase}px`, flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 700, fontSize: c.fontSize('body1'), color: c.text }}>
                    #{bill.order_number}
                  </span>
                  <POSChip variant="default" size="sm">
                    {bill.table_name || 'Takeaway'}
                  </POSChip>
                  <span style={{ fontSize: c.fontSize('body2'), color: c.subtext }}>
                    {bill.customer_name || '—'}
                  </span>
                  <span style={{ fontSize: c.fontSize('body1'), fontWeight: 600, color: c.text }}>
                    ${bill.total.toFixed(2)}
                  </span>
                  {bill.payment_method && (
                    <POSChip variant="payment" size="sm" paymentType={bill.payment_method as any}>
                      {bill.payment_method}
                    </POSChip>
                  )}
                  <span style={{ fontSize: c.fontSize('caption'), color: c.muted }}>
                    {new Date(bill.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </POSCard>
          ))}
        </div>
      )}

      <Toasts controller={notifications} />
    </div>
  );
}
