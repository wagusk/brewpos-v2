/**
 * StatusBadge — shared status badge for orders, tables, items, and payments.
 * Uses POSChip and monoTheme color tokens.
 */

import { useTheme } from '../../core/theme/monoTheme';
import { POSChip } from '../../components';

type StatusType = 'order' | 'table' | 'item' | 'payment';

interface Props {
  status: string;
  type?: StatusType;
  size?: 'sm' | 'md' | 'lg';
}

export default function StatusBadge({ status, type = 'order', size = 'sm' }: Props) {
  const c = useTheme();

  const getLabelAndColor = () => {
    switch (type) {
      case 'order':
        switch (status) {
          case 'open': return { label: 'Open', color: c.warning };
          case 'accepted': return { label: 'Accepted', color: c.info };
          case 'preparing': return { label: 'Preparing', color: c.info };
          case 'ready': return { label: 'Ready', color: c.success };
          case 'served': return { label: 'Served', color: c.success };
          case 'paid': return { label: 'Paid', color: c.success };
          case 'cancelled': return { label: 'Cancelled', color: c.error };
          case 'void': return { label: 'Void', color: c.error };
          default: return { label: status, color: c.subtext };
        }
      case 'table':
        switch (status) {
          case 'free': return { label: 'Free', color: c.success };
          case 'occupied': return { label: 'Occupied', color: c.error };
          case 'reserved': return { label: 'Reserved', color: c.warning };
          case 'inactive': return { label: 'Inactive', color: c.subtext };
          default: return { label: status, color: c.subtext };
        }
      case 'item':
        switch (status) {
          case 'new': return { label: 'New', color: c.warning };
          case 'preparing': return { label: 'Preparing', color: c.info };
          case 'ready': return { label: 'Ready', color: c.success };
          case 'served': return { label: 'Served', color: c.success };
          case 'cancelled': return { label: 'Cancelled', color: c.error };
          default: return { label: status, color: c.subtext };
        }
      case 'payment':
        switch (status) {
          case 'success': case 'paid': return { label: 'Success', color: c.success };
          case 'pending': return { label: 'Pending', color: c.warning };
          case 'failed': return { label: 'Failed', color: c.error };
          case 'cancelled': return { label: 'Cancelled', color: c.error };
          default: return { label: status, color: c.subtext };
        }
    }
  };

  const { label } = getLabelAndColor();

  return (
    <POSChip variant="default" size={size}>
      {label}
    </POSChip>
  );
}
