/**
 * TaxTab — manage tax rates.
 */

import { Box, Typography, TextField, Button, Paper, Alert, Stack } from '@mui/material';
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
    <Paper sx={{ p: 3, maxWidth: 600 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Tax Configuration</Typography>
      <Stack spacing={2}>
        {(settings.taxes || []).map((tax: any, i: number) => (
          <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              label="Tax Name"
              value={tax.name}
              onChange={(e) => {
                const taxes = [...settings.taxes];
                taxes[i] = { ...tax, name: e.target.value };
                setSettings({ ...settings, taxes });
              }}
              size="small"
              sx={{ flex: 1 }}
            />
            <TextField
              label="Rate (0-1)"
              type="number"
              inputProps={{ step: 0.01, min: 0, max: 1 }}
              value={tax.rate}
              onChange={(e) => {
                const taxes = [...settings.taxes];
                taxes[i] = { ...tax, rate: parseFloat(e.target.value) || 0 };
                setSettings({ ...settings, taxes });
              }}
              size="small"
              sx={{ width: 120 }}
            />
            <Button
              size="small"
              color="error"
              onClick={() => {
                const taxes = settings.taxes.filter((_: any, j: number) => j !== i);
                setSettings({ ...settings, taxes });
              }}
            >
              <Delete fontSize="small" />
           </Button>
         </Box>
        ))}
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={() => setSettings({ ...settings, taxes: [...(settings.taxes || []), { name: 'Tax', rate: 0.1 }] })}
          sx={{ alignSelf: 'flex-start', minHeight: 48, fontWeight: 600 }}
        >
          Add Tax
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Total rate: {((settings.taxes || []).reduce((s: number, t: any) => s + t.rate, 0) * 100).toFixed(1)}%
          </Typography>
          <Button variant="contained" startIcon={<Save />} onClick={save} disabled={loading} sx={{ minHeight: 48, fontWeight: 700, backgroundImage: 'none', boxShadow: 'none', '&:hover': { backgroundImage: 'none' } }}>
            Save
          </Button>
        </Box>
     </Stack>
   </Paper>
  );
}
