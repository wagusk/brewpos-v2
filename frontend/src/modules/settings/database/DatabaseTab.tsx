/**
 * DatabaseTab — connection URL + reload + reset.
 */

import { Box, Typography, TextField, Button, Paper, Alert, Divider } from '@mui/material';
import { Save, Refresh } from '@mui/icons-material';
import { api } from '../../../core/api';

interface Props {
  settings: any;
  setSettings: (s: any) => void;
  setSuccess: (s: string | null) => void;
  setError: (e: string | null) => void;
}

export default function DatabaseTab({ settings, setSettings, setSuccess, setError }: Props) {
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
    <Paper sx={{ p: 3, maxWidth: 600 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Database</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Alert severity="warning">
          Changing the database URL will reload the connection. Make sure the new database is accessible.
      </Alert>
        <TextField
          label="Database URL"
          value={settings.database_url || ''}
          onChange={(e) => setSettings({ ...settings, database_url: e.target.value })}
          size="small"
          fullWidth
       />
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="contained" startIcon={<Save />} onClick={saveUrl} sx={{ minHeight: 48, fontWeight: 700, backgroundImage: 'none', boxShadow: 'none', '&:hover': { backgroundImage: 'none' } }}>
            Save URL
          </Button>
          <Button variant="outlined" startIcon={<Refresh />} onClick={reload} sx={{ minHeight: 48, fontWeight: 600 }}>
            Reload
          </Button>
        </Box>
        <Divider />
        <Button variant="outlined" color="error" onClick={reset} sx={{ minHeight: 48, fontWeight: 600 }}>
          Reset Database
        </Button>
   </Box>
 </Paper>
  );
}
