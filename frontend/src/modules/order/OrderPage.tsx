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
import { onWebSocketMessage } from '../../core/ws';
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
  const orderIdFromUrl = searchParams.get('order_id') ? parseInt(searchParams.get('order_id')!) : (searchParams.get('bill_id') ? parseInt(searchParams.get('bill_id')!) : null);

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

      if (tableIdFromUrl && !orderIdFromUrl) {
        const found = tablesData.find((t: any) => t.id === tableIdFromUrl);
        if (found && found.order_id != null) {
          loadBill(found.order_id);
        }
      }
    } catch (e: any) {
      toast.error(t('pos.loadMenuFailed'));
    }
  }, [tableIdFromUrl, orderIdFromUrl]);

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
        items: o.items || [],
      });
      if (o.table_id) setSelectedTable(o.table_id);
    } catch (e: any) {
      toast.error(t('pos.loadBillFailed'));
    } finally {
      setBusy(false);
    }
  }, []);

  /**
   * Single-bill-per-table guard (frontend pre-check).
   * Returns the existing open bill for the given table if one exists,
   * or null if the table is free. The backend enforces this too, but
   * checking here lets us guide the waiter to the existing bill instead
   * of showing a generic error.
   */
  const findOpenBillForTable = useCallback((tableId: number | null): { order_id: number; order_number: number } | null => {
    if (!tableId) return null;
    const table = tables.find(tt => tt.id === tableId);
    if (table && table.order_id != null) {
      return { order_id: table.order_id, order_number: table.order_number };
    }
    return null;
  }, [tables]);

  /**
   * Called by CartSidebar when the M35 payment dialog completes a bill.
   * The order is now "paid" — go back to the table overview, which will
   * reflect the table as free (via WebSocket broadcast + its own listener).
   */
  const handlePaymentSuccess = useCallback(() => {
    nav('/tables');
  }, [nav]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (orderIdFromUrl) loadBill(orderIdFromUrl);
  }, [orderIdFromUrl, loadBill]);

  const refreshBillTotals = useCallback(async () => {
    if (!bill) return;
    try {
      const o = await apiGet(`/api/orders/${bill.id}`);
      setBill(prev => prev ? { ...prev, subtotal: o.subtotal, tax: o.tax, total: o.total, status: o.status } : prev);
    } catch { /* ignore */ }
  }, [bill]);

  // Real-time: refresh the current bill when another terminal updates it
  // (e.g. a cashier closing the bill, an item being served, a payment
  // processed). This keeps the OrderPage bill section in sync with the
  // Table View and other terminals.
  useEffect(() => {
    const unsubscribe = onWebSocketMessage((event, data) => {
      if (!bill) return;
      if (event !== 'order_updated' && event !== 'order_closed' && event !== 'order_cancelled') return;
      if (data?.id !== bill.id) return;
      if (event === 'order_closed' || event === 'order_cancelled') {
        nav('/tables');
      } else {
        refreshBillTotals();
      }
    });

    return () => unsubscribe();
  }, [bill, refreshBillTotals, nav]);

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
    // Single-bill-per-table: if the table already has an open bill,
    // load it and let the waiter append items instead of creating a new bill.
    if (selectedTable) {
      const existing = findOpenBillForTable(selectedTable);
      if (existing) {
        setBill(null);
        loadBill(existing.order_id);
        toast.info(t('order.tableHasOpenBill').replace('{number}', String(existing.order_number)));
        return;
      }
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
      toast.error(e.message || t('order.sendOrderFailed'));
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
    // Single-bill-per-table: if the table already has an open bill,
    // load it instead of creating a duplicate.
    if (selectedTable) {
      const existing = findOpenBillForTable(selectedTable);
      if (existing) {
        setBill(null);
        loadBill(existing.order_id);
        toast.info(t('order.tableHasOpenBill').replace('{number}', String(existing.order_number)));
        return;
      }
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
      toast.error(e.message || t('order.holdBillFailed'));
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
        onPaymentSuccess={handlePaymentSuccess}
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
