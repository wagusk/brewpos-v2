/**
 * DiscountTab — discount policy + presets.
 * Uses POSCard, POSButton, POSTextField.
 */

import { useTheme } from '../../../core/theme/monoTheme';
import { POSCard, POSButton, POSTextField, POSSelect } from '../../../components';
import { Save, Add, Delete } from '@mui/icons-material';
import { api } from '../../../core/api';

interface Props {
  discountSettings: any;
  setDiscountSettings: (s: any) => void;
  loading: boolean;
  setLoading: (l: boolean) => void;
  setSuccess: (s: string | null) => void;
  setError: (e: string | null) => void;
}

export default function DiscountTab({ discountSettings, setDiscountSettings, loading, setLoading, setSuccess, setError }: Props) {
  const c = useTheme();

  const addPreset = () => {
    setDiscountSettings({
      ...discountSettings,
      presets: [...(discountSettings.presets || []), { label: '', mode: 'amount', value: 0 }],
    });
  };

  const updatePreset = (index: number, field: string, value: any) => {
    const presets = [...(discountSettings.presets || [])];
    presets[index] = { ...presets[index], [field]: value };
    setDiscountSettings({ ...discountSettings, presets });
  };

  const removePreset = (index: number) => {
    const presets = [...(discountSettings.presets || [])];
    presets.splice(index, 1);
    setDiscountSettings({ ...discountSettings, presets });
  };

  const save = async () => {
    setLoading(true);
    try {
      await api.updateDiscountSettings(discountSettings);
      setSuccess('Discount settings saved');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const requireReasonOptions = [
    { label: 'No', value: 'no' },
    { label: 'Yes', value: 'yes' },
  ];

  const presetModeOptions = [
    { label: 'Amount ($)', value: 'amount' },
    { label: 'Percent (%)', value: 'percent' },
  ];

  return (
    <POSCard variant="default" padding="lg" style={{ maxWidth: 600 }}>
      <span style={{ fontSize: c.fontSize('h5'), fontWeight: 700, color: c.text, display: 'block', marginBottom: `${c.ui.cardGap}px` }}>
        Discount Configuration
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: `${c.ui.spacingBase}px` }}>
        <POSTextField
          label="Max Discount %"
          value={discountSettings.max_discount_pct || ''}
          onChange={(v: string) => setDiscountSettings({ ...discountSettings, max_discount_pct: v })}
          fullWidth
        />
        <POSSelect
          label="Require Reason"
          value={discountSettings.require_reason ? 'yes' : 'no'}
          onChange={(v: string) => setDiscountSettings({ ...discountSettings, require_reason: v === 'yes' })}
          options={requireReasonOptions}
          fullWidth
        />

        <span style={{ fontSize: c.fontSize('body1'), fontWeight: 600, color: c.text, marginTop: `${c.ui.spacingBase}px` }}>
          Presets
        </span>
        {(discountSettings.presets || []).map((preset: any, i: number) => (
          <div key={i} style={{ display: 'flex', gap: `${c.ui.spacingBase}px`, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <POSTextField
                label="Label"
                value={preset.label}
                onChange={(v: string) => updatePreset(i, 'label', v)}
                size="sm"
              />
            </div>
            <div style={{ width: 140 }}>
              <POSSelect
                label="Mode"
                value={preset.mode}
                onChange={(v: string) => updatePreset(i, 'mode', v)}
                options={presetModeOptions}
                size="sm"
              />
            </div>
            <div style={{ width: 120 }}>
              <POSTextField
                label="Value"
                value={String(preset.value)}
                onChange={(v: string) => updatePreset(i, 'value', v)}
                size="sm"
              />
            </div>
            <POSButton variant="ghost" size="sm" icon={<Delete />} onClick={() => removePreset(i)} />
          </div>
        ))}
        <POSButton variant="outline" size="md" icon={<Add />} onClick={addPreset} style={{ alignSelf: 'flex-start' }}>
          Add Preset
        </POSButton>
        <div style={{ marginTop: `${c.ui.cardGap}px` }}>
          <POSButton variant="primary" size="md" icon={<Save />} loading={loading} onClick={save}>
            Save
          </POSButton>
        </div>
      </div>
    </POSCard>
  );
}
