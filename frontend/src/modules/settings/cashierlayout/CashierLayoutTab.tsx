/**
 * CashierLayoutTab — live-adjustable cashier page dimensions.
 * Slider values are read/written through useCashierLayout (localStorage).
 */

import { RestartAlt } from '@mui/icons-material';
import { useTheme } from '../../../core/theme/monoTheme';
import { useCashierLayout, CASHIER_LAYOUT_DEFAULTS } from '../../cashier/layoutConfig';
import LayoutSlider from './LayoutSlider';
import POSCard from '../../../components/POSCard';
import POSButton from '../../../components/POSButton';
import POSIcon from '../../../components/POSIcon';

export default function CashierLayoutTab() {
  const c = useTheme();
  const { config, setLayout, reset } = useCashierLayout();

  return (
    <POSCard variant="outlined" padding="lg" style={{ maxWidth: 600 }}>
      {/* Header row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: c.ui.cardGap,
      }}>
        <h2 style={{
          fontSize: c.fontSize('h6'), fontWeight: 600,
          color: c.text, margin: 0,
        }}>
          Cashier Layout
        </h2>
        <POSButton
          variant="outline"
          size="sm"
          icon={<POSIcon icon={<RestartAlt />} size="sm" variant="default" />}
          iconPosition="left"
          onClick={reset}
        >
          Reset to defaults
        </POSButton>
      </div>

      {/* Description */}
      <p style={{
        fontSize: c.fontSize('body2'), color: c.subtext,
        margin: `0 0 ${c.ui.cardGap}px 0`,
      }}>
        Changes apply live to the cashier page. Values are stored in your browser.
      </p>

      {/* Sliders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: c.ui.cardGap }}>
        <LayoutSlider
          label="Bill column width (left)"
          unit="px"
          value={config.floorLeftWidth}
          min={240}
          max={800}
          step={10}
          onChange={(v) => setLayout({ floorLeftWidth: v })}
        />
        <LayoutSlider
          label="Table tile min width"
          unit="px"
          value={config.floorTileMin}
          min={80}
          max={240}
          step={10}
          onChange={(v) => setLayout({ floorTileMin: v })}
        />
        <LayoutSlider
          label="Table tile height"
          unit="px"
          value={config.floorTileHeight}
          min={80}
          max={180}
          step={4}
          onChange={(v) => setLayout({ floorTileHeight: v })}
        />
        <LayoutSlider
          label="Tile gap"
          unit="px"
          value={config.floorGap}
          min={4}
          max={24}
          step={2}
          onChange={(v) => setLayout({ floorGap: v })}
        />
        <LayoutSlider
          label="Header strip height"
          unit="px"
          value={config.headerHeight}
          min={48}
          max={96}
          step={4}
          onChange={(v) => setLayout({ headerHeight: v })}
        />
      </div>

      {/* Defaults display */}
      <POSCard
        variant="outlined"
        padding="md"
        style={{
          marginTop: c.ui.cardGap,
        }}
      >
        <span style={{
          fontSize: c.fontSize('caption'), color: c.subtext,
          display: 'block', marginBottom: 4,
        }}>
          Defaults
        </span>
        <span style={{
          fontSize: c.fontSize('caption'), color: c.text,
          fontFamily: 'monospace',
        }}>
          {JSON.stringify(CASHIER_LAYOUT_DEFAULTS, null, 0)}
        </span>
      </POSCard>
    </POSCard>
  );
}
