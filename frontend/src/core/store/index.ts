import { configureStore } from '@reduxjs/toolkit';
import ordersReducer from './ordersSlice';
import tablesReducer from './tablesSlice';

export const store = configureStore({
  reducer: {
    orders: ordersReducer,
    tables: tablesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
