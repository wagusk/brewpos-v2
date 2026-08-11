/**
 * POSPage — unified workspace for all staff roles.
 *
 * After login, everyone lands here. Available sections are driven by
 * permissions, not hardcoded roles. A cashier sees table + order entry;
 * a waiter sees order entry; kitchen/bar see their station display.
 */

import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Alert, Snackbar } from '@mui/material';
import { useTheme } from '../../core/theme/monoTheme';
import { usePermissions } from '../../core/permissions';
import TableFloor from '../cashier/tableview/TableView';
import MenuGrid from '../order/menu/MenuGrid';
import CartSidebar from '../order/cart/CartSidebar';
import OrderList from '../../shared/orderlist/OrderList';
import { api } from '../../core/api';

interface Product {
  id: number;
  name: string;
  price: number;
  category_id: number;
  kind?: string;
}

interface CartItem {
  product_id: number;
  name: string;
  price: number;
  qty: number;
  modifiers: number[];
}

export default function POSPage() {
  const c = useTheme();
  const { can } = usePermissions();
  const [tables, setTables] = useState<any[]>([]);
  const [menu, setMenu] = useState<{ categories: any[]; products: Product[] }>({ categories: [], products: [] });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [menuData, tablesData] = await Promise.all([api.getMenu(), api.getTables()]);
      setMenu(menuData);
      setTables(tablesData);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    loadData();
    const id = window.setInterval(loadData, 10000);
    return () => window.clearInterval(id);
  }, [loadData]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) return prev.map(i => i.product_id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product_id: product.id, name: product.name, price: product.price, qty: 1, modifiers: [] }];
    });
  };

  const updateQty = (productId: number, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.product_id === productId) return i.qty + delta > 0 ? { ...i, qty: i.qty + delta } : i;
      return i;
    }).filter(i => i.qty > 0));
  };

  const handleSendToKitchen = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      await api.checkout({ table_id: selectedTable, type: selectedTable ? 'dine_in' : 'takeaway', items: cart });
      setCart([]);
      setSuccess('Order sent to kitchen');
      loadData();
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleOpenBill = async () => {
    if (!selectedTable) { setError('Please select a table first'); return; }
    setLoading(true);
    try {
      await api.openBill({ table_id: selectedTable, type: 'dine_in' });
      setSuccess('Bill opened on ' + (tables.find(t => t.id === selectedTable)?.name || ''));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const canSeeTables = can('pos.view');
  const canSeeKitchen = can('kitchen.view');
  const canSeeBar = can('bar.view');

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden', bgcolor: c.page }}>
      {/* Left: Table floor (cashier/waiter) */}
      {canSeeTables && (
        <Box sx={{ width: 320, borderRight: '1px solid ' + c.divider, flexShrink: 0 }}>
          <TableFloor tables={tables} selectedTableId={selectedTable} onSelect={(t) => setSelectedTable(t.id)} />
        </Box>
      )}

      {/* Center: Menu + Cart */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <MenuGrid
          categories={menu.categories}
          products={menu.products}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onAddToCart={addToCart}
        />
        <CartSidebar
          cart={cart}
          tables={tables}
          selectedTable={selectedTable}
          onUpdateQty={updateQty}
          onSelectTable={setSelectedTable}
          onClearCart={() => setCart([])}
        />
      </Box>

      {/* Right: Kitchen/Bar station (if permitted) */}
      {(canSeeKitchen || canSeeBar) && (
        <Box sx={{ width: 360, borderLeft: '1px solid ' + c.divider, flexShrink: 0, overflow: 'auto' }}>
          {canSeeKitchen && (
            <Box sx={{ p: 2 }}>
              <Typography sx={{ fontWeight: 700, mb: 1, color: c.text, fontSize: c.fontSize('h6') }}>Kitchen</Typography>
              <OrderList orders={[]} loading={false} station="kitchen" onAccept={() => {}} onMarkItemStatus={() => {}} />
            </Box>
          )}
          {canSeeBar && (
            <Box sx={{ p: 2, borderTop: '1px solid ' + c.divider }}>
              <Typography sx={{ fontWeight: 700, mb: 1, color: c.text, fontSize: c.fontSize('h6') }}>Bar</Typography>
              <OrderList orders={[]} loading={false} station="bar" onAccept={() => {}} onMarkItemStatus={() => {}} />
            </Box>
          )}
        </Box>
      )}

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)} sx={{ bgcolor: c.errorBg, color: c.errorText, border: '1px solid ' + c.errorBorder }}>{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess(null)}>
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ bgcolor: c.chip, color: c.text, border: '1px solid ' + c.cardBorder }}>{success}</Alert>
      </Snackbar>
    </Box>
  );
}
