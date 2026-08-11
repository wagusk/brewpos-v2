/**
 * OrderPage — menu + cart view for order entry.
 *
 * Reads table_id from URL query params (set by CashierPage when navigating).
 * Layout: left = menu grid (categories + products), right = cart sidebar.
 * Uses sub-modules: menu/MenuGrid, cart/CartSidebar.
 */

import { useState, useEffect } from 'react';
import { Box, Typography, Alert, Snackbar } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../core/api';
import { useTheme } from '../../core/theme/monoTheme';
import MenuGrid from './menu/MenuGrid';
import CartSidebar from './cart/CartSidebar';

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

export default function OrderPage() {
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('table_id') ? parseInt(searchParams.get('table_id')!) : null;

  const [menu, setMenu] = useState<{ categories: any[]; products: Product[] }>({ categories: [], products: [] });
  const [tables, setTables] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedTable, setSelectedTable] = useState<number | null>(tableId);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const c = useTheme();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [menuData, tablesData] = await Promise.all([api.getMenu(), api.getTables()]);
      setMenu(menuData);
      setTables(tablesData);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        return prev.map(i => i.product_id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { product_id: product.id, name: product.name, price: product.price, qty: 1, modifiers: [] }];
    });
  };

  const updateQty = (productId: number, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.product_id === productId) {
        const newQty = i.qty + delta;
        return newQty > 0 ? { ...i, qty: newQty } : i;
      }
      return i;
    }).filter(i => i.qty > 0));
  };

  const currentTable = tables.find(t => t.id === selectedTable);

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden', bgcolor: c.page }}>
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
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)} sx={{ bgcolor: c.errorBg, color: c.errorText, border: `1px solid ${c.errorBorder}` }}>{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess(null)}>
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ bgcolor: c.chip, color: c.text, border: `1px solid ${c.cardBorder}` }}>{success}</Alert>
      </Snackbar>
    </Box>
  );
}
