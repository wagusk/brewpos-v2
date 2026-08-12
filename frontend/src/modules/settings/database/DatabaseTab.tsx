/**
 * DatabaseTab — connection URL + reload + reset.
 * Uses POSCard, POSButton, POSTextField.
 */

import { useTheme } from '../../../core/theme/monoTheme';
import { POSCard, POSButton, POSTextField } from '../../../components';
import { Save, Refresh } from '@mui/icons-material';
import { api } from '../../../core/api';

interface Props {
  settings: any;
  setSettings: (s: any) => void;
  setSuccess: (s: string | null) => void;
  setError: (e: string | null) => void;
}

export default function DatabaseTab({ settings, setSettings, setSuccess, setError }: Props) {
  const c = useTheme();
  const saveUrl = async () => {
    try {
      await api.updateDatabase({ database_url: settings.database_url });
      setSuccess('Database URL saved. Reload to connect.');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const reload = async () => {
    try {
      await api.reloadDatabase();
      setSuccess('Database reloaded');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const reset = async () => {
    if (!confirm('Reset all data? This cannot be undone.')) return;
    try {
      await api.resetDatabase();
      setSuccess('Database reset to defaults');
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <POSCard variant="default" padding="lg" style={{ maxWidth: 600 }}>
      <span style={{ fontSize: c.fontSize('h5'), fontWeight: 700, color: c.text, display: 'block', marginBottom: `${c.ui.cardGap}px` }}>
        Database Configuration
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: `${c.ui.spacingBase}px` }}>
        <POSTextField
          label="Database URL"
          value={settings.database_url || ''}
          onChange={(v: string) => setSettings({ ...settings, database_url: v })}
          fullWidth
        />
        <div style={{ display: 'flex', gap: `${c.ui.spacingBase}px`, marginTop: `${c.ui.cardGap}px` }}>
          <POSButton variant="primary" size="md" icon={<Save />} onClick={saveUrl}>
            Save URL
          </POSButton>
          <POSButton variant="outline" size="md" icon={<Refresh />} onClick={reload}>
            Reload
          </POSButton>
          <POSButton variant="danger" size="md" onClick={reset}>
            Reset DB
          </POSButton>
        </div>
      </div>
    </POSCard>
  );
}
