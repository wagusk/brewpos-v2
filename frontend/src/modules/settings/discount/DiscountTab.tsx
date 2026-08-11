/**
 * DiscountTab — discount policy + presets.
 */

import { Box, Typography, TextField, Button, Paper, FormControlLabel, Switch, Stack, IconButton } from '@mui/material';
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
      setSuccess('Discount policy saved');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 600 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Discount Policy</Typography>
      <Stack spacing={2.5}>
        <TextField
          label="Max Discount (0-1)"
          type="number"
          inputProps={{ step: 0.05, min: 0, max: 1 }}
          value={discountSettings.max_discount_pct || 0.5}
          onChange={(e) => setDiscountSettings({ ...discountSettings, max_discount_pct: parseFloat(e.target.value) || 0 })}
          fullWidth
        />
        <FormControlLabel
          control={
            <Switch
              checked={discountSettings.require_reason || false}
              onChange={(e) => setDiscountSettings({ ...discountSettings, require_reason: e.target.checked })}
            />
          }
          label="Require reason for discount"
        />
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Presets</Typography>
          {(discountSettings.presets || []).map((preset: any, i: number) => (
            <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1.5, alignItems: 'center' }}>
              <TextField
                label="Label"
                value={preset.label}
                onChange={(e) => updatePreset(i, 'label', e.target.value)}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Mode"
                select
                SelectProps={{ native: true }}
                value={preset.mode}
                onChange={(e) => updatePreset(i, 'mode', e.target.value)}
                sx={{ width: 100 }}
              >
                <option value="amount">$</option>
                <option value="percent">%</option>
              </TextField>
              <TextField
                label="Value"
                type="number"
                value={preset.value}
                onChange={(e) => updatePreset(i, 'value', parseFloat(e.target.value) || 0)}
                sx={{ width: 80 }}
              />
              <IconButton onClick={() => removePreset(i)} sx={{ width: 48, height: 48 }}>
                <Delete fontSize="medium" />
              </IconButton>
            </Box>
          ))}
          <Button startIcon={<Add />} onClick={addPreset} sx={{ fontWeight: 600 }}>
            Add Preset
          </Button>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button variant="contained" startIcon={<Save />} onClick={save} disabled={loading} sx={{ minHeight: 48, fontWeight: 700, backgroundImage: 'none', boxShadow: 'none', '&:hover': { backgroundImage: 'none' } }}>
            Save
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
