/**
 * TaxTab — manage tax rates.
 * Uses POSCard, POSButton, POSTextField.
 */

import { useTheme } from '../../../core/theme/monoTheme';
import { POSCard, POSButton, POSTextField } from '../../../components';
import { Save, Add, Delete } from '@mui/icons-material';
import { api } from '../../../core/api';

interface Props {
  settings: any;
  setSettings: (s: any) => void;
  loading: boolean;
  setLoading: (l: boolean) => void;
  setSuccess: (s: string | null) => void;
  setError: (e: string | null) => void;
}

export default function TaxTab({ settings, setSettings, loading, setLoading, setSuccess, setError }: Props) {
  const c = useTheme();
  const save = async () => {
    setLoading(true);
    try {
      await api.updateTax({ taxes: settings.taxes });
      setSuccess('Tax settings saved');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <POSCard variant="default" padding="lg" style={{ maxWidth: 600 }}>
      <span style={{ fontSize: c.fontSize('h5'), fontWeight: 700, color: c.text, display: 'block', marginBottom: `${c.ui.cardGap}px` }}>
        Tax Configuration
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: `${c.ui.spacingBase}px` }}>
        {(settings.taxes || []).map((tax: any, i: number) => (
          <div key={i} style={{ display: 'flex', gap: `${c.ui.spacingBase}px`, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <POSTextField
                label="Tax Name"
                value={tax.name}
                onChange={(v: string) => {
                  const taxes = [...settings.taxes];
                  taxes[i] = { ...tax, name: v };
                  setSettings({ ...settings, taxes });
                }}
                size="sm"
              />
            </div>
            <div style={{ width: 120 }}>
              <POSTextField
                label="Rate (0-1)"
                value={String(tax.rate)}
                onChange={(v: string) => {
                  const taxes = [...settings.taxes];
                  taxes[i] = { ...tax, rate: parseFloat(v) || 0 };
                  setSettings({ ...settings, taxes });
                }}
                size="sm"
              />
            </div>
            <POSButton
              variant="ghost"
              size="sm"
              icon={<Delete />}
              onClick={() => {
                const taxes = settings.taxes.filter((_: any, j: number) => j !== i);
                setSettings({ ...settings, taxes });
              }}
            />
          </div>
        ))}
        <POSButton
          variant="outline"
          size="md"
          icon={<Add />}
          onClick={() => setSettings({ ...settings, taxes: [...(settings.taxes || []), { name: 'Tax', rate: 0.1 }] })}
          style={{ alignSelf: 'flex-start' }}
        >
          Add Tax
        </POSButton>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: `${c.ui.cardGap}px` }}>
          <span style={{ fontSize: c.fontSize('body2'), color: c.subtext }}>
            Total rate: {((settings.taxes || []).reduce((s: number, t: any) => s + t.rate, 0) * 100).toFixed(1)}%
          </span>
          <POSButton variant="primary" size="md" icon={<Save />} loading={loading} onClick={save}>
            Save
          </POSButton>
        </div>
      </div>
    </POSCard>
  );
}
