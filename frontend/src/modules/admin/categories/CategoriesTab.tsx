/**
 * CategoriesTab - list + edit/delete categories.
 * Uses POSCard, POSButton, POSChip, POSIcon.
 */

import { useTheme } from '../../../core/theme/monoTheme';
import { POSCard, POSButton, POSChip, POSIcon } from '../../../components';
import { Add, Edit, Delete } from '@mui/icons-material';

interface Props {
  categories: any[];
  onAdd: () => void;
  onEdit: (cat: any) => void;
  onDelete: (cat: any) => void;
}

export default function CategoriesTab({ categories, onAdd, onEdit, onDelete }: Props) {
  const c = useTheme();
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: `${c.ui.cardGap}px` }}>
        <span style={{ fontSize: c.fontSize('h6'), fontWeight: 700, color: c.text }}>
          Categories ({categories.length})
        </span>
        <POSButton variant="primary" size="md" icon={<Add />} onClick={onAdd}>
          Add Category
        </POSButton>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: `${c.ui.listGap}px` }}>
        {categories.map((cat) => (
          <POSCard key={cat.id} variant="default" padding="md">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: `${c.ui.spacingBase}px`, flex: 1 }}>
                <div style={{ width: 24, height: 24, backgroundColor: cat.color, borderRadius: 4, flexShrink: 0 }} />
                <span style={{ fontSize: c.fontSize('body1'), fontWeight: 600, color: c.text }}>{cat.name}</span>
                <span style={{ fontSize: c.fontSize('body2'), color: c.subtext }}>{cat.icon}</span>
                <POSChip variant="station" size="sm" stationType={cat.kind}>{cat.kind}</POSChip>
              </div>
              <div style={{ display: 'flex', gap: `${c.ui.spacingBase / 2}px` }}>
                <POSButton variant="ghost" size="sm" icon={<Edit />} onClick={() => onEdit(cat)} />
                <POSButton variant="ghost" size="sm" icon={<Delete />} onClick={() => onDelete(cat)} />
              </div>
            </div>
          </POSCard>
        ))}
      </div>
    </div>
  );
}
