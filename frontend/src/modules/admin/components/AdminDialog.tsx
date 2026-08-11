/**
 * Generic admin CRUD dialog — used by Categories/Products/Users/Roles.
 * Renders fields dynamically based on dialogType. No hardcoded text.
 */

import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, TextField, Stack,
} from '@mui/material';

export type DialogType = 'category' | 'product' | 'user' | 'role';

interface Props {
  open: boolean;
  type: DialogType;
  editing: any | null;
  onClose: () => void;
  onSave: (form: any) => Promise<void> | void;
}

function CategoryFields({ form, setForm }: any) {
  return (
    <>
      <TextField label="Name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
      <TextField label="Color" value={form.color || '#5b8def'} onChange={(e) => setForm({ ...form, color: e.target.value })} fullWidth />
      <TextField label="Icon" value={form.icon || 'restaurant'} onChange={(e) => setForm({ ...form, icon: e.target.value })} fullWidth />
      <TextField label="Station" value={form.kind || 'kitchen'} onChange={(e) => setForm({ ...form, kind: e.target.value })} fullWidth />
      <TextField label="Sort" type="number" value={form.sort || 0} onChange={(e) => setForm({ ...form, sort: e.target.value })} fullWidth />
    </>
  );
}

function ProductFields({ form, setForm }: any) {
  return (
    <>
      <TextField label="Name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
      <TextField label="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth />
      <TextField label="Price" type="number" value={form.price || ''} onChange={(e) => setForm({ ...form, price: e.target.value })} fullWidth />
      <TextField label="Category ID" type="number" value={form.category_id || ''} onChange={(e) => setForm({ ...form, category_id: e.target.value })} fullWidth />
      <TextField label="Image" value={form.image || ''} onChange={(e) => setForm({ ...form, image: e.target.value })} fullWidth />
      <TextField label="Cost" type="number" value={form.cost || '0'} onChange={(e) => setForm({ ...form, cost: e.target.value })} fullWidth />
      <TextField label="Station" value={form.kind || ''} onChange={(e) => setForm({ ...form, kind: e.target.value })} fullWidth placeholder="kitchen / bar / both / empty" />
      <TextField label="Sort" type="number" value={form.sort || 0} onChange={(e) => setForm({ ...form, sort: e.target.value })} fullWidth />
    </>
  );
}

function UserFields({ form, setForm }: any) {
  return (
    <>
      <TextField label="Name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
      <TextField label="PIN" value={form.pin || ''} onChange={(e) => setForm({ ...form, pin: e.target.value })} fullWidth />
      <TextField label="Role" value={form.role || 'cashier'} onChange={(e) => setForm({ ...form, role: e.target.value })} fullWidth />
    </>
  );
}

function RoleFields({ form, setForm }: any) {
  return (
    <>
      <TextField label="Name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
      <TextField label="Label" value={form.label || ''} onChange={(e) => setForm({ ...form, label: e.target.value })} fullWidth />
      <TextField label="Color" value={form.color || '#5b8def'} onChange={(e) => setForm({ ...form, color: e.target.value })} fullWidth />
      <TextField label="Sort" type="number" value={form.sort || 0} onChange={(e) => setForm({ ...form, sort: e.target.value })} fullWidth />
    </>
  );
}

const FIELD_MAP: Record<DialogType, React.FC<any>> = {
  category: CategoryFields,
  product: ProductFields,
  user: UserFields,
  role: RoleFields,
};

export default function AdminDialog({ open, type, editing, onClose, onSave }: Props) {
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    setForm(editing ? { ...editing } : {});
  }, [editing, open]);

  const Fields = FIELD_MAP[type];
  const title = `${editing ? 'Edit' : 'Add'} ${type.charAt(0).toUpperCase() + type.slice(1)}`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {title}
  </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Fields form={form} setForm={setForm} />
    </Stack>
  </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => onSave(form)}>Save</Button>
  </DialogActions>
</Dialog>
  );
}
