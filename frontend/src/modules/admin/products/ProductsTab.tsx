/**
 * ProductsTab - list + edit/delete products.
 * Uses POSCard, POSButton, POSChip, POSIcon.
 */

import { useTheme } from '../../../core/theme/monoTheme';
import { POSCard, POSButton, POSChip, POSIcon } from '../../../components';
import { Add, Edit, Delete } from '@mui/icons-material';

interface Props {
  products: any[];
  categories: any[];
  onAdd: () => void;
  onEdit: (prod: any) => void;
  onDelete: (prod: any) => void;
}

export default function ProductsTab({ products, categories, onAdd, onEdit, onDelete }: Props) {
  const c = useTheme();
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: `${c.ui.cardGap}px` }}>
        <span style={{ fontSize: c.fontSize('h6'), fontWeight: 700, color: c.text }}>
          Products ({products.length})
        </span>
        <POSButton variant="primary" size="md" icon={<Add />} onClick={onAdd}>
          Add Product
        </POSButton>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: `${c.ui.listGap}px` }}>
        {products.map((prod) => (
          <POSCard key={prod.id} variant="default" padding="md">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: `${c.ui.spacingBase}px`, flex: 1 }}>
                <span style={{ fontSize: c.fontSize('body1'), fontWeight: 600, color: c.text }}>{prod.name}</span>
                <span style={{ fontSize: c.fontSize('body1'), color: c.text }}>${prod.price.toFixed(2)}</span>
                <span style={{ fontSize: c.fontSize('body2'), color: c.subtext }}>
                  {categories.find((cat) => cat.id === prod.category_id)?.name}
                </span>
                <POSChip variant="status" size="sm" status={prod.active ? 'ready' : 'served'}>
                  {prod.active ? 'Active' : 'Inactive'}
                </POSChip>
              </div>
              <div style={{ display: 'flex', gap: `${c.ui.spacingBase / 2}px` }}>
                <POSButton variant="ghost" size="sm" icon={<Edit />} onClick={() => onEdit(prod)} />
                <POSButton variant="ghost" size="sm" icon={<Delete />} onClick={() => onDelete(prod)} />
              </div>
            </div>
          </POSCard>
        ))}
      </div>
    </div>
  );
}
