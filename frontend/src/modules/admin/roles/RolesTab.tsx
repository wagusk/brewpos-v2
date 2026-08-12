/**
 * RolesTab - list + edit/delete roles.
 * Uses POSCard, POSButton, POSIcon.
 */

import { useTheme } from '../../../core/theme/monoTheme';
import { POSCard, POSButton, POSIcon } from '../../../components';
import { Add, Edit, Delete } from '@mui/icons-material';

interface Props {
  roles: any[];
  onAdd: () => void;
  onEdit: (rl: any) => void;
  onDelete: (rl: any) => void;
}

export default function RolesTab({ roles, onAdd, onEdit, onDelete }: Props) {
  const c = useTheme();
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: `${c.ui.cardGap}px` }}>
        <span style={{ fontSize: c.fontSize('h6'), fontWeight: 700, color: c.text }}>
          Roles ({roles.length})
        </span>
        <POSButton variant="primary" size="md" icon={<Add />} onClick={onAdd}>
          Add Role
        </POSButton>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: `${c.ui.listGap}px` }}>
        {roles.map((rl) => (
          <POSCard key={rl.id} variant="default" padding="md">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: `${c.ui.spacingBase}px`, flex: 1 }}>
                <div style={{ width: 16, height: 16, backgroundColor: rl.color, borderRadius: 4, flexShrink: 0 }} />
                <span style={{ fontSize: c.fontSize('body1'), fontWeight: 600, color: c.text }}>{rl.name}</span>
                <span style={{ fontSize: c.fontSize('body2'), color: c.subtext }}>{rl.label}</span>
              </div>
              <div style={{ display: 'flex', gap: `${c.ui.spacingBase / 2}px` }}>
                <POSButton variant="ghost" size="sm" icon={<Edit />} onClick={() => onEdit(rl)} />
                <POSButton variant="ghost" size="sm" icon={<Delete />} onClick={() => onDelete(rl)} />
              </div>
            </div>
          </POSCard>
        ))}
      </div>
    </div>
  );
}
