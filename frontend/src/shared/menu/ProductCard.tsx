/**
 * ProductCard — shared product card for menu grid, cashier, and order selection.
 * Uses POSCard and monoTheme tokens.
 */

import { useTheme } from '../../core/theme/monoTheme';
import { POSCard } from '../../components';

interface Product {
  id: number;
  name: string;
  price: number;
  category_id?: number;
  image_url?: string;
  station?: string;
  available?: boolean;
}

interface Props {
  product: Product;
  onClick?: () => void;
}

export default function ProductCard({ product, onClick }: Props) {
  const c = useTheme();

  return (
    <POSCard
      variant="default"
      padding="md"
      clickable={product.available !== false}
      onClick={product.available !== false ? onClick : undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '110px',
        opacity: product.available !== false ? 1 : 0.5,
        border: `1px solid ${c.divider}`,
      }}
    >
      <span style={{ fontWeight: 700, fontSize: c.fontSize('body1'), color: c.text, lineHeight: 1.2 }}>
        {product.name}
      </span>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <span style={{ fontWeight: 700, fontSize: c.fontSize('h6'), color: c.primary }}>
          ${product.price.toFixed(2)}
        </span>
      </div>
    </POSCard>
  );
}
