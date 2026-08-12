/**
 * VoidPage — void paid bills with required reason.
 * Uses POSCard, POSButton, POSChip, POSTextField, POSIcon.
 */

import { useState, useEffect } from 'react';
import { useTheme } from '../../core/theme/monoTheme';
import { POSCard, POSButton, POSChip, POSTextField, POSIcon } from '../../components';
import { Delete, Block, Warning } from '@mui/icons-material';
import { api } from '../../core/api';
import { useNotifications, Toasts } from '../../shared/notifications/useNotifications';
import ConfirmDialog from '../../shared/dialog/ConfirmDialog';
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

export default function VoidPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [loading, setLoading] = useState(false);
  const c = useTheme();
  const notifications = useNotifications();

  useEffect(() => { loadBills(); }, []);

  const loadBills = async () => {
    try {
      const data = await api.getBillHistory('?period=all&limit=100');
      setBills(data.filter((b: Bill) => b.status === 'paid' || b.status === 'void'));
    } catch (e: any) { notifications.error(e.message); }
  };

  const openVoidDialog = (bill: Bill) => {
    if (bill.status === 'void') return;
    setSelectedBill(bill);
    setVoidReason('');
    setDialogOpen(true);
  };

  const handleVoid = async () => {
    if (!selectedBill || !voidReason.trim()) return;
    setLoading(true);
    try {
      await api.voidOrder(selectedBill.order_id, { reason: voidReason });
      notifications.success(`Bill #${selectedBill.order_number} voided`);
      setDialogOpen(false);
      setSelectedBill(null);
      setVoidReason('');
      loadBills();
    } catch (e: any) { notifications.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ padding: `${c.ui.cardGap}px`, height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <POSCard variant="default" padding="md" style={{
        display: 'flex', alignItems: 'center', gap: `${c.ui.spacingBase}px`,
        marginBottom: `${c.ui.cardGap}px`,
      }}>
        <POSIcon icon={<Block />} size="md" />
        <span style={{ fontSize: c.fontSize('h4'), fontWeight: 700, color: c.text }}>Void Bills</span>
      </POSCard>

      {/* Warning */}
      <POSCard variant="outlined" padding="md" style={{
        display: 'flex', alignItems: 'center', gap: `${c.ui.spacingBase}px`,
        marginBottom: `${c.ui.cardGap}px`,
        borderColor: c.warning,
        backgroundColor: c.warningLight,
      }}>
        <POSIcon icon={<Warning />} size="md" variant="warning" />
        <span style={{ fontSize: c.fontSize('body2'), color: c.warningDark }}>
          Voiding a bill removes it from all reports and displays. This action cannot be undone.
        </span>
      </POSCard>

      {/* Bills list */}
      {bills.length === 0 ? (
        <EmptyState title="No bills available" subtitle="Paid bills will appear here" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${c.ui.listGap}px` }}>
          {bills.map(bill => (
            <POSCard
              key={bill.order_id}
              variant="default"
              padding="md"
              style={{
                opacity: bill.status === 'void' ? 0.5 : 1,
                textDecoration: bill.status === 'void' ? 'line-through' : 'none',
              }}
            >
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
                  <POSChip variant="status" size="sm" status={bill.status === 'void' ? 'void' : 'ready'}>
                    {bill.status}
                  </POSChip>
                  {bill.payment_method && (
                    <POSChip variant="payment" size="sm" paymentType={bill.payment_method as any}>
                      {bill.payment_method}
                    </POSChip>
                  )}
                  <span style={{ fontSize: c.fontSize('caption'), color: c.muted }}>
                    {new Date(bill.created_at).toLocaleTimeString()}
                  </span>
                </div>
                {bill.status === 'paid' && (
                  <POSButton variant="danger" size="sm" icon={<Delete />} onClick={() => openVoidDialog(bill)}>
                    Void
                  </POSButton>
                )}
              </div>
            </POSCard>
          ))}
        </div>
      )}

      {/* Void Confirmation Dialog */}
      <ConfirmDialog
        open={dialogOpen}
        title={`Void Bill #${selectedBill?.order_number}`}
        message="This will permanently void the bill. The order will be excluded from all reports."
        confirmLabel="Void Bill"
        destructive
        onConfirm={handleVoid}
        onCancel={() => { setDialogOpen(false); setSelectedBill(null); setVoidReason(''); }}
      />
      {dialogOpen && (
        <div style={{ padding: `0 ${c.ui.cardGap}px ${c.ui.cardGap}px` }}>
          <POSTextField
            label="Reason (required)"
            placeholder="Enter reason for voiding"
            value={voidReason}
            onChange={setVoidReason}
            fullWidth
            autoFocus
          />
        </div>
      )}

      <Toasts controller={notifications} />
    </div>
  );
}
