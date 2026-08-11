import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#f5c518' },
    success: { main: '#1f9d55' },
    error: { main: '#d8453c' },
  },
  shape: { borderRadius: 12 },
});
