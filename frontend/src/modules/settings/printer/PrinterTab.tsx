/**
 * PrinterTab — printer mode + network config + test print.
 * Uses POSCard, POSButton, POSTextField.
 */

import { useTheme } from '../../../core/theme/monoTheme';
import { POSCard, POSButton, POSTextField, POSSelect } from '../../../components';
import { Save, Print } from '@mui/icons-material';
import { api } from '../../../core/api';

interface Props {
  printerSettings: any;
  setPrinterSettings: (s: any) => void;
  loading: boolean;
  setLoading: (l: boolean) => void;
  setSuccess: (s: string | null) => void;
  setError: (e: string | null) => void;
}

export default function PrinterTab({ printerSettings, setPrinterSettings, loading, setLoading, setSuccess, setError }: Props) {
  const c = useTheme();
  const save = async () => {
    setLoading(true);
    try {
      await api.updatePrinterSettings(printerSettings);
      setSuccess('Printer settings saved');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const test = async () => {
    setLoading(true);
    try {
      const result = await api.testPrinter();
      if (result.ok) setSuccess('Test print sent successfully');
      else setError('Print failed: ' + result.error);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const modeOptions = [
    { label: 'Dummy (Mock)', value: 'dummy' },
    { label: 'Network (ESC/POS IP)', value: 'network' },
    { label: 'USB / Serial', value: 'usb' },
  ];

  return (
    <POSCard variant="default" padding="lg" style={{ maxWidth: 600 }}>
      <span style={{ fontSize: c.fontSize('h5'), fontWeight: 700, color: c.text, display: 'block', marginBottom: `${c.ui.cardGap}px` }}>
        Printer Configuration
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: `${c.ui.spacingBase}px` }}>
        <POSSelect
          label="Mode"
          value={printerSettings.mode || 'dummy'}
          onChange={(v: string) => setPrinterSettings({ ...printerSettings, mode: v })}
          options={modeOptions}
          fullWidth
        />
        <POSTextField
          label="Host"
          value={printerSettings.host || ''}
          onChange={(v: string) => setPrinterSettings({ ...printerSettings, host: v })}
          fullWidth
        />
        <POSTextField
          label="Port"
          value={printerSettings.port || ''}
          onChange={(v: string) => setPrinterSettings({ ...printerSettings, port: v })}
          fullWidth
        />
        <div style={{ display: 'flex', gap: `${c.ui.spacingBase}px`, marginTop: `${c.ui.cardGap}px` }}>
          <POSButton variant="primary" size="md" icon={<Save />} loading={loading} onClick={save}>
            Save
          </POSButton>
          <POSButton variant="outline" size="md" icon={<Print />} loading={loading} onClick={test}>
            Test Print
          </POSButton>
        </div>
      </div>
    </POSCard>
  );
}
