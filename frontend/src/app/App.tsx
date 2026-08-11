import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Shell from '../components/Shell';
import LoginPage from '../modules/auth/LoginPage';
import POSPage from '../modules/pos/POSPage';
import KitchenPage from '../modules/kitchen/KitchenPage';
import BarPage from '../modules/bar/BarPage';
import AdminPage from '../modules/admin/AdminPage';
import SettingsPage from '../modules/settings/SettingsPage';
import UISettingsPage from '../modules/settings/UISettingsPage';
import DiscountPage from '../modules/discount/DiscountPage';
import VoidPage from '../modules/void/VoidPage';
import LanguagePage from '../modules/multilingual/LanguagePage';
import { t } from '../modules/multilingual/i18n';

const TITLES: Record<string, string> = {
  '/pos': t('pos.title'),
  '/kitchen': t('kitchen.title'),
  '/bar': t('bar.title'),
  '/admin': t('admin.title'),
  '/settings': t('settings.title'),
};

function getTitle(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.startsWith('/admin/discount')) return t('discount.title');
  if (pathname.startsWith('/admin/void')) return t('void.title');
  if (pathname.startsWith('/settings/ui')) return t('settings.uiTitle');
  if (pathname.startsWith('/settings/language')) return t('multilingual.title');
  return 'Brew-POS v2';
}

export const App = () => {
  const location = useLocation();
  const title = getTitle(location.pathname);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="*"
        element={
          <Shell title={title}>
            <Routes>
              {/* Core operations */}
              <Route path="/pos" element={<POSPage />} />
              <Route path="/kitchen" element={<KitchenPage />} />
              <Route path="/bar" element={<BarPage />} />
              {/* Admin */}
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/discount" element={<DiscountPage />} />
              <Route path="/admin/void" element={<VoidPage />} />
              {/* Settings */}
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/settings/ui" element={<UISettingsPage />} />
              <Route path="/settings/language" element={<LanguagePage />} />
              {/* Fallback */}
              <Route path="/" element={<Navigate to="/pos" replace />} />
           </Routes>
         </Shell>
        }
      />
   </Routes>
  );
};
