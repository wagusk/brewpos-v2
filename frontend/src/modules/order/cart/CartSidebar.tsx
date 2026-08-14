/**
 * CartSidebar — bill-side panel for the ordering screen.
 *
 * Three modes:
 *   - empty:    no bill yet; shows "Open Empty Bill" + product-add hint
 *   - new:      waiter is composing items for a fresh bill; "Send to Kitchen"
 *   - resume:   an existing open bill is being edited; "Append Items" + "Hold"
 *
 * All totals (subtotal, tax, total) come from the server for resume mode,
 * or are computed locally for new-bill mode. Every cart row carries its
 * own notes + modifier badges. Items can be removed or qty-edited.
 *
 * Tax rate is dynamic — fetched from /api/admin/settings on mount.
 *
 * UI Design Rule compliant — uses POSCard, POSButton, POSChip, POSIcon,
 * POSTextField, and theme tokens throughout. No raw MUI components.
 */

import { useState, useEffect } from 'react';
import {
  Add, Remove, Send, TableRestaurant, LocalDining, Restaurant,
  Delete, Pause, Payment, Save, Lock, EditNote,
} from '@mui/icons-material';
import { useTheme } from '../../../core/theme/monoTheme';
import { useNotifications, Toasts } from '../../../shared/notifications';
import { POSCard, POSButton, POSChip, POSIcon, POSTextField } from '../../../components';
import { t } from '../../multilingual/i18n';
import PaymentDialog from '../../payment/PaymentDialog';

export interface CartItem {
  uid: string;
  product_id: number;
  name: string;
  price: number;
  qty: number;
  modifiers: number[];
  notes: string;
}

export interface ExistingBillItem {
  id: number;
  product_id: number;
  name: string;
  price: number;
  qty: number;
  status: string;
  notes: string;
  modifiers: any[];
}

export interface ExistingBill {
  id: number;
  number: number;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  table_id: number | null;
  items?: ExistingBillItem[];
}

interface Table {
  id: number;
  name: string;
}

interface Props {
  cart: CartItem[];
  tables: Table[];
  selectedTable: number | null;
  bill: ExistingBill | null;          // non-null = we are editing an existing bill
  taxRate: number;
  busy?: boolean;
  /** User permissions — used to gate primary actions. */
  permissions?: string[];
  userRole?: string;
  onUpdateQty: (uid: string, delta: number) => void;
  onRemove: (uid: string) => void;
  onSelectTable: (id: number | null) => void;
  onClearCart: () => void;
  onSendToKitchen?: () => void;       // new bill: create + send
  onAppendItems?: () => void;         // existing bill: append
  onHoldBill?: () => void;            // existing bill: keep state, no action
  onEditNotes?: (uid: string, notes: string) => void;
  /** M35 - Called when the payment dialog completes (bill is now paid). */
  onPaymentSuccess?: () => void;
}

export default function CartSidebar(props: Props) {
  const {
    cart, tables, selectedTable, bill, taxRate, busy,
    permissions = [], userRole, onUpdateQty, onRemove, onSelectTable, onClearCart,
    onSendToKitchen, onAppendItems, onHoldBill, onEditNotes,
    onPaymentSuccess,
  } = props;
  const c = useTheme();
  const toast = useNotifications();
  const [editingNotesUid, setEditingNotesUid] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');

  const isAdmin = userRole === 'admin' || userRole === 'master';
  const canOpenOrder = isAdmin || permissions.includes('order.open');
  const canAppend = isAdmin || permissions.includes('order.append');
  const canClose = isAdmin || permissions.includes('order.close');

  // M35 - Payment dialog state
  const [paymentBill, setPaymentBill] = useState<{ id: number; number: number; total: number; status: string } | null>(null);

  const currentTable = tables.find(t => t.id === selectedTable || (bill && t.id === bill.table_id));
  const hasExistingItems = !!(bill && bill.items && bill.items.length > 0);
  const isEmpty = (!bill && cart.length === 0) || (bill && !hasExistingItems && cart.length === 0);

  const newSubtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  const subtotal = bill ? bill.subtotal : newSubtotal;
  const tax = bill ? bill.tax : Math.round(newSubtotal * taxRate * 100) / 100;
  const total = bill ? bill.total : Math.round((newSubtotal + tax) * 100) / 100;

  const canEditExisting = !!bill && !['paid', 'void', 'cancelled'].includes(bill.status);
  const canRequestPayment = !!bill && ['accepted', 'ready', 'served'].includes(bill.status);

  return (
    <div style={{
      width: 400,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: c.card,
      borderLeft: `1px solid ${c.divider}`,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: `${c.ui.spacingBase * 2}px`,
        borderBottom: `1px solid ${c.divider}`,
        display: 'flex',
        alignItems: 'center',
        gap: `${c.ui.spacingBase}px`,
      }}>
        <span style={{
          fontWeight: 700,
          fontSize: c.fontSize('h6'),
          color: c.text,
          flex: 1,
        }}>
          {bill
            ? `Bill #${bill.number}${currentTable ? ` (${currentTable.name})` : ''}`
            : (currentTable ? `Table: ${currentTable.name}` : 'Cart')}
          {cartCount > 0 ? ' (' + cartCount + ')' : ''}
        </span>
        {bill && (
          <POSChip variant="default" size="sm" style={{ color: c.text }}>
            <POSIcon icon={<Lock />} size="sm" variant="default" />
            {bill.status.toUpperCase()}
          </POSChip>
        )}
      </div>

      {/* Items list */}
      <div style={{ flex: 1, overflow: 'auto', padding: `${c.ui.spacingBase * 1.5}px` }}>
        {isEmpty ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100%', color: c.subtext, gap: `${c.ui.spacingBase}px`,
          }}>
            <POSIcon icon={<Restaurant />} size="lg" variant="muted" />
            <span style={{ fontSize: c.fontSize('body2') }}>{bill ? t('order.noNewItems') : t('order.noBill')}</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${c.ui.listGap}px` }}>
            {hasExistingItems && (
              <>
                <span style={{ fontSize: c.fontSize('caption'), fontWeight: 700, color: c.subtext, textTransform: 'uppercase', marginBottom: 2 }}>
                  Previously Added Items ({bill!.items!.length})
                </span>
                {bill!.items!.map(ex => (
                  <POSCard key={`ex-${ex.id}`} variant="outline" padding="sm" minHeight="auto" style={{ backgroundColor: c.input }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: 700, fontSize: c.fontSize('body1'), color: c.text, display: 'block' }}>
                          {ex.name} × {ex.qty}
                        </span>
                        {ex.notes && (
                          <span style={{ fontSize: c.fontSize('caption'), color: c.subtext, fontStyle: 'italic', display: 'block' }}>
                            &quot;{ex.notes}&quot;
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <POSChip variant="status" size="sm" status={ex.status === 'served' ? 'served' : ex.status === 'ready' ? 'ready' : 'accepted'}>
                          {ex.status}
                        </POSChip>
                        <span style={{ fontSize: c.fontSize('body2'), fontWeight: 600, color: c.text }}>
                          ${(ex.price * ex.qty).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </POSCard>
                ))}
                {cart.length > 0 && (
                  <span style={{ fontSize: c.fontSize('caption'), fontWeight: 700, color: c.subtext, textTransform: 'uppercase', marginTop: 8, marginBottom: 2 }}>
                    New Items to Add
                  </span>
                )}
              </>
            )}

            {cart.map(item => (
              <POSCard key={item.uid} variant="default" padding="sm" minHeight="auto">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: `${c.ui.spacingBase}px` }}>
                  {/* Item info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                      fontWeight: 700,
                      fontSize: c.fontSize('body1'),
                      color: c.text,
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {item.name}
                    </span>
                    {item.modifiers.length > 0 && (
                      <span style={{
                        fontSize: c.fontSize('caption'),
                        color: c.subtext,
                        display: 'block',
                        marginTop: 2,
                      }}>
                        {item.modifiers.length} modifier{item.modifiers.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {item.notes && (
                      <span
                        title="Edit note"
                        onClick={() => {
                          if (onEditNotes) {
                            setNotesDraft(item.notes);
                            setEditingNotesUid(item.uid);
                          }
                        }}
                        style={{
                          fontSize: c.fontSize('caption'),
                          color: c.subtext,
                          fontStyle: 'italic',
                          marginTop: 2,
                          display: 'block',
                          cursor: onEditNotes ? 'pointer' : 'default',
                        }}
                        onMouseEnter={(e) => { if (onEditNotes) (e.currentTarget.style.color = c.text); }}
                        onMouseLeave={(e) => { if (onEditNotes) (e.currentTarget.style.color = c.subtext); }}
                      >
                        &quot;{item.notes}&quot;
                      </span>
                    )}
                    {!item.notes && onEditNotes && (
                      <span
                        onClick={() => { setNotesDraft(''); setEditingNotesUid(item.uid); }}
                        style={{
                          fontSize: c.fontSize('caption'),
                          color: c.muted,
                          marginTop: 2,
                          display: 'block',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = c.subtext; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = c.muted; }}
                      >
                        + Add note
                      </span>
                    )}
                    <span style={{
                      fontSize: c.fontSize('body2'),
                      color: c.subtext,
                      marginTop: c.ui.spacingBase / 2,
                      display: 'block',
                    }}>
                      ${(item.price * item.qty).toFixed(2)}
                    </span>
                  </div>

                  {/* Quantity controls + remove */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: `${c.ui.spacingBase / 2}px`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: `${c.ui.spacingBase / 2}px` }}>
                      <POSButton
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQty(item.uid, -1)}
                        style={{ minWidth: 40, minHeight: 40, padding: 0 }}
                      >
                        <POSIcon icon={<Remove />} size="sm" />
                      </POSButton>
                      <span style={{
                        fontWeight: 700,
                        minWidth: 28,
                        textAlign: 'center',
                        fontSize: c.fontSize('body1'),
                        color: c.text,
                      }}>
                        {item.qty}
                      </span>
                      <POSButton
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQty(item.uid, 1)}
                        style={{ minWidth: 40, minHeight: 40, padding: 0 }}
                      >
                        <POSIcon icon={<Add />} size="sm" />
                      </POSButton>
                    </div>
                    <POSButton
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(item.uid)}
                      style={{ minWidth: 40, minHeight: 40, padding: 0, color: c.error }}
                    >
                      <POSIcon icon={<Delete />} size="sm" variant="error" />
                    </POSButton>
                  </div>
                </div>
              </POSCard>
            ))}
          </div>
        )}
      </div>



      {/* Totals */}
      <div style={{
        padding: `${c.ui.spacingBase * 2}px`,
        borderTop: `1px solid ${c.divider}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: c.ui.spacingBase / 2 }}>
          <span style={{ fontSize: c.fontSize('body2'), color: c.subtext, fontWeight: 600 }}>Subtotal</span>
          <span style={{ fontSize: c.fontSize('body2'), color: c.text, fontWeight: 600 }}>${subtotal.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: c.ui.spacingBase / 2 }}>
          <span style={{ fontSize: c.fontSize('body2'), color: c.subtext, fontWeight: 600 }}>Tax ({(taxRate * 100).toFixed(0)}%)</span>
          <span style={{ fontSize: c.fontSize('body2'), color: c.text, fontWeight: 600 }}>${tax.toFixed(2)}</span>
        </div>
        <div style={{ height: 1, backgroundColor: c.divider, margin: `${c.ui.spacingBase}px 0` }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: c.fontSize('body1'), color: c.text }}>Total</span>
          <span style={{ fontWeight: 700, fontSize: c.fontSize('h6'), color: c.text }}>${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{
        padding: `${c.ui.spacingBase * 2}px`,
        borderTop: `1px solid ${c.divider}`,
        display: 'flex',
        flexDirection: 'column',
        gap: `${c.ui.spacingBase * 1.5}px`,
      }}>
        {!bill && canOpenOrder && (
          <>
            <POSButton
              variant="primary"
              size="lg"
              fullWidth
              icon={<POSIcon icon={<Send />} size="md" variant="default" />}
              onClick={onSendToKitchen}
              disabled={cart.length === 0 || busy || !onSendToKitchen}
            >
              Send to Kitchen
            </POSButton>
            <POSButton
              variant="outline"
              size="lg"
              fullWidth
              icon={<POSIcon icon={<Save />} size="md" />}
              onClick={onHoldBill}
              disabled={cart.length === 0 || !onHoldBill}
            >
              Hold / Save
            </POSButton>
          </>
        )}
        {!bill && !canOpenOrder && (
          <span style={{
            fontSize: c.fontSize('caption'),
            color: c.muted,
            textAlign: 'center',
            padding: `${c.ui.spacingBase}px 0`,
          }}>
            You don&apos;t have permission to create orders.
          </span>
        )}
        {bill && canAppend && (
          <>
            {cart.length > 0 && (
              <POSButton
                variant="primary"
                size="lg"
                fullWidth
                icon={<POSIcon icon={<Send />} size="md" variant="default" />}
                onClick={onAppendItems}
                disabled={busy || !onAppendItems}
              >
                Send {cartCount} to Kitchen
              </POSButton>
            )}
            <POSButton
              variant="outline"
              size="lg"
              fullWidth
              icon={<POSIcon icon={<Pause />} size="md" />}
              onClick={onHoldBill}
              disabled={!onHoldBill}
            >
              Hold (Keep Bill Open)
            </POSButton>
            {canRequestPayment && canClose && (
              <POSButton
                variant="success"
                size="lg"
                fullWidth
                icon={<POSIcon icon={<Payment />} size="md" />}
                onClick={() => bill ? setPaymentBill({ id: bill.id, number: bill.number, total: bill.total, status: bill.status }) : null}
                disabled={busy || !bill}
              >
                Request Payment
              </POSButton>
            )}
            {canRequestPayment && !canClose && (
              <span style={{
                fontSize: c.fontSize('caption'),
                color: c.muted,
                textAlign: 'center',
                padding: `${c.ui.spacingBase}px 0`,
              }}>
                Bill is ready — a cashier must process payment.
              </span>
            )}
          </>
        )}
        {cart.length > 0 && (
          <POSButton
            variant="ghost"
            size="sm"
            fullWidth
            onClick={onClearCart}
          >
            Clear new items
          </POSButton>
        )}
      </div>

      {/* Edit notes dialog */}
      {editingNotesUid && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.4)',
          }}
          onClick={() => setEditingNotesUid(null)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420, width: '100%' }}>
            <POSCard variant="elevated" elevation="lg" padding="lg">
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${c.ui.cardGap}px` }}>
                <span style={{ fontSize: c.fontSize('h5'), fontWeight: 700, color: c.text }}>
                  Edit note
                </span>
                <POSTextField
                  variant="default"
                  size="md"
                  value={notesDraft}
                  onChange={setNotesDraft}
                  placeholder="e.g. no onions, extra spicy"
                  fullWidth
                  autoFocus
                />
                <div style={{ display: 'flex', gap: `${c.ui.spacingBase}px`, justifyContent: 'flex-end' }}>
                  <POSButton variant="ghost" size="md" onClick={() => setEditingNotesUid(null)}>
                    Cancel
                  </POSButton>
                  <POSButton
                    variant="primary"
                    size="md"
                    onClick={() => {
                      if (editingNotesUid && onEditNotes) onEditNotes(editingNotesUid, notesDraft.trim());
                      setEditingNotesUid(null);
                    }}
                  >
                    Save
                  </POSButton>
                </div>
              </div>
            </POSCard>
          </div>
        </div>
      )}

      <Toasts controller={toast} />

      {/* M35 - Payment dialog */}
      <PaymentDialog
        open={!!paymentBill}
        onClose={() => setPaymentBill(null)}
        order={paymentBill}
        onSuccess={() => {
          setPaymentBill(null);
          toast.success(t('payment.completed'));
          onPaymentSuccess?.();
        }}
        onError={(msg) => toast.error(msg)}
      />
    </div>
  );
}
