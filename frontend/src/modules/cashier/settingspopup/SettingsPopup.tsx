/**
 * CashierSettingsPopup — gear icon + dialog with live sliders.
 *
 * Lets an admin/master adjust every layout dimension for the cashier
 * page (currently the floor plan). Writes through to localStorage;
 * the cashier page re-renders via useCashierLayout.
 *
 * Role gating: read the user role from localStorage 'brewpos_user'.
 * Only admin / master can see the gear. Other roles don't render it
 * at all — keeps the UI clean and matches "managed later" until a
 * full role_allowance system is built.
 */

import { useState } from 'react';
import { POSCard, POSButton, POSIcon } from '../../../components';
import { Settings as SettingsIcon, RestartAlt, OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../core/theme/monoTheme';
import { useCashierLayout, CASHIER_LAYOUT_DEFAULTS } from '../layoutConfig';

function getCurrentRole(): string | null {
  try {
    const raw = localStorage.getItem('brewpos_user');
    if (!raw) return null;
    const u = JSON.parse(raw);
    return u?.role ?? null;
  } catch {
    return null;
  }
}

interface SliderRowProps {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

function SliderRow({ label, unit, value, min, max, step, onChange }: SliderRowProps) {
  const c = useTheme();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${c.ui.spacingBase * 0.5}px` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: c.fontSize('body2'), color: c.text, fontWeight: 600 }}>
          {label}
        </span>
        <span style={{ fontSize: c.fontSize('body2'), color: c.subtext, fontFamily: 'monospace' }}>
          {value}{unit}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: `${c.ui.spacingBase}px` }}>
        <POSButton
          variant="outline"
          size="sm"
          onClick={() => onChange(Math.max(min, value - step))}
          style={{ minWidth: `${c.ui.minTouchTarget * 0.75}px`, padding: '0 8px' }}
        >
          −
        </POSButton>
        <div style={{ flex: 1, height: '6px', backgroundColor: c.input, borderRadius: `${c.ui.inputRadius}px`, border: `1px solid ${c.inputBorder}`, position: 'relative' }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${((value - min) / (max - min)) * 100}%`,
            backgroundColor: c.button, borderRadius: `${c.ui.inputRadius}px`,
          }} />
        </div>
        <POSButton
          variant="outline"
          size="sm"
          onClick={() => onChange(Math.min(max, value + step))}
          style={{ minWidth: `${c.ui.minTouchTarget * 0.75}px`, padding: '0 8px' }}
        >
          +
        </POSButton>
      </div>
    </div>
  );
}

export default function CashierSettingsPopup() {
  const c = useTheme();
  const { config, setLayout, reset } = useCashierLayout();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const role = getCurrentRole();
  const canEdit = role === 'admin' || role === 'master';

  if (!canEdit) return null;

  return (
    <>
      <div title="Cashier layout settings">
        <POSButton
          variant="ghost"
          size="sm"
          onClick={() => setOpen(true)}
          icon={<POSIcon icon={<SettingsIcon />} size="sm" variant="muted" />}
          style={{
            color: c.subtext,
            backgroundColor: c.card,
            border: `1px solid ${c.cardBorder}`,
            borderRadius: `${c.ui.inputRadius}px`,
          }}
        >
          {' '}
        </POSButton>
      </div>

      {open && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <POSCard
            variant="default"
            elevation="lg"
            padding="lg"
            style={{
              width: '100%',
              maxWidth: `${c.ui.cardMinHeight * 6}px`,
              maxHeight: '80vh',
              overflow: 'auto',
            }}
          >
            {/* Dialog Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: `${c.ui.cardGap}px` }}>
              <span style={{ fontSize: c.fontSize('h6'), fontWeight: 700, color: c.text }}>
                Cashier Layout Settings
              </span>
              <POSButton
                variant="outline"
                size="sm"
                onClick={reset}
                icon={<POSIcon icon={<RestartAlt />} size="sm" variant="muted" />}
                style={{
                  color: c.subtext,
                  backgroundColor: c.input,
                  border: `1px solid ${c.cardBorder}`,
                  borderRadius: `${c.ui.inputRadius}px`,
                  fontSize: c.fontSize('caption'),
                  minHeight: `${c.ui.minTouchTarget * 0.7}px`,
                }}
              >
                Reset defaults
              </POSButton>
            </div>

            {/* Dialog Content */}
            <POSCard
              variant="outlined"
              padding="md"
              style={{
                backgroundColor: c.input,
                border: `1px solid ${c.inputBorder}`,
                borderRadius: `${c.ui.inputRadius}px`,
                marginBottom: `${c.ui.cardGap * 1.5}px`,
              }}
            >
              <span style={{ fontSize: c.fontSize('caption'), color: c.subtext, display: 'block', marginBottom: `${c.ui.spacingBase * 0.5}px` }}>
                Defaults
              </span>
              <code style={{ fontSize: c.fontSize('caption'), color: c.text, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(CASHIER_LAYOUT_DEFAULTS)}
              </code>
            </POSCard>

            <div style={{ display: 'flex', flexDirection: 'column', gap: `${c.ui.cardGap * 1.5}px` }}>
              <SliderRow
                label="Bill column width (left)"
                unit="px"
                value={config.floorLeftWidth}
                min={240}
                max={800}
                step={10}
                onChange={(v) => setLayout({ floorLeftWidth: v })}
              />
              <SliderRow
                label="Table tile height"
                unit="px"
                value={config.floorTileHeight}
                min={80}
                max={180}
                step={4}
                onChange={(v) => setLayout({ floorTileHeight: v })}
              />
              <SliderRow
                label="Table tile min width"
                unit="px"
                value={config.floorTileMin}
                min={80}
                max={240}
                step={10}
                onChange={(v) => setLayout({ floorTileMin: v })}
              />
              <SliderRow
                label="Tile gap"
                unit="px"
                value={config.floorGap}
                min={4}
                max={24}
                step={2}
                onChange={(v) => setLayout({ floorGap: v })}
              />
              <SliderRow
                label="Header strip height"
                unit="px"
                value={config.headerHeight}
                min={48}
                max={96}
                step={4}
                onChange={(v) => setLayout({ headerHeight: v })}
              />
            </div>

            {/* Dialog Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: `${c.ui.spacingBase}px`, marginTop: `${c.ui.cardGap * 1.5}px` }}>
              <POSButton
                variant="outline"
                size="sm"
                onClick={() => { setOpen(false); nav('/settings/ui'); }}
                icon={<POSIcon icon={<OpenInNewIcon />} size="sm" variant="muted" />}
                style={{
                  color: c.subtext,
                  border: `1px solid ${c.cardBorder}`,
                  borderRadius: `${c.ui.buttonRadius}px`,
                  minHeight: `${c.ui.buttonMinHeight}px`,
                }}
              >
                More UI settings
              </POSButton>
              <POSButton
                variant="secondary"
                size="sm"
                onClick={() => setOpen(false)}
                style={{
                  color: c.text,
                  border: `1px solid ${c.cardBorder}`,
                  borderRadius: `${c.ui.buttonRadius}px`,
                  minHeight: `${c.ui.buttonMinHeight}px`,
                }}
              >
                Close
              </POSButton>
            </div>
          </POSCard>
        </div>
      )}
    </>
  );
}
