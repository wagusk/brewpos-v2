/**
 * Redux slice for managing tables.
 * Dispatched by WebSocket events and admin operations for real-time sync.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Table {
  id: number;
  name: string;
  seats: number;
  active: boolean;
  section?: string;
  sort?: number;
}

interface TablesState {
  tables: Record<number, Table>; // id -> table
}

const initialState: TablesState = {
  tables: {},
};

export const tablesSlice = createSlice({
  name: 'tables',
  initialState,
  reducers: {
    setTables: (state, action: PayloadAction<Table[]>) => {
      state.tables = {};
      action.payload.forEach(table => {
        state.tables[table.id] = table;
      });
    },
    addOrUpdate: (state, action: PayloadAction<Table>) => {
      state.tables[action.payload.id] = action.payload;
    },
    removeTable: (state, action: PayloadAction<number>) => {
      delete state.tables[action.payload];
    },
  },
});

export default tablesSlice.reducer;
