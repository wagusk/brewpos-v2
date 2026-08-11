/**
 * PrinterTab — printer mode + network config + test print.
 */

import { Box, Typography, TextField, Button, Paper, FormControlLabel, Switch, Stack } from '@mui/material';
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

  return (
    <Paper sx={{ p: 3, maxWidth: 600 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Printer Configuration</Typography>
      <Stack spacing={2}>
        <TextField
          label="Mode"
          select
          SelectProps={{ native: true }}
          value={printerSettings.mode || 'dummy'}
          onChange={(e) => setPrinterSettings({ ...printerSettings, mode: e.target.value })}
          size="small"
        >
          <option value="dummy">Dummy (no printer</option>
          <option value="network">Network (TCP</option>
          <option value="usb">USB</option>
      </TextField>

        {printerSettings.mode === 'network' && (
          <>
            <TextField
              label="Host"
              value={printerSettings.network?.host || ''}
              onChange={(e) => setPrinterSettings({
                ...printerSettings,
                network: { ...printerSettings.network, host: e.target.value },
              })}
              size="small"
            />
            <TextField
              label="Port"
              type="number"
              value={printerSettings.network?.port || 9100}
              onChange={(e) => setPrinterSettings({
                ...printerSettings,
                network: { ...printerSettings.network, port: parseInt(e.target.value) || 9100 },
              })}
              size="small"
            />
         </>
        )}

        <FormControlLabel
          control={
            <Switch
              checked={printerSettings.dry_run || false}
              onChange={(e) => setPrinterSettings({ ...printerSettings, dry_run: e.target.checked })}
            />
          }
          label="Dry run (log instead of print)"
       />

        <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
          <Button variant="contained" startIcon={<Save />} onClick={save} disabled={loading} sx={{ minHeight: 48, fontWeight: 700, backgroundImage: 'none', boxShadow: 'none', '&:hover': { backgroundImage: 'none' } }}>
            Save
          </Button>
          <Button variant="outlined" startIcon={<Print />} onClick={test} disabled={loading} sx={{ minHeight: 48, fontWeight: 600 }}>
            Test Print
          </Button>
        </Box>
    </Stack>
  </Paper>
  );
}
