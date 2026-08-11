/**
 * Module Registry - Central manifest for all Brew-POS v2 features.
 *
 * Each module self-registers its routes, permissions, and i18n keys.
 * Adding a feature = create folder + add entry here.
 */

export interface Module {
  key: string;
  path: string;
  permission?: string | null;
  icon?: string;
  labelKey: string;
  enabled: boolean;
}

export const MODULES: Module[] = [
  { key: 'login', path: '/login', permission: null, icon: 'Login', labelKey: 'auth.title', enabled: true },
  { key: 'pos', path: '/pos', permission: 'pos.view', icon: 'PointOfSale', labelKey: 'pos.title', enabled: true },
  { key: 'kitchen', path: '/kitchen', permission: 'kitchen.view', icon: 'SoupKitchen', labelKey: 'kitchen.title', enabled: true },
  { key: 'bar', path: '/bar', permission: 'bar.view', icon: 'LocalBar', labelKey: 'bar.title', enabled: true },
  { key: 'admin', path: '/admin', permission: 'admin.view', icon: 'AdminPanelSettings', labelKey: 'admin.title', enabled: true },
  { key: 'settings', path: '/settings', permission: 'settings.view', icon: 'Settings', labelKey: 'settings.title', enabled: true },
  { key: 'discount', path: '/admin/discount', permission: 'order.discount', icon: 'Percent', labelKey: 'discount.title', enabled: true },
  { key: 'void', path: '/admin/void', permission: 'order.void', icon: 'Cancel', labelKey: 'void.title', enabled: true },
  { key: 'ui', path: '/settings/ui', permission: 'settings.view', icon: 'Settings', labelKey: 'settings.uiTitle', enabled: true },
  { key: 'multilingual', path: '/settings/language', permission: 'settings.view', icon: 'Language', labelKey: 'multilingual.title', enabled: true },
];
