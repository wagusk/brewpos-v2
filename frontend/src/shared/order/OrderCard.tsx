/**
 * OrderCard — shared order ticket card for kitchen, bar, cashier, and order views.
 * Uses POSCard, POSButton, POSChip, POSIcon, and StatusBadge.
 * Displays order grouping with individual item Accept / Reject buttons.
 */

import { useTheme } from '../../core/theme/monoTheme';
import { POSCard, POSButton, POSChip, POSIcon } from '../../components';
import { CheckCircle, Cancel, Note } from '@mui/icons-material';
import StatusBadge from '../status/StatusBadge';
import { Order } from '../orderlist/OrderList';

interface Props {
  order: Order;
  station?: 'bar' | 'kitchen' | 'all';
  loading?: boolean;
  onAccept?: (orderId: number) => void;
  onMarkItemStatus?: (orderId: number, itemId: number, newStatus: string) => void;
  onClick?: () => void;
}

export default function OrderCard({
  order,
  station = 'all',
  loading = false,
  onAccept,
  onMarkItemStatus,
  onClick,
}: Props) {
  const c = useTheme();

  const stationItems = station === 'bar' ? ['bar', 'both'] : station === 'kitchen' ? ['kitchen', 'both'] : ['bar', 'kitchen', 'both'];
  const filteredItems = order.items.filter(item => stationItems.includes(item.station));

  const borderColor = order.status === 'open' ? c.warning : order.status === 'accepted' ? c.success : c.divider;

  return (
    <POSCard
      variant="default"
      padding="md"
      onClick={onClick}
      style={{
        border: `2px solid ${borderColor}`,
        backgroundColor: order.status === 'open' ? c.chip : 'transparent',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: `${c.ui.spacingBase}px` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: `${c.ui.spacingBase / 2}px` }}>
          <span style={{ fontWeight: 700, fontSize: c.fontSize('h6'), color: c.text }}>
            #{order.number}
          </span>
          <StatusBadge status={order.status} type="order" size="sm" />
        </div>
        <POSChip variant="default" size="sm">
          {order.table_name || order.type}
        </POSChip>
      </div>

      {/* Items with individual Accept & Reject buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: `${c.ui.listGap}px`, marginBottom: `${c.ui.spacingBase}px` }}>
        {filteredItems.map(item => (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: `${c.ui.spacingBase / 2}px 0`,
            borderBottom: `1px solid ${c.divider}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: `${c.ui.spacingBase / 2}px`, flex: 1, minWidth: 0 }}>
              <span style={{ fontWeight: 700, fontSize: c.fontSize('body1'), color: c.text }}>
                {item.qty}x {item.name}
              </span>
              {item.notes && (
                <span style={{ fontSize: c.fontSize('caption'), color: c.subtext, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.notes}
                </span>
              )}
            </div>

            {onMarkItemStatus && (
              <div style={{ display: 'flex', gap: `${c.ui.spacingBase / 2}px`, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                {item.status !== 'ready' && item.status !== 'served' && item.status !== 'cancelled' ? (
                  <>
                    <POSButton
                      variant="primary"
                      size="sm"
                      onClick={() => onMarkItemStatus(order.id, item.id, 'ready')}
                      style={{ minWidth: 'auto', padding: '4px 10px' }}
                    >
                      <POSIcon icon={<CheckCircle />} size="sm" />
                      <span style={{ marginLeft: 4, fontSize: c.fontSize('caption') }}>Accept</span>
                    </POSButton>
                    <POSButton
                      variant="ghost"
                      size="sm"
                      onClick={() => onMarkItemStatus(order.id, item.id, 'cancelled')}
                      style={{ minWidth: 'auto', padding: '4px 10px', color: c.error }}
                    >
                      <POSIcon icon={<Cancel />} size="sm" variant="error" />
                      <span style={{ marginLeft: 4, fontSize: c.fontSize('caption'), color: c.error }}>Reject</span>
                    </POSButton>
                  </>
                ) : (
                  <StatusBadge status={item.status} type="item" size="sm" />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Notes */}
      {order.notes && (
        <div style={{ display: 'flex', alignItems: 'center', gap: `${c.ui.spacingBase / 2}px`, color: c.subtext, marginBottom: `${c.ui.spacingBase}px` }}>
          <POSIcon icon={<Note />} size="sm" variant="muted" />
          <span style={{ fontSize: c.fontSize('caption') }}>{order.notes}</span>
        </div>
      )}

      {/* Accept order button (if entire order open) */}
      {order.status === 'open' && onAccept && (
        <POSButton
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          onClick={(e) => { e.stopPropagation(); onAccept(order.id); }}
          style={{ marginTop: `${c.ui.spacingBase}px` }}
        >
          Accept Order
        </POSButton>
      )}

      {/* Timestamp */}
      <span style={{ display: 'block', marginTop: `${c.ui.spacingBase / 2}px`, fontSize: c.fontSize('caption'), color: c.subtext }}>
        {new Date(order.created_at).toLocaleTimeString()}
      </span>
    </POSCard>
  );
}
