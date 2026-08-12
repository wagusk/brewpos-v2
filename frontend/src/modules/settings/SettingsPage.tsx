/**
 * SettingsPage — 3-Column adjustable settings workspace:
 * [Main Menu] | [Submenu / Config Sections] | [Details & Configuration Panel]
 * All data-driven and fully adjustable via width controls.
 */

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../core/theme/monoTheme';
import { POSCard, POSButton, POSIcon } from '../../components';
import { api } from '../../core/api';
import TaxTab from './tax/TaxTab';
import PrinterTab from './printer/PrinterTab';
import DiscountTab from './discount/DiscountTab';
import CashierLayoutTab from './cashierlayout/CashierLayoutTab';
import DatabaseTab from './database/DatabaseTab';
import { useNotifications, Toasts } from '../../shared/notifications';
import {
  Receipt as TaxIcon,
  Print as PrinterIcon,
  Percent as DiscountIcon,
  PointOfSale as CashierIcon,
  Storage as DatabaseIcon,
  Settings as UiIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';

type SettingsSection = 'tax' | 'printer' | 'discount' | 'cashier' | 'database' | 'ui';

interface SectionConfig {
  key: SettingsSection;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const SECTIONS: SectionConfig[] = [
  { key: 'tax', label: 'Tax Configuration', icon: <TaxIcon />, description: 'Multi-tax rates, service charges, and tax policies.' },
  { key: 'printer', label: 'Printer Setup', icon: <PrinterIcon />, description: 'POS receipt printer mode, IP/USB configuration, and test prints.' },
  { key: 'discount', label: 'Discount Policy', icon: <DiscountIcon />, description: 'Preset discounts, max discount percentages, and reason requirements.' },
  { key: 'cashier', label: 'Cashier Layout', icon: <CashierIcon />, description: 'Customizable floor plan, tile sizes, and grid column dimensions.' },
  { key: 'database', label: 'Database Settings', icon: <DatabaseIcon />, description: 'SQLite / PostgreSQL connection string and DB migration tools.' },
  { key: 'ui', label: 'UI Appearance', icon: <UiIcon />, description: 'Light theme palette tokens and global UI scale.' },
];

export default function SettingsPage() {
  const c = useTheme();
  const notify = useNotifications();

  const [activeSection, setActiveSection] = useState<SettingsSection>('tax');
  const [settings, setSettings] = useState<any>({});
  const [printerSettings, setPrinterSettings] = useState<any>({});
  const [discountSettings, setDiscountSettings] = useState<any>({});
  const [loading, setLoading] = useState(false);

  // Adjustable column widths
  const [col1Width, setCol1Width] = useState<number>(240);
  const [col2Width, setCol2Width] = useState<number>(280);

  const setSuccess = (msg: string | null) => { if (msg) notify.success(msg); };
  const setError = (msg: string | null) => { if (msg) notify.error(msg); };

  const loadData = useCallback(async () => {
    try {
      const [s, ps, ds] = await Promise.all([
        api.getSettings(),
        api.getPrinterSettings(),
        api.getDiscountSettings(),
      ]);
      setSettings(s || {});
      setPrinterSettings(ps || {});
      setDiscountSettings(ds || {});
    } catch (e: any) {
      notify.error(e?.message || 'Failed to load settings');
    }
  }, [notify]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        backgroundColor: c.page,
        overflow: 'hidden',
      }}
    >
      {/* ── Column 1: Main Menu ────────────────────────────── */}
      <div
        style={{
          width: `${col1Width}px`,
          minWidth: 200,
          maxWidth: 380,
          backgroundColor: c.card,
          borderRight: `1px solid ${c.cardBorder}`,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: `${c.ui.cardPadding}px`, borderBottom: `1px solid ${c.cardBorder}` }}>
          <span style={{ fontWeight: 800, fontSize: c.fontSize('h6'), color: c.text }}>
            Settings Menu
          </span>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: `${c.ui.spacingBase}px`, display: 'flex', flexDirection: 'column', gap: `${c.ui.spacingBase}px` }}>
          {SECTIONS.map((sec) => {
            const isActive = activeSection === sec.key;
            return (
              <POSCard
                key={sec.key}
                variant="default"
                clickable
                selected={isActive}
                onClick={() => setActiveSection(sec.key)}
                padding="md"
                style={{
                  backgroundColor: isActive ? c.button : c.input,
                  border: `1px solid ${isActive ? c.button : c.cardBorder}`,
                  color: isActive ? c.buttonText : c.text,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: `${c.ui.spacingBase}px` }}>
                    <POSIcon icon={sec.icon} size="md" color={isActive ? c.buttonText : c.subtext} />
                    <span style={{ fontWeight: 700, fontSize: c.fontSize('body1') }}>
                      {sec.label}
                    </span>
                  </div>
                  <ChevronRightIcon sx={{ fontSize: 18, color: isActive ? c.buttonText : c.muted }} />
                </div>
              </POSCard>
            );
          })}
        </div>

        {/* Column width readjust control */}
        <div style={{ padding: `${c.ui.spacingBase}px`, borderTop: `1px solid ${c.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: c.fontSize('caption'), color: c.subtext }}>Col 1 Width</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <POSButton variant="outline" size="sm" onClick={() => setCol1Width(Math.max(180, col1Width - 20))}>−</POSButton>
            <POSButton variant="outline" size="sm" onClick={() => setCol1Width(Math.min(320, col1Width + 20))}>+</POSButton>
          </div>
        </div>
      </div>

      {/* ── Column 2: Submenu / Overview List ──────────────── */}
      <div
        style={{
          width: `${col2Width}px`,
          minWidth: 220,
          maxWidth: 420,
          backgroundColor: c.card,
          borderRight: `1px solid ${c.cardBorder}`,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: `${c.ui.cardPadding}px`, borderBottom: `1px solid ${c.cardBorder}` }}>
          <span style={{ fontWeight: 800, fontSize: c.fontSize('h6'), color: c.text, textTransform: 'capitalize' }}>
            {activeSection} Options
          </span>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: `${c.ui.spacingBase}px` }}>
          <POSCard variant="default" padding="md" style={{ backgroundColor: c.input, border: `1px solid ${c.cardBorder}` }}>
            <span style={{ fontWeight: 700, fontSize: c.fontSize('body2'), color: c.text, display: 'block', marginBottom: 4 }}>
              About {activeSection.toUpperCase()}
            </span>
            <span style={{ fontSize: c.fontSize('caption'), color: c.subtext, lineHeight: 1.4, display: 'block' }}>
              {SECTIONS.find((s) => s.key === activeSection)?.description}
            </span>
          </POSCard>
        </div>

        {/* Column width readjust control */}
        <div style={{ padding: `${c.ui.spacingBase}px`, borderTop: `1px solid ${c.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: c.fontSize('caption'), color: c.subtext }}>Col 2 Width</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <POSButton variant="outline" size="sm" onClick={() => setCol2Width(Math.max(180, col2Width - 20))}>−</POSButton>
            <POSButton variant="outline" size="sm" onClick={() => setCol2Width(Math.min(360, col2Width + 20))}>+</POSButton>
          </div>
        </div>
      </div>

      {/* ── Column 3: Details & Configuration Panel ────────── */}
      <div
        style={{
          flex: 1,
          backgroundColor: c.page,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: `${c.ui.cardPadding}px`,
        }}
      >
        <div style={{ marginBottom: `${c.ui.cardGap}px` }}>
          <span style={{ fontWeight: 800, fontSize: c.fontSize('h5'), color: c.text, textTransform: 'capitalize' }}>
            {activeSection} Configuration
          </span>
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          <POSCard variant="default" padding="lg" style={{ backgroundColor: c.card, maxWidth: 800 }}>
            {activeSection === 'tax' && (
              <TaxTab settings={settings} setSettings={setSettings} loading={loading} setLoading={setLoading} setSuccess={setSuccess} setError={setError} />
            )}
            {activeSection === 'printer' && (
              <PrinterTab printerSettings={printerSettings} setPrinterSettings={setPrinterSettings} loading={loading} setLoading={setLoading} setSuccess={setSuccess} setError={setError} />
            )}
            {activeSection === 'discount' && (
              <DiscountTab discountSettings={discountSettings} setDiscountSettings={setDiscountSettings} loading={loading} setLoading={setLoading} setSuccess={setSuccess} setError={setError} />
            )}
            {activeSection === 'cashier' && (
              <CashierLayoutTab />
            )}
            {activeSection === 'database' && (
              <DatabaseTab settings={settings} setSettings={setSettings} setSuccess={setSuccess} setError={setError} />
            )}
            {activeSection === 'ui' && (
              <div style={{ color: c.text, fontSize: c.fontSize('body1') }}>
                UI settings and theme tokens are fully managed through the application theme and UI layout configuration.
              </div>
            )}
          </POSCard>
        </div>
      </div>

      <Toasts controller={notify} />
    </div>
  );
}
