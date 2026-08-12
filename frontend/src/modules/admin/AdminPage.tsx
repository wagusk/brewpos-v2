/**
 * AdminPage — Multi-column adjustable admin workspace:
 * Supports dynamic columns: [Main Menu] | [Categories] | [Products/Items] | [Details & Actions]
 * All data-driven and fully adjustable via width controls.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTheme } from '../../core/theme/monoTheme';
import { POSCard, POSButton, POSTextField, POSChip, POSIcon } from '../../components';
import { api } from '../../core/api';
import AdminDialog, { type DialogType } from './components/AdminDialog';
import TablesWorkspace from './tables/TablesWorkspace';
import { useNotifications, Toasts } from '../../shared/notifications';
import { ConfirmDialog } from '../../shared/dialog';
import EmptyState from '../../shared/states/EmptyState';
import {
  Inventory2 as ProductIcon,
  People as UserIcon,
  TableRestaurant as TableIcon,
  Security as RoleIcon,
  Category as CategoryIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';

type AdminSection = 'products' | 'users' | 'tables' | 'roles';

interface SectionConfig {
  key: AdminSection;
  label: string;
  icon: React.ReactNode;
}

const SECTIONS: SectionConfig[] = [
  { key: 'products', label: 'Products & Categories', icon: <ProductIcon /> },
  { key: 'users', label: 'Users', icon: <UserIcon /> },
  { key: 'tables', label: 'Tables', icon: <TableIcon /> },
  { key: 'roles', label: 'Roles', icon: <RoleIcon /> },
];

export default function AdminPage() {
  const c = useTheme();
  const notify = useNotifications();

  const [activeSection, setActiveSection] = useState<AdminSection>('products');
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);

  // For Products section: selected category filter ('all' or number id)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | 'all'>('all');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Adjustable column widths
  const [col1Width, setCol1Width] = useState<number>(220);
  const [col2Width, setCol2Width] = useState<number>(220);
  const [col3Width, setCol3Width] = useState<number>(260);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<DialogType>('product');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [pendingDelete, setPendingDelete] = useState<{ type: DialogType; item: any } | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const [cats, prods, usrs, rls, tbls] = await Promise.all([
        api.getCategories(),
        api.getProducts(),
        api.getUsers(),
        api.getRoles(),
        api.getTables(),
      ]);
      setCategories(cats || []);
      setProducts(prods || []);
      setUsers(usrs || []);
      setRoles(rls || []);
      setTables(tbls || []);
    } catch (e: any) {
      notify.error(e?.message || 'Failed to load admin data');
    }
  }, [notify]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    setSelectedItem(null);
    setSelectedCategoryFilter('all');
    setSearchQuery('');
  }, [activeSection]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (selectedCategoryFilter !== 'all') {
      list = list.filter((p) => p.category_id === selectedCategoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((item) =>
        Object.values(item).some((v) => String(v).toLowerCase().includes(q))
      );
    }
    return list;
  }, [products, selectedCategoryFilter, searchQuery]);

  const currentOtherItems = useMemo(() => {
    let list: any[] = [];
    if (activeSection === 'users') list = users;
    else if (activeSection === 'roles') list = roles;

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((item) =>
      Object.values(item).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [activeSection, users, roles, searchQuery]);

  const openDialog = (type: DialogType, item?: any) => {
    setDialogType(type);
    setEditingItem(item || null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
  };

  const handleSave = async (form: any) => {
    try {
      switch (dialogType) {
        case 'category':
          if (editingItem) await api.updateCategory(editingItem.id, form);
          else await api.createCategory({ name: form.name, color: form.color || '#5b8def', icon: form.icon || 'restaurant', sort: parseInt(form.sort) || 0, kind: form.kind || 'kitchen' });
          break;
        case 'product':
          if (editingItem) await api.updateProduct(editingItem.id, form);
          else await api.createProduct({ name: form.name, description: form.description || '', price: parseFloat(form.price) || 0, category_id: parseInt(form.category_id || categories[0]?.id || 1), image: form.image || '', active: true, sort: parseInt(form.sort) || 0, cost: parseFloat(form.cost) || 0, kind: form.kind || null });
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
      notify.error(e?.message || 'Operation failed');
    }
  };

  const handleDeletePrompt = (item: any, type: DialogType) => {
    setPendingDelete({ type, item });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const { type, item } = pendingDelete;
    setPendingDelete(null);
    try {
      if (type === 'category') await api.deleteCategory(item.id);
      else if (type === 'product') await api.deleteProduct(item.id);
      else if (type === 'user') await api.deleteUser(item.id);
      else if (type === 'role') await api.deleteRole(item.id);

      notify.success('Deleted successfully');
      setSelectedItem(null);
      loadAll();
    } catch (e: any) {
      notify.error(e?.message || 'Delete failed');
    }
  };

  const renderHumanReadableDetails = (item: any) => {
    if (!item) return null;
    return Object.entries(item).map(([key, val]) => {
      let displayVal = String(val ?? '—');
      if (typeof val === 'boolean') {
        displayVal = val ? 'Yes' : 'No';
      } else if (key.includes('price') || key.includes('cost')) {
        displayVal = typeof val === 'number' ? `$${val.toFixed(2)}` : String(val);
      } else if (key === 'category_id') {
        const cat = categories.find((c) => c.id === val);
        displayVal = cat ? `${cat.name} (ID: ${val})` : String(val);
      }
      const humanKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      return (
        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${c.divider}` }}>
          <span style={{ fontSize: c.fontSize('body2'), color: c.subtext, fontWeight: 600 }}>{humanKey}</span>
          <span style={{ fontSize: c.fontSize('body2'), color: c.text, fontWeight: 500, textAlign: 'right' }}>{displayVal}</span>
        </div>
      );
    });
  };

  return (
    <div style={{ display: 'flex', height: '100%', backgroundColor: c.page, overflow: 'hidden' }}>
      {/* ── Column 1: Main Menu ────────────────────────────── */}
      <div style={{ width: `${col1Width}px`, minWidth: 180, maxWidth: 320, backgroundColor: c.card, borderRight: `1px solid ${c.cardBorder}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: `${c.ui.cardPadding}px`, borderBottom: `1px solid ${c.cardBorder}` }}>
          <span style={{ fontWeight: 800, fontSize: c.fontSize('h6'), color: c.text }}>Admin Menu</span>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: `${c.ui.spacingBase}px`, display: 'flex', flexDirection: 'column', gap: `${c.ui.spacingBase}px` }}>
          {SECTIONS.map((sec) => {
            const isActive = activeSection === sec.key;
            return (
              <POSCard
                key={sec.key}
                variant="default"
                clickable
                selected={isActive}
                onClick={() => setActiveSection(sec.key)}
                padding="md"
                style={{
                  backgroundColor: isActive ? c.button : c.input,
                  border: `1px solid ${isActive ? c.button : c.cardBorder}`,
                  color: isActive ? c.buttonText : c.text,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: `${c.ui.spacingBase}px` }}>
                    <POSIcon icon={sec.icon} size="md" color={isActive ? c.buttonText : c.subtext} />
                    <span style={{ fontWeight: 700, fontSize: c.fontSize('body1') }}>{sec.label}</span>
                  </div>
                  <ChevronRightIcon sx={{ fontSize: 18, color: isActive ? c.buttonText : c.muted }} />
                </div>
              </POSCard>
            );
          })}
        </div>
        <div style={{ padding: `${c.ui.spacingBase}px`, borderTop: `1px solid ${c.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: c.fontSize('caption'), color: c.subtext }}>Col 1 Width</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <POSButton variant="outline" size="sm" onClick={() => setCol1Width(Math.max(160, col1Width - 20))}>−</POSButton>
            <POSButton variant="outline" size="sm" onClick={() => setCol1Width(Math.min(280, col1Width + 20))}>+</POSButton>
          </div>
        </div>
      </div>

      {/* ── Column 2: Categories (when Products active) OR Submenu ── */}
      {activeSection === 'products' ? (
        <div style={{ width: `${col2Width}px`, minWidth: 180, maxWidth: 320, backgroundColor: c.card, borderRight: `1px solid ${c.cardBorder}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: `${c.ui.cardPadding}px`, borderBottom: `1px solid ${c.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 800, fontSize: c.fontSize('h6'), color: c.text }}>Categories</span>
            <POSButton variant="primary" size="sm" onClick={() => openDialog('category')} icon={<POSIcon icon={<AddIcon />} size="sm" color={c.buttonText} />}>Add</POSButton>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: `${c.ui.spacingBase}px`, display: 'flex', flexDirection: 'column', gap: `${c.ui.spacingBase}px` }}>
            <POSCard
              variant="default"
              clickable
              selected={selectedCategoryFilter === 'all'}
              onClick={() => setSelectedCategoryFilter('all')}
              padding="md"
              style={{
                backgroundColor: selectedCategoryFilter === 'all' ? c.chipActive : c.card,
                border: `1px solid ${selectedCategoryFilter === 'all' ? c.button : c.cardBorder}`,
              }}
            >
              <span style={{ fontWeight: 700, fontSize: c.fontSize('body1'), color: c.text }}>All Categories ({products.length})</span>
            </POSCard>
            {categories.map((cat) => {
              const isSelected = selectedCategoryFilter === cat.id;
              const count = products.filter((p) => p.category_id === cat.id).length;
              return (
                <POSCard
                  key={cat.id}
                  variant="default"
                  clickable
                  selected={isSelected}
                  onClick={() => setSelectedCategoryFilter(cat.id)}
                  padding="md"
                  style={{
                    backgroundColor: isSelected ? c.chipActive : c.card,
                    border: `1px solid ${isSelected ? c.button : c.cardBorder}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: c.fontSize('body1'), color: c.text }}>{cat.name} ({count})</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <POSButton variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openDialog('category', cat); }}>Edit</POSButton>
                      <POSButton variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); handleDeletePrompt(cat, 'category'); }}>Del</POSButton>
                    </div>
                  </div>
                </POSCard>
              );
            })}
          </div>
          <div style={{ padding: `${c.ui.spacingBase}px`, borderTop: `1px solid ${c.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: c.fontSize('caption'), color: c.subtext }}>Col 2 Width</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <POSButton variant="outline" size="sm" onClick={() => setCol2Width(Math.max(160, col2Width - 20))}>−</POSButton>
              <POSButton variant="outline" size="sm" onClick={() => setCol2Width(Math.min(280, col2Width + 20))}>+</POSButton>
            </div>
          </div>
        </div>
      ) : activeSection === 'tables' ? (
        <div style={{ flex: 1, backgroundColor: c.page, overflow: 'auto' }}>
          <TablesWorkspace />
        </div>
      ) : (
        /* Submenu for users / roles */
        <div style={{ width: `${col2Width}px`, minWidth: 200, maxWidth: 340, backgroundColor: c.card, borderRight: `1px solid ${c.cardBorder}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: `${c.ui.cardPadding}px`, borderBottom: `1px solid ${c.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 800, fontSize: c.fontSize('h6'), color: c.text, textTransform: 'capitalize' }}>{activeSection}</span>
            <POSButton variant="primary" size="sm" onClick={() => openDialog(activeSection === 'users' ? 'user' : 'role')} icon={<POSIcon icon={<AddIcon />} size="sm" color={c.buttonText} />}>Add</POSButton>
          </div>
          <div style={{ padding: `${c.ui.spacingBase}px`, borderBottom: `1px solid ${c.cardBorder}` }}>
            <POSTextField variant="search" size="md" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} fullWidth />
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: `${c.ui.spacingBase}px`, display: 'flex', flexDirection: 'column', gap: `${c.ui.spacingBase}px` }}>
            {currentOtherItems.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              return (
                <POSCard
                  key={item.id}
                  variant="default"
                  clickable
                  selected={isSelected}
                  onClick={() => setSelectedItem(item)}
                  padding="md"
                  style={{ backgroundColor: isSelected ? c.chipActive : c.card, border: `1px solid ${isSelected ? c.button : c.cardBorder}` }}
                >
                  <span style={{ fontWeight: 700, fontSize: c.fontSize('body1'), color: c.text }}>{item.name || item.label}</span>
                </POSCard>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Column 3: Products (when Products active) ──────── */}
      {activeSection === 'products' && (
        <div style={{ width: `${col3Width}px`, minWidth: 200, maxWidth: 360, backgroundColor: c.card, borderRight: `1px solid ${c.cardBorder}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: `${c.ui.cardPadding}px`, borderBottom: `1px solid ${c.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 800, fontSize: c.fontSize('h6'), color: c.text }}>Products ({filteredProducts.length})</span>
            <POSButton variant="primary" size="sm" onClick={() => openDialog('product')} icon={<POSIcon icon={<AddIcon />} size="sm" color={c.buttonText} />}>Add</POSButton>
          </div>
          <div style={{ padding: `${c.ui.spacingBase}px`, borderBottom: `1px solid ${c.cardBorder}` }}>
            <POSTextField variant="search" size="md" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} fullWidth />
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: `${c.ui.spacingBase}px`, display: 'flex', flexDirection: 'column', gap: `${c.ui.spacingBase}px` }}>
            {filteredProducts.length === 0 ? (
              <EmptyState title="No products" icon={<ProductIcon />} />
            ) : (
              filteredProducts.map((prod) => {
                const isSelected = selectedItem?.id === prod.id;
                return (
                  <POSCard
                    key={prod.id}
                    variant="default"
                    clickable
                    selected={isSelected}
                    onClick={() => setSelectedItem(prod)}
                    padding="md"
                    style={{ backgroundColor: isSelected ? c.chipActive : c.card, border: `1px solid ${isSelected ? c.button : c.cardBorder}` }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: c.fontSize('body1'), color: c.text }}>{prod.name}</span>
                      <span style={{ fontSize: c.fontSize('caption'), color: c.subtext, fontFamily: 'monospace' }}>${prod.price.toFixed(2)}</span>
                    </div>
                  </POSCard>
                );
              })
            )}
          </div>
          <div style={{ padding: `${c.ui.spacingBase}px`, borderTop: `1px solid ${c.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: c.fontSize('caption'), color: c.subtext }}>Col 3 Width</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <POSButton variant="outline" size="sm" onClick={() => setCol3Width(Math.max(200, col3Width - 20))}>−</POSButton>
              <POSButton variant="outline" size="sm" onClick={() => setCol3Width(Math.min(320, col3Width + 20))}>+</POSButton>
            </div>
          </div>
        </div>
      )}

      {/* ── Column 4 (or 3): Details & Actions ─────────────── */}
      {activeSection !== 'tables' && (
        <div style={{ flex: 1, backgroundColor: c.page, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: `${c.ui.cardPadding}px` }}>
          <div style={{ marginBottom: `${c.ui.cardGap}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 800, fontSize: c.fontSize('h5'), color: c.text }}>Item Details</span>
            {selectedItem && (
              <div style={{ display: 'flex', gap: `${c.ui.spacingBase}px` }}>
                <POSButton variant="outline" size="md" onClick={() => openDialog(activeSection === 'products' ? 'product' : activeSection === 'users' ? 'user' : 'role', selectedItem)} icon={<POSIcon icon={<EditIcon />} size="sm" />}>Edit</POSButton>
                <POSButton variant="danger" size="md" onClick={() => handleDeletePrompt(selectedItem, activeSection === 'products' ? 'product' : activeSection === 'users' ? 'user' : 'role')} icon={<POSIcon icon={<DeleteIcon />} size="sm" color={c.buttonText} />}>Delete</POSButton>
              </div>
            )}
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {selectedItem ? (
              <POSCard variant="default" padding="lg" style={{ backgroundColor: c.card, maxWidth: 600 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: `${c.ui.spacingBase}px` }}>
                  {renderHumanReadableDetails(selectedItem)}
                </div>
              </POSCard>
            ) : (
              <EmptyState title="Select an item" subtitle="Choose an item from the list to view human-readable details and perform actions." icon={<ProductIcon />} />
            )}
          </div>
        </div>
      )}

      {/* Dialogs and Toasts */}
      <AdminDialog
        open={dialogOpen}
        type={dialogType}
        editing={editingItem}
        categories={categories}
        roles={roles}
        onClose={closeDialog}
        onSave={handleSave}
      />
      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete Item?"
        message={pendingDelete ? `Are you sure you want to delete "${pendingDelete.item.name || pendingDelete.item.label || pendingDelete.item.id}"?` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
      <Toasts controller={notify} />
    </div>
  );
}
