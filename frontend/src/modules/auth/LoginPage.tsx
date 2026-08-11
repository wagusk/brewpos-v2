import { useState } from 'react';
import { Box, Button, Typography, Paper, Alert } from '@mui/material';
import CoffeeIcon from '@mui/icons-material/Coffee';
import BackspaceIcon from '@mui/icons-material/Backspace';
import { useNavigate } from 'react-router-dom';
import { api } from '../../core/api';
import { useTheme } from '../../core/theme/monoTheme';

export default function LoginPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const c = useTheme();
  const nav = useNavigate();

  const tap = (n: string) => {
    setError(null);
    if (pin.length >= 6) return;
    setPin((p) => p + n);
  };

  const back = () => setPin((p) => p.slice(0, -1));

  const submit = async () => {
    if (pin.length < 3) return;
    setLoading(true);
    setError(null);
    try {
      const r = await api.login(pin);
      localStorage.setItem('brewpos_token', r.access_token);
      localStorage.setItem('brewpos_user', JSON.stringify(r.user));
      nav('/pos');
    } catch (e: any) {
      setError(e?.message || 'Login failed');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'enter'];

  return (
    <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: c.page, p: 2 }}>
      <Paper sx={{
        p: 4, width: '100%', maxWidth: 420,
        borderRadius: `${c.ui.cardRadius}px`,
        display: 'flex', flexDirection: 'column', alignItems: 'stretch',
        gap: 2.5, bgcolor: c.card, border: `1px solid ${c.cardBorder}`,
        boxShadow: c.ui.cardShadow,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 44, height: 44,
              borderRadius: `${c.ui.inputRadius}px`,
              bgcolor: c.button, color: c.buttonText,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CoffeeIcon sx={{ fontSize: `${c.ui.iconSize}rem` }} />
           </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, lineHeight: 1.1, color: c.text, fontSize: c.fontSize('h5') }}>Brew-POS v2</Typography>
              <Typography sx={{ color: c.subtext, fontSize: c.fontSize('caption') }}>Sign in to your terminal</Typography>
           </Box>
         </Box>
       </Box>

        <Box sx={{
          width: '100%', py: 2, textAlign: 'center',
          letterSpacing: 8, fontSize: '1.75rem', fontWeight: 700,
          minHeight: 64,
          borderRadius: `${c.ui.buttonRadius}px`,
          border: `1px solid ${c.inputBorder}`, bgcolor: c.input, color: c.inputText,
        }}>
          {pin ? '•'.repeat(pin.length) : '—'}
       </Box>

        {error && (
          <Alert severity="error" sx={{
            width: '100%',
            bgcolor: c.errorBg, border: `1px solid ${c.errorBorder}`, color: c.errorText,
            borderRadius: `${c.ui.inputRadius}px`,
          }}>
            {error}
         </Alert>
        )}

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, width: '100%' }}>
          {keys.map((k) => {
            if (k === 'clear') {
              return (
                <Button key={k} variant="outlined" onClick={() => setPin('')} sx={{
                  minHeight: c.ui.buttonMinHeight,
                  fontSize: c.fontSize('body1'), fontWeight: 700,
                  borderRadius: `${c.ui.buttonRadius}px`,
                  borderColor: c.buttonBorder, color: c.warning,
                  backgroundImage: 'none', boxShadow: 'none',
                  '&:hover': { borderColor: c.buttonHover, bgcolor: c.chip, backgroundImage: 'none' },
                }}>
                  Clear
               </Button>
              );
            }
            if (k === 'enter') {
              return (
                <Button key={k} variant="contained" onClick={submit} disabled={loading || pin.length < 3} sx={{
                  minHeight: c.ui.buttonMinHeight,
                  fontSize: c.fontSize('body1'), fontWeight: 700,
                  borderRadius: `${c.ui.buttonRadius}px`,
                  bgcolor: c.button, color: c.buttonText,
                  boxShadow: 'none', backgroundImage: 'none',
                  '&:hover': { bgcolor: c.buttonHover, backgroundImage: 'none', boxShadow: 'none' },
                  '&.Mui-disabled': { bgcolor: c.chip, color: c.muted, backgroundImage: 'none' },
                  '&:active': { boxShadow: 'none' },
                }}>
                  Enter
               </Button>
              );
            }
            return (
              <Button key={k} variant="outlined" onClick={() => tap(k)} sx={{
                minHeight: c.ui.buttonMinHeight,
                fontSize: c.fontSize('h5'), fontWeight: 700,
                borderRadius: `${c.ui.buttonRadius}px`,
                bgcolor: c.input, borderColor: c.inputBorder, color: c.inputText,
                backgroundImage: 'none',
                '&:hover': { bgcolor: c.chip, borderColor: c.buttonBorder, backgroundImage: 'none' },
              }}>
                {k}
             </Button>
            );
          })}
       </Box>

        <Button startIcon={<BackspaceIcon />} onClick={back} sx={{
          minHeight: 40,
          color: c.subtext, alignSelf: 'center',
          fontSize: c.fontSize('body2'),
          '&:hover': { color: c.text, backgroundImage: 'none' },
        }}>
          Backspace
       </Button>

        <Typography sx={{ textAlign: 'center', color: c.muted, fontSize: c.fontSize('caption') }}>
          Demo: admin 9999 · cashier 1111 · waiter 2222 · kitchen 3333
       </Typography>
     </Paper>
   </Box>
  );
}
