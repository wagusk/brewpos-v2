import type { Category, DiscountPolicy, Menu, ModuleState, Order, Payment, PosOpsSettings, PrinterSettings, Settings, Table, Tax, User } from './types'

const API_ROOT = import.meta.env.VITE_API_URL ?? ''
let token = localStorage.getItem('brewpos_token') ?? ''

export function setToken(value: string) { token = value; value ? localStorage.setItem('brewpos_token', value) : localStorage.removeItem('brewpos_token') }
export function getToken() { return token }

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(`${API_ROOT}${path}`, { ...init, headers })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(typeof body.detail === 'string' ? body.detail : `Request failed (${response.status})`)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) })

export const api = {
  login: (pin: string) => request<{ access_token: string; user: User }>('/api/auth/login', json('POST', { pin })),
  me: () => request<User>('/api/auth/me'),
  modules: () => request<{ modules: ModuleState[] }>('/api/modules'),
  menu: () => request<Menu>('/api/menu'),
  tables: () => request<Table[]>('/api/tables'),
  sections: () => request<{ sections: { name: string; color: string }[] }>('/api/table-sections'),
  orders: (query = '') => request<Order[]>(`/api/orders${query}`),
  order: (id: number) => request<Order>(`/api/orders/${id}`),
  checkout: (body: unknown) => request<Order>('/api/orders/checkout', json('POST', body)),
  openBill: (body: unknown) => request<Order>('/api/orders/open-bill', json('POST', body)),
  appendItems: (id: number, body: unknown) => request<Order>(`/api/orders/${id}/items`, json('POST', body)),
  updateOrder: (id: number, body: unknown) => request<Order>(`/api/orders/${id}`, json('PATCH', body)),
  acceptOrder: (id: number) => request<Order>(`/api/orders/${id}/accept`, json('POST', {})),
  closeOrder: (id: number, body: unknown) => request<Order>(`/api/orders/${id}/close`, json('POST', body)),
  cancelOrder: (id: number, body: unknown) => request<Order>(`/api/orders/${id}/cancel`, json('POST', body)),
  voidOrder: (id: number, body: unknown) => request<Order>(`/api/orders/${id}/void`, json('POST', body)),
  printTicket: (id: number) => request<Record<string, unknown>>(`/api/orders/${id}/print-ticket`, json('POST', {})),
  printReceipt: (id: number) => request<Record<string, unknown>>(`/api/orders/${id}/print-receipt`, json('POST', {})),
  payments: (id: number) => request<Payment[]>(`/api/payments/order/${id}`),
  initiatePayment: (body: unknown) => request<Payment>('/api/payments/initiate', json('POST', body)),
  confirmPayment: (body: unknown) => request<Payment>('/api/payments/confirm', json('POST', body)),
  stats: () => request<{ today_orders: number; today_revenue: number; open_tickets: number; avg_ticket: number }>('/api/orders/_stats/today'),
  settings: () => request<Settings>('/api/admin/settings'),
  updateSettings: (path: string, body: unknown, method = 'PUT') => request<Settings>(`/api/admin/settings${path}`, json(method, body)),
  printer: () => request<PrinterSettings>('/api/admin/settings/printer'),
  updatePrinter: (body: unknown) => request<PrinterSettings>('/api/admin/settings/printer', json('PUT', body)),
  testPrinter: () => request<unknown>('/api/admin/settings/printer/test', json('POST', {})),
  taxes: () => request<Tax[]>('/api/admin/settings/tax'),
  updateTaxes: (body: unknown) => request<Tax[]>('/api/admin/settings/tax', json('PUT', body)),
  discount: () => request<DiscountPolicy>('/api/admin/settings/discount'),
  updateDiscount: (body: unknown) => request<DiscountPolicy>('/api/admin/settings/discount', json('PUT', body)),
  posOps: () => request<PosOpsSettings>('/api/admin/settings/pos-ops'),
  updatePosOps: (body: Partial<PosOpsSettings>) => request<PosOpsSettings>('/api/admin/settings/pos-ops', json('PUT', body)),
  stock: () => request<unknown[]>('/api/admin/inventory'),
  updateStock: (id: number, body: unknown) => request<unknown>(`/api/admin/inventory/products/${id}`, json('PUT', body)),
  vouchers: () => request<unknown[]>('/api/vouchers'),
  validateVoucher: (body: unknown) => request<unknown>('/api/vouchers/validate', json('POST', body)),
  resource: <T>(path: string) => request<T>(path),
  mutate: <T>(path: string, method: string, body?: unknown) => request<T>(path, body === undefined ? { method } : json(method, body)),
}
