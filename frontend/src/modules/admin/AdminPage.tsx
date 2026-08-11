/**
 * AdminPage - orchestrator with tab navigation.
 *
 * Uses shared modules:
 *   - PageTabs / TabPanel for tab layout
 *   - Toasts + useNotifications for error/success notifications
 *   - ConfirmDialog for delete confirmations
 *
 * Each tab is a small standalone component under ./tabs/.
 */

import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { api } from '../../core/api';
import AdminDialog, { type DialogType } from './components/AdminDialog';
import CategoriesTab from './categories/CategoriesTab';
import ProductsTab from './products/ProductsTab';
import UsersTab from './users/UsersTab';
import RolesTab from './roles/RolesTab';
import TablesWorkspace from './tables/TablesWorkspace';
import { PageHeader } from '../../shared/header';
import { PageTabs } from '../../shared/tabpanel';
import { useNotifications, Toasts } from '../../shared/notifications';
import { ConfirmDialog } from '../../shared/dialog';

export default function AdminPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<DialogType>('category');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [pendingDelete, setPendingDelete] = useState<{ type: DialogType; item: any } | null>(null);
  const notify = useNotifications();

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [cats, prods, usrs, rls] = await Promise.all([
        api.getCategories(), api.getProducts(), api.getUsers(), api.getRoles(),
      ]);
      setCategories(cats); setProducts(prods); setUsers(usrs); setRoles(rls);
    } catch (e: any) {
      notify.error(e.message);
    }
  };

  const openDialog = (type: DialogType, item?: any) => {
    setDialogType(type); setEditingItem(item || null); setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditingItem(null); };

  const handleSave = async (form: any) => {
    try {
      switch (dialogType) {
        case 'category':
          if (editingItem) await api.updateCategory(editingItem.id, form);
          else await api.createCategory({ name: form.name, color: form.color || '#5b8def', icon: form.icon || 'restaurant', sort: parseInt(form.sort) || 0, kind: form.kind || 'kitchen' });
          break;
        case 'product':
          if (editingItem) await api.updateProduct(editingItem.id, form);
          else await api.createProduct({ name: form.name, description: form.description || '', price: parseFloat(form.price) || 0, category_id: parseInt(form.category_id), image: form.image || '', active: true, sort: parseInt(form.sort) || 0, cost: parseFloat(form.cost) || 0, kind: form.kind || null });
          break;
        case 'user':
          if (editingItem) await api.updateUser(editingItem.id, form);
          else await api.createUser({ name: form.name, pin: form.pin, role: form.role, permissions: form.permissions || null, active: true });
          break;
        case 'role':
          if (editingItem) await api.updateRole(editingItem.id, form);
          else await api.createRole({ name: form.name, label: form.label, color: form.color || '#5b8def', sort: parseInt(form.sort) || 0 });
          break;
      }
      notify.success(`${editingItem ? 'Updated' : 'Created'} successfully`);
      closeDialog();
      loadAll();
    } catch (e: any) {
      notify.error(e.message);
    }
  };

  const handleDelete = async (type: DialogType, item: any) => {
    setPendingDelete({ type, item });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const { type, item } = pendingDelete;
    setPendingDelete(null);
    try {
      switch (type) {
        case 'category': await api.deleteCategory(item.id); break;
        case 'product': await api.deleteProduct(item.id); break;
        case 'user': await api.deleteUser(item.id); break;
        case 'role': await api.deleteRole(item.id); break;
      }
      notify.success('Deleted successfully');
      loadAll();
    } catch (e: any) {
      notify.error(e.message);
    }
  };

  return (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      <PageHeader title="Admin Panel" subtitle="Manage categories, products, users, and tables" />

      <PageTabs
        tabs={[
          { label: 'Categories', component:
            <CategoriesTab
              categories={categories}
              onAdd={() => openDialog('category')}
              onEdit={(cat) => openDialog('category', cat)}
              onDelete={(cat) => handleDelete('category', cat)}
            /> },
          { label: 'Products', component:
            <ProductsTab
              products={products}
              categories={categories}
              onAdd={() => openDialog('product')}
              onEdit={(prod) => openDialog('product', prod)}
              onDelete={(prod) => handleDelete('product', prod)}
            /> },
          { label: 'Users', component:
            <UsersTab
              users={users}
              onAdd={() => openDialog('user')}
              onEdit={(usr) => openDialog('user', usr)}
              onDelete={(usr) => handleDelete('user', usr)}
            /> },
          { label: 'Tables', component: <TablesWorkspace /> },
          { label: 'Roles', component:
            <RolesTab
              roles={roles}
              onAdd={() => openDialog('role')}
              onEdit={(rl) => openDialog('role', rl)}
              onDelete={(rl) => handleDelete('role', rl)}
            /> },
        ]}
      />

      <AdminDialog
        open={dialogOpen}
        type={dialogType}
        editing={editingItem}
        onClose={closeDialog}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete item?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <Toasts controller={notify} />
  </Box>
  );
}
