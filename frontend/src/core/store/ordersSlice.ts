/**
 * Redux slice for managing POS orders.
 * Dispatched by WebSocket events for real-time sync.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  modifiers: any[];
  status: string;
}

export interface Order {
  id: number;
  number: number;
  table_id?: number;
  status: 'open' | 'accepted' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled' | 'void';
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  created_by: string;
  created_at: string;
  station?: string;
}

interface OrdersState {
  orders: Record<number, Order>; // id -> order
}

const initialState: OrdersState = {
  orders: {},
};

export const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setOrders: (state, action: PayloadAction<Order[]>) => {
      state.orders = {};
      action.payload.forEach(order => {
        state.orders[order.id] = order;
      });
    },
    addOrUpdate: (state, action: PayloadAction<Order>) => {
      state.orders[action.payload.id] = action.payload;
    },
    removeOrder: (state, action: PayloadAction<number>) => {
      delete state.orders[action.payload];
    },
    updateItem: (state, action: PayloadAction<{ order_id: number; item_id: number; status: string }>) => {
      const order = state.orders[action.payload.order_id];
      if (order) {
        const item = order.items.find(i => i.id === action.payload.item_id);
        if (item) {
          item.status = action.payload.status;
        }
      }
    },
  },
});

export default ordersSlice.reducer;
