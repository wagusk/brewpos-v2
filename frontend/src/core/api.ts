/**
 * API client for Brew-POS v2
 * Connects to backend at configured API_URL
 *
 * API_URL resolution order:
 * 1. localStorage('brewpos_api_url') if set (manual override)
 * 2. Same hostname the page is loaded from, port 8000
  * (dev Vite proxy targets :8000, production backend runs :8000)
 * 3. Fallback to 'http://localhost:8000' for tests
 */
function resolveApiUrl(): string {
 try {
 const stored = localStorage.getItem('brewpos_api_url');
 if (stored) return stored;
 } catch {}
 if (typeof window !== 'undefined' && window.location?.hostname) {
 const { protocol, hostname } = window.location;
 return `${protocol}//${hostname}:8000`;
 }
 return 'http://localhost:8000';
}

const API_URL = resolveApiUrl();

function getToken(): string | null {
  return localStorage.getItem('brewpos_token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiGet(path: string) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export async function apiPost(path: string, data: any) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `${res.status}`);
  }
  return res.json();
}

export async function apiPatch(path: string, data: any) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `${res.status}`);
  }
  return res.json();
}

export async function apiDelete(path: string) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth
  login: (pin: string) => apiPost('/api/auth/login', { pin }),
  me: () => apiGet('/api/auth/me'),

  // Menu
  getMenu: () => apiGet('/api/menu'),
  getTables: () => apiGet('/api/tables'),
  getTableSections: () => apiGet('/api/table-sections'),

  // Orders
  getOrders: () => apiGet('/api/orders'),
  checkout: (data: any) => apiPost('/api/orders/checkout', data),
  openBill: (data: any) => apiPost('/api/orders/open-bill', data),
  closeOrder: (orderId: number, data: any) => apiPost(`/api/orders/${orderId}/close`, data),
  printReceipt: (orderId: number) => apiPost(`/api/orders/${orderId}/print-receipt`, {}),
  updateOrder: (orderId: number, data: any) => apiPatch(`/api/orders/${orderId}`, data),
  acceptOrder: (orderId: number) => apiPost(`/api/orders/${orderId}/accept`, {}),
  cancelOrder: (orderId: number, data: any) => apiPost(`/api/orders/${orderId}/cancel`, data),
  voidOrder: (orderId: number, data: any) => apiPost(`/api/orders/${orderId}/void`, data),
  appendItems: (orderId: number, data: any) => apiPost(`/api/orders/${orderId}/items`, data),
  listOrders: () => apiGet('/api/orders'),

  // Stats
  getStats: () => apiGet('/api/orders/_stats/today'),
  getPrinterStatus: () => apiGet('/api/printer/status'),

  // Admin
  getCategories: () => apiGet('/api/admin/categories'),
  getProducts: () => apiGet('/api/admin/products'),
  getUsers: () => apiGet('/api/admin/users'),
  getRoles: () => apiGet('/api/admin/roles'),
  getAdminTables: () => apiGet('/api/admin/tables'),
  getAdminTableSections: () => apiGet('/api/admin/table-sections'),
  updateTableSections: (data: any) => apiPut('/api/admin/table-sections', data),
  createCategory: (data: any) => apiPost('/api/admin/categories', data),
  updateCategory: (id: number, data: any) => apiPatch(`/api/admin/categories/${id}`, data),
  deleteCategory: (id: number) => apiDelete(`/api/admin/categories/${id}`),
  createProduct: (data: any) => apiPost('/api/admin/products', data),
  updateProduct: (id: number, data: any) => apiPatch(`/api/admin/products/${id}`, data),
  deleteProduct: (id: number) => apiDelete(`/api/admin/products/${id}`),
  createUser: (data: any) => apiPost('/api/admin/users', data),
  updateUser: (id: number, data: any) => apiPatch(`/api/admin/users/${id}`, data),
  deleteUser: (id: number) => apiDelete(`/api/admin/users/${id}`),
  createTable: (data: any) => apiPost('/api/admin/tables', data),
  updateTable: (id: number, data: any) => apiPatch(`/api/admin/tables/${id}`, data),
  deleteTable: (id: number) => apiDelete(`/api/admin/tables/${id}`),
  createRole: (data: any) => apiPost('/api/admin/roles', data),
  updateRole: (id: number, data: any) => apiPatch(`/api/admin/roles/${id}`, data),
  deleteRole: (id: number) => apiDelete(`/api/admin/roles/${id}`),

  // Reports
  getSalesSummary: (params: string) => apiGet(`/api/admin/reports/sales-summary${params}`),
  getSalesByCategory: (params: string) => apiGet(`/api/admin/reports/sales-by-category${params}`),
  getItemSales: (params: string) => apiGet(`/api/admin/reports/item-sales${params}`),
  getPaymentMethods: (params: string) => apiGet(`/api/admin/reports/payment-methods${params}`),
  getBillHistory: (params: string) => apiGet(`/api/admin/reports/bill-history${params}`),

  // Settings
  getSettings: () => apiGet('/api/admin/settings'),
  updateTax: (data: any) => apiPut('/api/admin/settings/tax', data),
  updateTextSize: (data: any) => apiPut('/api/admin/settings/text-size', data),
  updateOrderApproval: (data: any) => apiPost('/api/admin/settings/order-approval', data),
  updateDatabase: (data: any) => apiPut('/api/admin/settings/database', data),
  reloadDatabase: () => apiPost('/api/admin/settings/database/reload', {}),
  resetDatabase: () => apiPost('/api/admin/settings/database/reset', {}),
  restoreDefaults: () => apiPost('/api/admin/settings/database/restore-defaults', {}),
  getPrinterSettings: () => apiGet('/api/admin/settings/printer'),
  updatePrinterSettings: (data: any) => apiPut('/api/admin/settings/printer', data),
  testPrinter: () => apiPost('/api/admin/settings/printer/test', {}),
  getDiscountSettings: () => apiGet('/api/admin/settings/discount'),
  updateDiscountSettings: (data: any) => apiPut('/api/admin/settings/discount', data),

  // i18n
  getLocales: () => apiGet('/api/i18n/locales'),
  getTranslations: (locale: string) => apiGet(`/api/i18n/translations?locale=${locale}`),

  // Modules
  getModules: () => apiGet('/api/modules'),

  // M35 - Payment processing
  initiatePayment: (data: any) => apiPost('/api/payments/initiate', data),
  confirmPayment: (paymentId: number) => apiPost('/api/payments/confirm', { payment_id: paymentId, action: 'confirm' }),
  retryPayment: (paymentId: number) => apiPost('/api/payments/retry', { payment_id: paymentId, action: 'retry' }),
  cancelPayment: (paymentId: number) => apiPost('/api/payments/cancel', { payment_id: paymentId, action: 'cancel' }),
  getPayment: (paymentId: number) => apiGet(`/api/payments/${paymentId}`),
  listOrderPayments: (orderId: number) => apiGet(`/api/payments/order/${orderId}`),

  // Misc
  health: () => apiGet('/health'),
};

async function apiPut(path: string, data: any) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `${res.status}`);
  }
  return res.json();
}
