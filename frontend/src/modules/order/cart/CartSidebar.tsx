/**
 * CartSidebar — cart panel for the waiter page.
 * Shows cart items, table selector, total, and action buttons.
 */

import { useState } from 'react';
import {
  Box, Typography, Paper, List, ListItem, ListItemText,
  IconButton, Chip, Button, Alert, Snackbar,
} from '@mui/material';
import {
  Add, Remove, Send, TableRestaurant, LocalDining, Restaurant,
} from '@mui/icons-material';
import { useTheme } from '../../../core/theme/monoTheme';
import { api } from '../../../core/api';

interface CartItem {
  product_id: number;
  name: string;
  price: number;
  qty: number;
  modifiers: number[];
}

interface Table {
  id: number;
  name: string;
}

interface Props {
  cart: CartItem[];
  tables: Table[];
  selectedTable: number | null;
  onUpdateQty: (productId: number, delta: number) => void;
  onSelectTable: (id: number | null) => void;
  onClearCart: () => void;
}

export default function CartSidebar({ cart, tables, selectedTable, onUpdateQty, onSelectTable, onClearCart }: Props) {
  const c = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  const handleSendToKitchen = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      await api.checkout({
        table_id: selectedTable,
        type: selectedTable ? 'dine_in' : 'takeaway',
        items: cart,
      });
      onClearCart();
      setSuccess('Order sent to kitchen');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBill = async () => {
    if (!selectedTable) {
      setError('Please select a table first');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.openBill({ table_id: selectedTable, type: 'dine_in' });
      setSuccess('Bill opened on ' + (tables.find(t => t.id === selectedTable)?.name || ''));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const primaryBtnSx = {
    bgcolor: c.button, color: c.buttonText,
    minHeight: c.ui.buttonMinHeight,
    borderRadius: c.ui.buttonRadius + 'px',
    fontWeight: 600,
    backgroundImage: 'none', boxShadow: 'none',
    '&:hover': { bgcolor: c.buttonHover, backgroundImage: 'none', boxShadow: 'none' },
    '&.Mui-disabled': { bgcolor: c.chip, color: c.muted },
  } as const;

  return (
    <Paper sx={{
      width: 380,
      display: 'flex', flexDirection: 'column',
      borderRadius: 0,
      bgcolor: c.card,
      borderLeft: '1px solid ' + c.divider,
    }}>
      <Box sx={{ p: 2, borderBottom: '1px solid ' + c.divider }}>
        <Typography sx={{ fontWeight: 700, fontSize: c.fontSize('h6'), color: c.text }}>{'Cart' + (cartCount > 0 ? ' (' + cartCount + ')' : '')}</Typography>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
        {cart.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: c.subtext }}>
            <Restaurant sx={{ fontSize: c.ui.iconSize * 2 + 'rem', mb: 1, opacity: 0.4 }} />
            <Typography sx={{ fontSize: c.fontSize('body2') }}>Tap items to add</Typography>
          </Box>
        ) : (
          <List dense sx={{ py: 0 }}>
            {cart.map(item => (
              <ListItem key={item.product_id} sx={{ px: 1, py: 0.75, gap: 1 }}>
                <ListItemText
                  primary={item.name}
                  secondary={'$' + (item.price * item.qty).toFixed(2)}
                  primaryTypographyProps={{ fontSize: c.fontSize('body1'), fontWeight: 600, color: c.text }}
                  secondaryTypographyProps={{ fontSize: c.fontSize('body2'), color: c.subtext }}
                  sx={{ flex: 1 }}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <IconButton onClick={() => onUpdateQty(item.product_id, -1)} sx={{ color: c.text, width: 48, height: 48, bgcolor: c.input, border: '1px solid ' + c.inputBorder, borderRadius: c.ui.inputRadius + 'px', '&:hover': { bgcolor: c.cardHover } }}><Remove fontSize="medium" /></IconButton>
                  <Typography sx={{ fontWeight: 700, minWidth: 28, textAlign: 'center', fontSize: c.fontSize('body1'), color: c.text }}>{item.qty}</Typography>
                  <IconButton onClick={() => onUpdateQty(item.product_id, 1)} sx={{ color: c.text, width: 48, height: 48, bgcolor: c.input, border: '1px solid ' + c.inputBorder, borderRadius: c.ui.inputRadius + 'px', '&:hover': { bgcolor: c.cardHover } }}><Add fontSize="medium" /></IconButton>
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid ' + c.divider }}>
        <Typography sx={{ display: 'block', mb: 1, fontSize: c.fontSize('body2'), color: c.subtext, fontWeight: 600 }}>Table</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip label="Takeaway" onClick={() => onSelectTable(null)} color={selectedTable === null ? 'primary' : 'default'} icon={<LocalDining fontSize="small" />} sx={{ fontSize: c.fontSize('body2'), height: 36, fontWeight: 600 }} />
          {tables.map(t => (
            <Chip key={t.id} label={t.name} onClick={() => onSelectTable(t.id)} color={selectedTable === t.id ? 'primary' : 'default'} icon={<TableRestaurant fontSize="small" />} sx={{ fontSize: c.fontSize('body2'), height: 36, fontWeight: 600 }} />
          ))}
        </Box>
      </Box>

      <Box sx={{ p: 2, borderTop: '1px solid ' + c.divider, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {cart.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: c.fontSize('subtitle1'), color: c.text }}>Total</Typography>
            <Typography sx={{ fontWeight: 700, fontSize: c.fontSize('h6'), color: c.text }}>{'$' + cartTotal.toFixed(2)}</Typography>
          </Box>
        )}
        <Button fullWidth variant="contained" startIcon={<Send />} onClick={handleSendToKitchen} disabled={loading || cart.length === 0} sx={primaryBtnSx}>Send to Kitchen</Button>
        <Button fullWidth variant="outlined" onClick={handleOpenBill} disabled={loading || !selectedTable} sx={{
          minHeight: c.ui.buttonMinHeight,
          borderRadius: c.ui.buttonRadius + 'px',
          color: c.text, borderColor: c.buttonBorder, bgcolor: c.card,
          backgroundImage: 'none', boxShadow: 'none',
          '&:hover': { bgcolor: c.cardHover, borderColor: c.button, backgroundImage: 'none' },
          '&.Mui-disabled': { color: c.muted, borderColor: c.divider },
        }}>Open Empty Bill</Button>
      </Box>

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)} sx={{ bgcolor: c.errorBg, color: c.errorText, border: '1px solid ' + c.errorBorder }}>{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess(null)}>
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ bgcolor: c.chip, color: c.text, border: '1px solid ' + c.cardBorder }}>{success}</Alert>
      </Snackbar>
    </Paper>
  );
}
