import type { User } from '../types'

// Mirror of backend app.core.permissions.can() so role defaults are honoured
// even when the persisted permissions array is empty (e.g. legacy users from
// before permissions were seeded, or a re-seed that didn't refresh them).
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [],          // role == admin short-circuits below
  master: [],         // role == master short-circuits below
  superuser: [],      // role == superuser short-circuits below
  cashier: ["dashboard.view", "menu.view", "pos.view",
            "order.open", "order.close", "order.cancel", "order.append"],
  waiter: ["dashboard.view", "menu.view", "pos.view",
           "order.open", "order.append"],
  kitchen: ["dashboard.view", "kitchen.view", "bar.view", "menu.view",
            "kitchen.serve", "bar.serve"],
  bar: ["dashboard.view", "kitchen.view", "bar.view", "menu.view",
        "kitchen.serve", "bar.serve"],
};

export const can = (user: User, permission: string) => {
  if (!user) return false;
  if (user.role === "admin" || user.role === "master" || user.role === "superuser") {
    return true;
  }
  if ((user.permissions ?? []).includes(permission)) return true;
  return (ROLE_PERMISSIONS[user.role] ?? []).includes(permission);
};
