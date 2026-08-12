/**
 * OrderList — order card grid for station displays (bar / kitchen).
 * Shared between BarPage and KitchenPage to avoid duplication.
 *
 * Uses POSCard, POSButton, POSChip, POSIcon for all rendering.
 * Filters by station to show only relevant items.
 */

import { useTheme } from '../../core/theme/monoTheme';
import { POSCard, POSButton, POSChip, POSIcon } from '../../components';
import { LocalBar, SoupKitchen, Fastfood, CheckCircle, AccessTime, Send, Cancel, Note } from '@mui/icons-material';

export interface OrderItem {
  id: number;
  name: string;
  qty: number;
  status: string;
  notes?: string;
  station: string;
}

export interface Order {
  id: number;
  number: number;
  type: string;
  status: string;
  items: OrderItem[];
  notes?: string;
  created_at: string;
  table_name?: string;
}

interface Props {
  orders: Order[];
  loading: boolean;
  station: 'bar' | 'kitchen';
  onAccept: (orderId: number) => void;
  onMarkItemStatus: (orderId: number, itemId: number, newStatus: string) => void;
}

export default function OrderList({ orders, loading, station, onAccept, onMarkItemStatus }: Props) {
  const c = useTheme();

  const stationIcon = (s: string) => {
    if (s === 'bar') return <LocalBar fontSize="small" />;
    if (s === 'both') return <Fastfood fontSize="small" />;
    return <SoupKitchen fontSize="small" />;
  };

  const stationVariant = (s: string): 'default' | 'station' => 'station';

  const filtered = station === 'bar'
    ? orders.filter(order => order.items.some(item => item.station === 'bar' || item.station === 'both'))
    : orders;

  if (filtered.length === 0) {
    return (
      <POSCard variant="default" padding="lg" style={{
        textAlign: 'center',
      }}>
        <POSIcon icon={<LocalBar />} size="lg" variant="muted" />
        <span style={{ fontSize: c.fontSize('h6'), color: c.subtext, display: 'block', marginTop: `${c.ui.spacingBase}px` }}>
          No active orders
        </span>
        <span style={{ fontSize: c.fontSize('body2'), color: c.subtext, display: 'block' }}>
          {station === 'bar' ? 'Drink orders will appear here' : 'Orders will appear here when waiters send them'}
        </span>
      </POSCard>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: `${c.ui.cardGap}px`,
    }}>
      {filtered.map(order => {
        const borderColor = order.status === 'open' ? c.warning : order.status === 'accepted' ? c.success : c.divider;
        return (
          <POSCard
            key={order.id}
            variant="default"
            padding="md"
            style={{
              border: `2px solid ${borderColor}`,
              backgroundColor: order.status === 'open' ? c.chip : 'transparent',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: `${c.ui.spacingBase}px` }}>
              <span style={{ fontWeight: 700, fontSize: c.fontSize('h6'), color: c.text }}>
                #{order.number}
              </span>
              <POSChip variant="default" size="sm">
                {order.table_name || order.type}
              </POSChip>
            </div>

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${c.ui.listGap}px`, marginBottom: `${c.ui.spacingBase}px` }}>
              {order.items
                .filter(item => station === 'bar' ? (item.station === 'bar' || item.station === 'both') : true)
                .map(item => (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: `${c.ui.spacingBase / 2}px 0`,
                    borderBottom: `1px solid ${c.divider}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: `${c.ui.spacingBase / 2}px`, flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 700, fontSize: c.fontSize('body1'), color: c.text }}>
                        {item.qty}x {item.name}
                      </span>
                      <POSChip variant="station" size="sm" stationType={item.station as any}>
                        {item.station}
                      </POSChip>
                      {item.notes && (
                        <span style={{ fontSize: c.fontSize('caption'), color: c.subtext, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.notes}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: `${c.ui.spacingBase / 2}px`, flexShrink: 0 }}>
                      {item.status === 'new' && (
                        <POSButton variant="ghost" size="sm" onClick={() => onMarkItemStatus(order.id, item.id, 'preparing')}>
                          <POSIcon icon={<AccessTime />} size="sm" variant="warning" />
                        </POSButton>
                      )}
                      {item.status === 'preparing' && (
                        <POSButton variant="ghost" size="sm" onClick={() => onMarkItemStatus(order.id, item.id, 'ready')}>
                          <POSIcon icon={<CheckCircle />} size="sm" variant="success" />
                        </POSButton>
                      )}
                      {(item.status === 'new' || item.status === 'preparing') && (
                        <POSButton variant="ghost" size="sm" onClick={() => onMarkItemStatus(order.id, item.id, 'served')}>
                          <POSIcon icon={<Send />} size="sm" variant="info" />
                        </POSButton>
                      )}
                      {item.status !== 'served' && item.status !== 'cancelled' && (
                        <POSButton variant="ghost" size="sm" onClick={() => onMarkItemStatus(order.id, item.id, 'cancelled')}>
                          <POSIcon icon={<Cancel />} size="sm" variant="error" />
                        </POSButton>
                      )}
                      {item.status === 'served' && (
                        <POSIcon icon={<CheckCircle />} size="sm" variant="muted" />
                      )}
                    </div>
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

            {/* Accept button */}
            {order.status === 'open' && (
              <POSButton
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                onClick={() => onAccept(order.id)}
                style={{ marginTop: `${c.ui.spacingBase}px` }}
              >
                Accept
              </POSButton>
            )}

            {/* Timestamp */}
            <span style={{ display: 'block', marginTop: `${c.ui.spacingBase / 2}px`, fontSize: c.fontSize('caption'), color: c.subtext }}>
              {new Date(order.created_at).toLocaleTimeString()}
            </span>
          </POSCard>
        );
      })}
    </div>
  );
}
