/**
 * LayoutSlider — shared slider primitive used by Settings tabs.
 * Theme-driven. No hardcoded values.
 */

import { useTheme } from '../../../core/theme/monoTheme';
import POSButton from '../../../components/POSButton';

interface Props {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

export default function LayoutSlider({ label, unit, value, min, max, step, onChange }: Props) {
  const c = useTheme();
  const progress = ((value - min) / (max - min)) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Label + value row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: c.fontSize('body2'), color: c.text,
          fontWeight: 600,
        }}>
          {label}
        </span>
        <span style={{
          fontSize: c.fontSize('body2'), color: c.subtext,
          fontFamily: 'monospace',
        }}>
          {value}{unit}
        </span>
      </div>

      {/* Slider row: decrement button + track + increment button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: c.ui.spacingBase }}>
        <POSButton
          variant="outline"
          size="sm"
          onClick={() => onChange(Math.max(min, value - step))}
          style={{ minWidth: 36, padding: '0 8px' }}
        >
          −
        </POSButton>

        {/* Track */}
        <div style={{
          flex: 1, height: 6,
          backgroundColor: c.input,
          borderRadius: c.ui.cardRadius,
          border: `1px solid ${c.inputBorder}`,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Filled portion */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${progress}%`,
            backgroundColor: c.button,
            borderRadius: c.ui.cardRadius,
          }} />
        </div>

        <POSButton
          variant="outline"
          size="sm"
          onClick={() => onChange(Math.min(max, value + step))}
          style={{ minWidth: 36, padding: '0 8px' }}
        >
          +
        </POSButton>
      </div>
    </div>
  );
}
