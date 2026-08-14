/**
 * OrderList — order card grid for station displays (bar / kitchen).
 * Uses shared OrderCard component for rendering individual order tickets.
 */

import { useTheme } from '../../core/theme/monoTheme';
import { POSCard, POSIcon } from '../../components';
import { LocalBar } from '@mui/icons-material';
import OrderCard from '../order/OrderCard';
import { Order, OrderItem } from './types'; // or define locally

export type { Order, OrderItem };

interface Props {
  orders: Order[];
  loading: boolean;
  station: 'bar' | 'kitchen';
  onAccept: (orderId: number) => void;
  onMarkItemStatus: (orderId: number, itemId: number, newStatus: string) => void;
}

export default function OrderList({ orders, loading, station, onAccept, onMarkItemStatus }: Props) {
  const c = useTheme();

  const stationItems = station === 'bar' ? ['bar', 'both'] : ['kitchen', 'both'];
  const filtered = orders.filter(order =>
    order.items.some(item =>
      stationItems.includes(item.station) &&
      ['new', 'preparing'].includes(item.status)
    )
  );

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
      {filtered.map(order => (
        <OrderCard
          key={order.id}
          order={order}
          station={station}
          loading={loading}
          onAccept={onAccept}
          onMarkItemStatus={onMarkItemStatus}
        />
      ))}
    </div>
  );
}
