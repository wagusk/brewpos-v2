/**
 * Generic admin CRUD dialog — used by Categories/Products/Users/Roles.
 * Uses POSCard, POSButton, POSTextField for all rendering.
 */

import { useState, useEffect } from 'react';
import { useTheme } from '../../../core/theme/monoTheme';
import { POSCard, POSButton, POSTextField, POSSelect } from '../../../components';

export type DialogType = 'category' | 'product' | 'user' | 'role';

interface Props {
  open: boolean;
  type: DialogType;
  editing: any | null;
  categories?: any[];
  roles?: any[];
  onClose: () => void;
  onSave: (form: any) => Promise<void> | void;
}

function CategoryFields({ form, setForm }: any) {
  const stationOptions = [
    { label: 'Kitchen', value: 'kitchen' },
    { label: 'Bar', value: 'bar' },
  ];
  return (
    <>
      <POSTextField label="Name" value={form.name || ''} onChange={(v: string) => setForm({ ...form, name: v })} fullWidth />
      <POSTextField label="Color" value={form.color || '#5b8def'} onChange={(v: string) => setForm({ ...form, color: v })} fullWidth />
      <POSTextField label="Icon" value={form.icon || 'restaurant'} onChange={(v: string) => setForm({ ...form, icon: v })} fullWidth />
      <POSSelect label="Station" value={form.kind || 'kitchen'} onChange={(v: any) => setForm({ ...form, kind: v })} options={stationOptions} fullWidth />
      <POSTextField label="Sort" value={form.sort || 0} onChange={(v: string) => setForm({ ...form, sort: v })} fullWidth />
    </>
  );
}

function ProductFields({ form, setForm, categories = [] }: any) {
  const categoryOptions = categories.length > 0
    ? categories.map((cat: any) => ({ label: cat.name, value: cat.id }))
    : [{ label: 'Default Category', value: form.category_id || 1 }];

  const stationOptions = [
    { label: 'Default / Inherit', value: '' },
    { label: 'Kitchen', value: 'kitchen' },
    { label: 'Bar', value: 'bar' },
    { label: 'Both', value: 'both' },
  ];

  return (
    <>
      <POSTextField label="Name" value={form.name || ''} onChange={(v: string) => setForm({ ...form, name: v })} fullWidth />
      <POSTextField label="Description" value={form.description || ''} onChange={(v: string) => setForm({ ...form, description: v })} fullWidth />
      <POSTextField label="Price" value={form.price || ''} onChange={(v: string) => setForm({ ...form, price: v })} fullWidth />
      <POSSelect label="Category" value={form.category_id || (categories[0]?.id ?? '')} onChange={(v: any) => setForm({ ...form, category_id: v })} options={categoryOptions} fullWidth />
      <POSTextField label="Image" value={form.image || ''} onChange={(v: string) => setForm({ ...form, image: v })} fullWidth />
      <POSTextField label="Cost" value={form.cost || '0'} onChange={(v: string) => setForm({ ...form, cost: v })} fullWidth />
      <POSSelect label="Station Override" value={form.kind || ''} onChange={(v: any) => setForm({ ...form, kind: v })} options={stationOptions} fullWidth />
      <POSTextField label="Sort" value={form.sort || 0} onChange={(v: string) => setForm({ ...form, sort: v })} fullWidth />
    </>
  );
}

function UserFields({ form, setForm, roles = [] }: any) {
  const roleOptions = roles.length > 0
    ? roles.map((r: any) => ({ label: r.label || r.name, value: r.name }))
    : [
        { label: 'Admin', value: 'admin' },
        { label: 'Cashier', value: 'cashier' },
        { label: 'Waiter', value: 'waiter' },
        { label: 'Kitchen', value: 'kitchen' },
        { label: 'Bar', value: 'bar' },
      ];

  return (
    <>
      <POSTextField label="Name" value={form.name || ''} onChange={(v: string) => setForm({ ...form, name: v })} fullWidth />
      <POSTextField label="PIN" value={form.pin || ''} onChange={(v: string) => setForm({ ...form, pin: v })} fullWidth />
      <POSSelect label="Role" value={form.role || 'cashier'} onChange={(v: any) => setForm({ ...form, role: v })} options={roleOptions} fullWidth />
    </>
  );
}

function RoleFields({ form, setForm }: any) {
  return (
    <>
      <POSTextField label="Name" value={form.name || ''} onChange={(v: string) => setForm({ ...form, name: v })} fullWidth />
      <POSTextField label="Label" value={form.label || ''} onChange={(v: string) => setForm({ ...form, label: v })} fullWidth />
      <POSTextField label="Color" value={form.color || '#5b8def'} onChange={(v: string) => setForm({ ...form, color: v })} fullWidth />
      <POSTextField label="Sort" value={form.sort || 0} onChange={(v: string) => setForm({ ...form, sort: v })} fullWidth />
    </>
  );
}

const FIELD_MAP: Record<DialogType, React.FC<any>> = {
  category: CategoryFields,
  product: ProductFields,
  user: UserFields,
  role: RoleFields,
};

export default function AdminDialog({ open, type, editing, categories = [], roles = [], onClose, onSave }: Props) {
  const [form, setForm] = useState<any>({});
  const c = useTheme();

  useEffect(() => {
    setForm(editing ? { ...editing } : {});
  }, [editing, open]);

  if (!open) return null;

  const Fields = FIELD_MAP[type];
  const title = `${editing ? 'Edit' : 'Add'} ${type.charAt(0).toUpperCase() + type.slice(1)}`;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
      }}
      onClick={onClose}
    >
      <div onClick={(e: React.MouseEvent) => e.stopPropagation()} style={{ maxWidth: 480, width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <POSCard variant="elevated" elevation="lg" padding="lg" style={{ display: 'flex', flexDirection: 'column', maxHeight: '85vh', overflow: 'hidden' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${c.ui.cardGap}px`, maxHeight: '100%', overflow: 'hidden' }}>
            <span style={{ fontSize: c.fontSize('h5'), fontWeight: 700, color: c.text, flexShrink: 0 }}>
              {title}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${c.ui.spacingBase}px`, overflowY: 'auto', flex: 1, paddingRight: 4 }}>
              <Fields form={form} setForm={setForm} categories={categories} roles={roles} />
            </div>
            <div style={{ display: 'flex', gap: `${c.ui.spacingBase}px`, justifyContent: 'flex-end', marginTop: `${c.ui.spacingBase}px`, flexShrink: 0 }}>
              <POSButton variant="ghost" size="md" onClick={onClose}>Cancel</POSButton>
              <POSButton variant="primary" size="md" onClick={() => onSave(form)}>Save</POSButton>
            </div>
          </div>
        </POSCard>
      </div>
    </div>
  );
}
