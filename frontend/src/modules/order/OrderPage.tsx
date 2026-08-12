/**
 * OrderPage — primary touch workspace for order entry.
 *
 * Layout: left = menu grid (categories + product buttons + search),
 *         right = cart sidebar (persistent bill view).
 *
 * Designed for fast order entry with minimal navigation:
 *   - Categories + products + prices + modifiers + availability all come
 *     from the backend (GET /api/menu); nothing is hardcoded.
 *   - Tap a product -> ModifierDialog (if it has modifier groups) ->
 *     added to cart with full price delta + notes captured.
 *   - Cart is always visible: qty +/-, remove, edit notes, totals,
 *     and primary actions gated by bill state + user permissions.
 *
 * Three bill states:
 *   1. New bill       (no bill loaded)   -> Send to Kitchen / Hold / Save
 *   2. Existing bill  (loaded from URL)  -> Append Items / Hold / Request Payment
 *
 * Tax rate is loaded from /api/admin/settings on mount so totals are correct
 * for new-bill mode (existing bills use the server-computed totals).
 *
 * Cart uid strategy: the same product added with different modifiers or
 * notes becomes a distinct row. Same product + same modifiers + same notes
 * merges into one row with qty++. This is the standard POS behaviour.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api, apiGet } from '../../core/api';
import { useTheme } from '../../core/theme/monoTheme';
import { usePermissions } from '../../core/permissions';
import { t } from '../multilingual/i18n';
import { useNotifications, Toasts } from '../../shared/notifications';
import MenuGrid from './menu/MenuGrid';
import CartSidebar, { type CartItem, type ExistingBill } from './cart/CartSidebar';
import ModifierDialog from './menu/ModifierDialog';
import type { ProductWithMods } from './menu/ModifierDialog';

function cartUid(item: { product_id: number; modifiers: number[]; notes: string }): string {
  const m = [...item.modifiers].sort((a, b) => a - b).join(',');
  return `${item.product_id}|${m}|${item.notes}`;
}

export default function OrderPage() {
  const [searchParams] = useSearchParams();
  const nav = useNavigate();
  const c = useTheme();
  const { can, userRole, userPermissions } = usePermissions();
  const toast = useNotifications();

  const tableIdFromUrl = searchParams.get('table_id') ? parseInt(searchParams.get('table_id')!) : null;
  const billIdFromUrl = searchParams.get('bill_id') ? parseInt(searchParams.get('bill_id')!) : null;

  const [menu, setMenu] = useState<{ categories: any[]; products: ProductWithMods[] }>({ categories: [], products: [] });
  const [tables, setTables] = useState<any[]>([]);
  const [taxRate, setTaxRate] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [selectedTable, setSelectedTable] = useState<number | null>(tableIdFromUrl);
  const [bill, setBill] = useState<ExistingBill | null>(null);
  const [busy, setBusy] = useState(false);
  const [dialogProduct, setDialogProduct] = useState<ProductWithMods | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [menuData, tablesData, settings] = await Promise.all([
        api.getMenu(),
        api.getTables(),
        api.getSettings().catch(() => null),
      ]);
      setMenu(menuData);
      setTables(tablesData);
      if (settings && typeof settings.tax_rate === 'number') setTaxRate(settings.tax_rate);
    } catch (e: any) {
      toast.error(t('pos.loadMenuFailed'));
    }
  }, []);

  const loadBill = useCallback(async (billId: number) => {
    setBusy(true);
    try {
      const o = await apiGet(`/api/orders/${billId}`);
      setBill({
        id: o.id,
        number: o.number,
        status: o.status,
        subtotal: o.subtotal,
        tax: o.tax,
        total: o.total,
        table_id: o.table_id ?? null,
      });
      if (o.table_id) setSelectedTable(o.table_id);
    } catch (e: any) {
      toast.error(t('pos.loadBillFailed'));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (billIdFromUrl) loadBill(billIdFromUrl);
  }, [billIdFromUrl, loadBill]);

  const refreshBillTotals = useCallback(async () => {
    if (!bill) return;
    try {
      const o = await apiGet(`/api/orders/${bill.id}`);
      setBill(prev => prev ? { ...prev, subtotal: o.subtotal, tax: o.tax, total: o.total, status: o.status } : prev);
    } catch { /* ignore */ }
  }, [bill]);

  const handleProductClick = (product: ProductWithMods) => {
    if (product.modifier_groups.length === 0) {
      addToCart({
        product_id: product.id,
        name: product.name,
        price: product.price,
        qty: 1,
        modifiers: [],
        notes: '',
      });
    } else {
      setDialogProduct(product);
      setDialogOpen(true);
    }
  };

  const addToCart = (item: { product_id: number; name: string; price: number; qty: number; modifiers: number[]; notes: string }) => {
    const uid = cartUid(item);
    setCart(prev => {
      const existing = prev.find(i => i.uid === uid);
      if (existing) {
        return prev.map(i => i.uid === uid ? { ...i, qty: i.qty + item.qty } : i);
      }
      return [...prev, { uid, ...item }];
    });
  };

  const handleModifierConfirm = (payload: { modifiers: number[]; notes: string }) => {
    if (!dialogProduct) return;
    addToCart({
      product_id: dialogProduct.id,
      name: dialogProduct.name,
      price: dialogProduct.price,
      qty: 1,
      modifiers: payload.modifiers,
      notes: payload.notes,
    });
    setDialogOpen(false);
    const msg = t('order.itemAdded');
    setDialogProduct(null);
    toast.success(msg + dialogProduct.name);
  };

  const updateQty = (uid: string, delta: number) => {
    setCart(prev => prev
      .map(i => i.uid === uid ? { ...i, qty: i.qty + delta } : i)
      .filter(i => i.qty > 0)
    );
  };

  const removeItem = (uid: string) => {
    setCart(prev => prev.filter(i => i.uid !== uid));
  };

  const editNotes = (uid: string, notes: string) => {
    setCart(prev => prev.map(i => {
      if (i.uid !== uid) return i;
      const next = { ...i, notes };
      // Re-key so changing notes creates a new row instead of merging back
      next.uid = cartUid({ product_id: i.product_id, modifiers: i.modifiers, notes });
      return next;
    }));
  };

  const handleSendToKitchen = async () => {
    if (cart.length === 0) return;
    if (!can('order.open')) {
      toast.error(t('common.error'));
      return;
    }
    setBusy(true);
    try {
      const items = cart.map(i => ({
        product_id: i.product_id,
        qty: i.qty,
        modifiers: i.modifiers,
        notes: i.notes,
      }));
      await api.checkout({
        table_id: selectedTable,
        type: selectedTable ? 'dine_in' : 'takeaway',
        items,
        payment_method: 'cash',
        tendered: 0,
      });
      setCart([]);
      toast.success(t('order.sendToKitchen'));
      const ts = await api.getTables();
      setTables(ts);
    } catch (e: any) {
      toast.error(t('order.sendOrderFailed'));
    } finally {
      setBusy(false);
    }
  };

  const handleHold = async () => {
    if (cart.length === 0) return;
    if (!can('order.open')) {
      toast.error(t('common.error'));
      return;
    }
    setBusy(true);
    try {
      const items = cart.map(i => ({
        product_id: i.product_id,
        qty: i.qty,
        modifiers: i.modifiers,
        notes: i.notes,
      }));
      await api.checkout({
        table_id: selectedTable,
        type: selectedTable ? 'dine_in' : 'takeaway',
        items,
        payment_method: 'cash',
        tendered: 0,
      });
      setCart([]);
      toast.success(t('order.holdSaved'));
      nav('/tables');
    } catch (e: any) {
      toast.error(t('order.holdBillFailed'));
    } finally {
      setBusy(false);
    }
  };

  const handleAppend = async () => {
    if (!bill || cart.length === 0) return;
    if (!can('order.append')) {
      toast.error(t('common.error'));
      return;
    }
    setBusy(true);
    try {
      const items = cart.map(i => ({
        product_id: i.product_id,
        qty: i.qty,
        modifiers: i.modifiers,
        notes: i.notes,
      }));
      await api.appendItems(bill.id, { items });
      setCart([]);
      const appendedMsg = t('order.itemsAppended') + ' #' + bill.number;
      toast.success(appendedMsg);
      await refreshBillTotals();
    } catch (e: any) {
      toast.error(t('order.appendFailed'));
    } finally {
      setBusy(false);
    }
  };

  const handleRequestPayment = () => {
    if (!bill) return;
    nav(`/pos?close_bill=${bill.id}`);
  };

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      overflow: 'hidden',
      backgroundColor: c.page,
    }}>
      <MenuGrid
        categories={menu.categories}
        products={menu.products}
        selectedCategory={selectedCategory}
        search={search}
        onSearchChange={setSearch}
        onSelectCategory={setSelectedCategory}
        onProductClick={handleProductClick}
      />
      <CartSidebar
        cart={cart}
        tables={tables}
        selectedTable={selectedTable}
        bill={bill}
        taxRate={taxRate}
        busy={busy}
        permissions={userPermissions}
        userRole={userRole || undefined}
        onUpdateQty={updateQty}
        onRemove={removeItem}
        onSelectTable={setSelectedTable}
        onClearCart={() => setCart([])}
        onSendToKitchen={bill ? undefined : handleSendToKitchen}
        onAppendItems={bill ? handleAppend : undefined}
        onHoldBill={handleHold}
        onRequestPayment={bill ? handleRequestPayment : undefined}
        onEditNotes={editNotes}
      />
      <ModifierDialog
        product={dialogProduct}
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setDialogProduct(null); }}
        onConfirm={handleModifierConfirm}
      />
      <Toasts controller={toast} />
    </div>
  );
}
