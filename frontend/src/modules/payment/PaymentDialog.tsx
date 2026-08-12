/**
 * PaymentDialog — full payment flow with processing state, duplicate prevention,
 * amount validation, and retry/cancel semantics.
 *
 * State machine (driven by backend):
 *   idle -> initiating -> processing -> completed
 *                                 \-> failed  -> (retry) -> processing
 *                                 \-> cancelled
 *
 * Props:
 *   open, onClose, order, onSuccess, onError
 *
 * The dialog is purely a view/controller. All logic lives in the backend
 * payment service. The UI reflects the payment status returned by the server.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Payment as PaymentIcon, CheckCircle, Error as ErrorIcon, Cancel as CancelIcon,
  Refresh as RefreshIcon, Money as MoneyIcon, CreditCard, PhoneAndroid,
} from '@mui/icons-material';
import { useTheme } from '../../core/theme/monoTheme';
import { api } from '../../core/api';
import POSCard from '../../components/POSCard';
import POSButton from '../../components/POSButton';
import POSChip from '../../components/POSChip';
import POSIcon from '../../components/POSIcon';

interface Props {
  open: boolean;
  onClose: () => void;
  order: { id: number; number: number; total: number; status: string } | null;
  onSuccess?: () => void;
  onError?: (msg: string) => void;
}

type PaymentStatus = 'idle' | 'initiating' | 'processing' | 'completed' | 'failed' | 'cancelled';

interface PaymentState {
  id: number | null;
  status: PaymentStatus;
  amount: number;
  method: string;
  error: string;
  provider: string;
}

export default function PaymentDialog({ open, onClose, order, onSuccess, onError }: Props) {
  const c = useTheme();
  const [busy, setBusy] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>('cash');
  const [selectedProvider, setSelectedProvider] = useState<string>('mock');
  const [payment, setPayment] = useState<PaymentState>({
    id: null, status: 'idle', amount: 0, method: 'cash', error: '', provider: 'mock',
  });
  const [snack, setSnack] = useState<{ msg: string; severity: 'success' | 'error' | 'info' } | null>(null);
  const idempotencyRef = useRef<string>('');
  const pollingRef = useRef<number | null>(null);

  const canStart = !busy && payment.status !== 'processing' && payment.status !== 'initiating';
  const amount = order ? order.total : 0;

  // Reset state when dialog opens with a new order
  useEffect(() => {
    if (open && order) {
      setPayment({
        id: null, status: 'idle', amount: order.total, method: 'cash', error: '', provider: 'mock',
      });
      idempotencyRef.current = `${order.id}_${Date.now()}`;
    }
    if (!open) {
      cleanupPolling();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, order?.id]);

  const cleanupPolling = () => {
    if (pollingRef.current) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  // Poll for payment status while processing
  const startPolling = useCallback((paymentId: number) => {
    cleanupPolling();
    pollingRef.current = window.setInterval(async () => {
      try {
        const p = await api.getPayment(paymentId);
        if (p.status === 'completed') {
          cleanupPolling();
          setPayment(prev => ({ ...prev, status: 'completed', id: p.id }));
          setSnack({ msg: `Payment #${p.id} completed`, severity: 'success' });
          onSuccess?.();
        } else if (p.status === 'failed') {
          cleanupPolling();
          setPayment(prev => ({ ...prev, status: 'failed', error: p.error_message || 'Payment failed' }));
        }
      } catch {
        // Ignore polling errors — retry on next tick
      }
    }, 1000);
  }, [onSuccess]);

  const handleInitiate = async () => {
    if (!order) return;
    setBusy(true);
    setPayment(prev => ({ ...prev, status: 'initiating', method: selectedMethod, provider: selectedProvider }));
    try {
      const result = await api.initiatePayment({
        order_id: order.id,
        method: selectedMethod,
        tendered: amount,
        provider: selectedProvider,
        idempotency_key: idempotencyRef.current,
      });
      setPayment({
        id: result.id,
        status: result.status as PaymentStatus,
        amount: result.amount,
        method: result.method,
        error: result.error_message || '',
        provider: result.provider,
      });
      // Auto-confirm for mock / instant providers; for real providers this would be async
      if (result.status === 'processing') {
        // Try confirm immediately (mock provider completes synchronously)
        handleConfirm(result.id);
      } else if (result.status === 'completed') {
        setSnack({ msg: `Payment #${result.id} completed`, severity: 'success' });
        onSuccess?.();
      }
    } catch (e: any) {
      const msg = e.message || 'Failed to initiate payment';
      setPayment(prev => ({ ...prev, status: 'failed', error: msg }));
      setSnack({ msg, severity: 'error' });
      onError?.(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async (paymentId: number) => {
    setBusy(true);
    try {
      const result = await api.confirmPayment(paymentId);
      setPayment({
        id: result.id,
        status: result.status as PaymentStatus,
        amount: result.amount,
        method: result.method,
        error: result.error_message || '',
        provider: result.provider,
      });
      if (result.status === 'completed') {
        setSnack({ msg: `Payment #${result.id} completed`, severity: 'success' });
        onSuccess?.();
      } else if (result.status === 'failed') {
        setSnack({ msg: result.error_message || 'Payment confirmation failed', severity: 'error' });
      }
    } catch (e: any) {
      const msg = e.message || 'Failed to confirm payment';
      setPayment(prev => ({ ...prev, status: 'failed', error: msg }));
      setSnack({ msg, severity: 'error' });
      onError?.(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleRetry = async () => {
    if (!payment.id) return;
    setBusy(true);
    setPayment(prev => ({ ...prev, status: 'initiating', error: '' }));
    try {
      const result = await api.retryPayment(payment.id);
      setPayment({
        id: result.id,
        status: result.status as PaymentStatus,
        amount: result.amount,
        method: result.method,
        error: result.error_message || '',
        provider: result.provider,
      });
      if (result.status === 'processing') {
        handleConfirm(result.id);
      } else if (result.status === 'completed') {
        setSnack({ msg: `Payment #${result.id} completed`, severity: 'success' });
        onSuccess?.();
      }
    } catch (e: any) {
      const msg = e.message || 'Failed to retry payment';
      setPayment(prev => ({ ...prev, status: 'failed', error: msg }));
      setSnack({ msg, severity: 'error' });
      onError?.(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    if (!payment.id) return;
    setBusy(true);
    try {
      const result = await api.cancelPayment(payment.id);
      setPayment({
        id: result.id,
        status: 'cancelled',
        amount: result.amount,
        method: result.method,
        error: '',
        provider: result.provider,
      });
      setSnack({ msg: 'Payment cancelled', severity: 'info' });
    } catch (e: any) {
      setSnack({ msg: e.message || 'Failed to cancel', severity: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const handleClose = () => {
    cleanupPolling();
    setSnack(null);
    onClose();
  };

  const statusColor = (s: PaymentStatus) => {
    switch (s) {
      case 'completed': return c.success;
      case 'failed': return c.errorText;
      case 'processing':
      case 'initiating': return c.warning;
      case 'cancelled': return c.muted;
      default: return c.subtext;
    }
  };

  const statusLabel = (s: PaymentStatus) => {
    switch (s) {
      case 'initiating': return 'Initiating payment...';
      case 'processing': return 'Processing payment...';
      case 'completed': return 'Payment completed';
      case 'failed': return 'Payment failed';
      case 'cancelled': return 'Payment cancelled';
      default: return '';
    }
  };

  // CSS spinner for loading states
  const spinnerStyle: React.CSSProperties = {
    width: 48,
    height: 48,
    border: `4px solid ${c.divider}`,
    borderTopColor: statusColor(payment.status),
    borderRadius: '50%',
    animation: 'posSpin 1s linear infinite',
  };

  if (!open) return null;

  return (
    <>
      {/* Global keyframe injected once */}
      <style>{`
        @keyframes posSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Backdrop overlay */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Dialog card */}
        <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <POSCard
          variant="elevated"
          elevation="lg"
          padding={0}
          style={{
            width: '100%',
            maxWidth: 480,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: c.ui.spacingBase,
            padding: `${c.ui.cardPadding}px`,
            paddingBottom: 0,
          }}>
            <POSIcon icon={<PaymentIcon />} size="md" variant="info" />
            <span style={{
              fontSize: c.fontSize('h6'),
              fontWeight: 700,
              color: c.text,
            }}>
              Payment — Bill #{order?.number}
            </span>
          </div>

          {/* Content */}
          <div style={{ padding: `${c.ui.cardPadding}px`, display: 'flex', flexDirection: 'column', gap: c.ui.cardGap }}>
            {/* Amount summary */}
            <POSCard
              variant="default"
              padding="md"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: c.input,
                border: `1px solid ${c.inputBorder}`,
              }}
            >
              <span style={{ fontSize: c.fontSize('body2'), color: c.subtext }}>
                Bill total
              </span>
              <span style={{ fontWeight: 700, fontSize: c.fontSize('h6'), color: c.text }}>
                ${amount.toFixed(2)}
              </span>
            </POSCard>

            {/* Payment method selector — only before processing starts */}
            {payment.status === 'idle' && (
              <>
                <span style={{ fontSize: c.fontSize('body2'), color: c.subtext, fontWeight: 600 }}>
                  Payment method
                </span>
                <div style={{ display: 'flex', gap: c.ui.cardGap, flexWrap: 'wrap' }}>
                  {[
                    { value: 'cash', label: 'Cash', icon: <MoneyIcon /> },
                    { value: 'card', label: 'Card', icon: <CreditCard /> },
                    { value: 'mobile', label: 'Mobile', icon: <PhoneAndroid /> },
                  ].map(opt => (
                    <POSChip
                      key={opt.value}
                      variant="payment"
                      paymentType={opt.value as 'cash' | 'card' | 'mobile'}
                      selected={selectedMethod === opt.value}
                      onClick={() => setSelectedMethod(opt.value)}
                      size="md"
                      icon={<POSIcon icon={opt.icon} size="sm" color={selectedMethod === opt.value ? c.buttonText : c.subtext} />}
                    >
                      {opt.label}
                    </POSChip>
                  ))}
                </div>

                <span style={{ fontSize: c.fontSize('body2'), color: c.subtext, fontWeight: 600 }}>
                  Provider
                </span>
                <div style={{ display: 'flex', gap: c.ui.cardGap, flexWrap: 'wrap' }}>
                  {['mock', 'stripe'].map(p => (
                    <POSChip
                      key={p}
                      variant="default"
                      selected={selectedProvider === p}
                      onClick={() => setSelectedProvider(p)}
                      size="md"
                    >
                      {p}
                    </POSChip>
                  ))}
                </div>
              </>
            )}

            {/* Processing state */}
            {payment.status !== 'idle' && (
              <POSCard
                variant="default"
                padding="lg"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: c.ui.cardGap,
                  backgroundColor: c.input,
                  border: `1px solid ${c.inputBorder}`,
                }}
              >
                {/* Status icon or spinner */}
                {payment.status === 'initiating' || payment.status === 'processing' ? (
                  <div style={spinnerStyle} />
                ) : payment.status === 'completed' ? (
                  <POSIcon icon={<CheckCircle />} size="lg" variant="success" />
                ) : payment.status === 'failed' ? (
                  <POSIcon icon={<ErrorIcon />} size="lg" variant="error" />
                ) : (
                  <POSIcon icon={<CancelIcon />} size="lg" variant="muted" />
                )}

                <span style={{ fontWeight: 700, fontSize: c.fontSize('body1'), color: statusColor(payment.status) }}>
                  {statusLabel(payment.status)}
                </span>

                {payment.status === 'processing' && (
                  <span style={{ fontSize: c.fontSize('caption'), color: c.subtext }}>
                    Waiting for provider confirmation...
                  </span>
                )}

                {/* Error display */}
                {payment.error && (
                  <POSCard
                    variant="default"
                    padding="md"
                    style={{
                      width: '100%',
                      backgroundColor: c.errorBg,
                      border: `1px solid ${c.errorBorder}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: c.ui.spacingBase }}>
                      <POSIcon icon={<ErrorIcon />} size="sm" variant="error" />
                      <span style={{ fontSize: c.fontSize('body2'), color: c.errorText, fontWeight: 500 }}>
                        {payment.error}
                      </span>
                    </div>
                  </POSCard>
                )}

                {/* Completed badge */}
                {payment.status === 'completed' && (
                  <POSChip
                    variant="default"
                    color={c.success}
                    size="md"
                  >
                    Payment #{payment.id}
                  </POSChip>
                )}
              </POSCard>
            )}
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: c.ui.cardGap,
            padding: `${c.ui.cardPadding}px`,
            borderTop: `1px solid ${c.divider}`,
            justifyContent: 'flex-end',
          }}>
            {payment.status === 'idle' && (
              <>
                <POSButton variant="outline" size="md" onClick={handleClose}>
                  Cancel
                </POSButton>
                <POSButton
                  variant="primary"
                  size="md"
                  onClick={handleInitiate}
                  disabled={!canStart}
                  loading={busy}
                  icon={<POSIcon icon={<PaymentIcon />} size="sm" color={c.buttonText} />}
                >
                  {busy ? 'Initiating...' : 'Pay'}
                </POSButton>
              </>
            )}

            {payment.status === 'failed' && (
              <>
                <POSButton variant="outline" size="md" onClick={handleClose}>
                  Close
                </POSButton>
                <POSButton
                  variant="secondary"
                  size="md"
                  onClick={handleCancel}
                  disabled={busy}
                  icon={<POSIcon icon={<CancelIcon />} size="sm" />}
                >
                  Cancel Payment
                </POSButton>
                <POSButton
                  variant="primary"
                  size="md"
                  onClick={handleRetry}
                  disabled={busy}
                  loading={busy}
                  icon={<POSIcon icon={<RefreshIcon />} size="sm" color={c.buttonText} />}
                >
                  Retry
                </POSButton>
              </>
            )}

            {(payment.status === 'completed' || payment.status === 'cancelled') && (
              <POSButton variant="primary" size="md" onClick={handleClose}>
                Done
              </POSButton>
            )}

            {payment.status === 'processing' && (
              <POSButton
                variant="danger"
                size="md"
                onClick={handleCancel}
                disabled={busy}
                icon={<POSIcon icon={<CancelIcon />} size="sm" color="#fff" />}
              >
                Cancel
              </POSButton>
            )}
          </div>
        </POSCard>
        </div>
      </div>

      {/* Toast notification */}
      {snack && (
        <div
          onClick={() => setSnack(null)}
          style={{
            position: 'fixed',
            bottom: c.ui.cardGap * 3,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1400,
            cursor: 'pointer',
          }}
        >
          <POSCard
            variant="elevated"
            elevation="md"
            padding="md"
            style={{
              backgroundColor: snack.severity === 'error' ? c.errorBg
                : snack.severity === 'success' ? c.successLight
                : c.input,
              border: `1px solid ${snack.severity === 'error' ? c.errorBorder
                : snack.severity === 'success' ? c.success
                : c.divider}`,
              minWidth: 280,
              maxWidth: 480,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: c.ui.spacingBase }}>
              <POSIcon
                icon={snack.severity === 'error' ? <ErrorIcon /> : snack.severity === 'success' ? <CheckCircle /> : <RefreshIcon />}
                size="sm"
                variant={snack.severity === 'error' ? 'error' : snack.severity === 'success' ? 'success' : 'info'}
              />
              <span style={{
                fontSize: c.fontSize('body2'),
                color: snack.severity === 'error' ? c.errorText : snack.severity === 'success' ? c.successDark : c.text,
                fontWeight: 500,
              }}>
                {snack.msg}
              </span>
            </div>
          </POSCard>
        </div>
      )}
    </>
  );
}
