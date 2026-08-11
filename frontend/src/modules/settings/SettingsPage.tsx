/**
 * SettingsPage — orchestrator with tab navigation.
 *
 * Each tab is a small standalone component under ./tabs/.
 * State for tax/printer/discount is hoisted here so any tab can
 * trigger a refresh; UI layout tokens live in their own tabs.
 */

import { useState, useEffect } from 'react';
import { Box, Typography, Alert, Snackbar, Tabs, Tab } from '@mui/material';
import { Receipt, Print, Percent, PointOfSale, Storage, Settings as SettingsIcon } from '@mui/icons-material';
import { api } from '../../core/api';
import TaxTab from './tax/TaxTab';
import PrinterTab from './printer/PrinterTab';
import DiscountTab from './discount/DiscountTab';
import CashierLayoutTab from './cashierlayout/CashierLayoutTab';
import DatabaseTab from './database/DatabaseTab';

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  if (value !== index) return null;
  return (
    <Box sx={{ pt: 2 }}>
      {children}
  </Box>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState(0);
  const [settings, setSettings] = useState<any>({});
  const [printerSettings, setPrinterSettings] = useState<any>({});
  const [discountSettings, setDiscountSettings] = useState<any>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [s, ps, ds] = await Promise.all([
          api.getSettings(),
          api.getPrinterSettings(),
          api.getDiscountSettings(),
        ]);
        setSettings(s);
        setPrinterSettings(ps);
        setDiscountSettings(ds);
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, []);

  return (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <SettingsIcon /> Settings
  </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab icon={<Receipt />} label="Tax" iconPosition="start" />
        <Tab icon={<Print />} label="Printer" iconPosition="start" />
        <Tab icon={<Percent />} label="Discount" iconPosition="start" />
        <Tab icon={<PointOfSale />} label="Cashier" iconPosition="start" />
        <Tab icon={<Storage />} label="Database" iconPosition="start" />
  </Tabs>

      <TabPanel value={tab} index={0}>
        <TaxTab
          settings={settings}
          setSettings={setSettings}
          loading={loading}
          setLoading={setLoading}
          setSuccess={setSuccess}
          setError={setError}
        />
  </TabPanel>

      <TabPanel value={tab} index={1}>
        <PrinterTab
          printerSettings={printerSettings}
          setPrinterSettings={setPrinterSettings}
          loading={loading}
          setLoading={setLoading}
          setSuccess={setSuccess}
          setError={setError}
        />
  </TabPanel>

      <TabPanel value={tab} index={2}>
        <DiscountTab
          discountSettings={discountSettings}
          setDiscountSettings={setDiscountSettings}
          loading={loading}
          setLoading={setLoading}
          setSuccess={setSuccess}
          setError={setError}
        />
  </TabPanel>

      <TabPanel value={tab} index={3}>
        <CashierLayoutTab />
  </TabPanel>

      <TabPanel value={tab} index={4}>
        <DatabaseTab
          settings={settings}
          setSettings={setSettings}
          setSuccess={setSuccess}
          setError={setError}
        />
  </TabPanel>

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
    </Alert>
   </Snackbar>
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess(null)}>
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
    </Alert>
   </Snackbar>
  </Box>
  );
}
