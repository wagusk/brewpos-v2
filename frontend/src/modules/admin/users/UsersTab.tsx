/**
 * UsersTab - list + edit/delete users.
 * Uses POSCard, POSButton, POSChip, POSIcon.
 */

import { useTheme } from '../../../core/theme/monoTheme';
import { POSCard, POSButton, POSChip, POSIcon } from '../../../components';
import { Add, Edit, Delete } from '@mui/icons-material';

interface Props {
  users: any[];
  onAdd: () => void;
  onEdit: (usr: any) => void;
  onDelete: (usr: any) => void;
}

export default function UsersTab({ users, onAdd, onEdit, onDelete }: Props) {
  const c = useTheme();
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: `${c.ui.cardGap}px` }}>
        <span style={{ fontSize: c.fontSize('h6'), fontWeight: 700, color: c.text }}>
          Users ({users.length})
        </span>
        <POSButton variant="primary" size="md" icon={<Add />} onClick={onAdd}>
          Add User
        </POSButton>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: `${c.ui.listGap}px` }}>
        {users.map((usr) => (
          <POSCard key={usr.id} variant="default" padding="md">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: `${c.ui.spacingBase}px`, flex: 1 }}>
                <span style={{ fontSize: c.fontSize('body1'), fontWeight: 600, color: c.text }}>{usr.name}</span>
                <POSChip variant="default" size="sm">{usr.role}</POSChip>
                <POSChip variant="status" size="sm" status={usr.active ? 'ready' : 'served'}>
                  {usr.active ? 'Active' : 'Inactive'}
                </POSChip>
              </div>
              <div style={{ display: 'flex', gap: `${c.ui.spacingBase / 2}px` }}>
                <POSButton variant="ghost" size="sm" icon={<Edit />} onClick={() => onEdit(usr)} />
                <POSButton variant="ghost" size="sm" icon={<Delete />} onClick={() => onDelete(usr)} />
              </div>
            </div>
          </POSCard>
        ))}
      </div>
    </div>
  );
}
