import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField,
  Button, IconButton, Chip, Alert, Snackbar, Dialog,
  DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { Delete, Block } from '@mui/icons-material';
import { api } from '../../core/api';

interface Bill {
  order_id: number;
  order_number: number;
  table_name: string | null;
  customer_name: string;
  status: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: string | null;
  created_at: string;
  items: any[];
}

export default function VoidPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    try {
      const data = await api.getBillHistory('?period=all&limit=100');
      setBills(data.filter((b: Bill) => b.status === 'paid' || b.status === 'void'));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const openVoidDialog = (bill: Bill) => {
    if (bill.status === 'void') return;
    setSelectedBill(bill);
    setVoidReason('');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedBill(null);
    setVoidReason('');
  };

  const handleVoid = async () => {
    if (!selectedBill || !voidReason.trim()) return;
    setLoading(true);
    try {
      await api.voidOrder(selectedBill.order_id, { reason: voidReason });
      setSuccess(`Bill #${selectedBill.order_number} voided`);
      closeDialog();
      loadBills();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Block /> Void Bills
      </Typography>

      <Alert severity="warning" sx={{ mb: 2 }}>
        Voiding a bill removes it from all reports and displays. This action cannot be undone.
      </Alert>

      {bills.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">No bills available</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Bill #</TableCell>
                <TableCell>Table</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Time</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bills.map(bill => (
                <TableRow key={bill.order_id} sx={{
                  opacity: bill.status === 'void' ? 0.5 : 1,
                  textDecoration: bill.status === 'void' ? 'line-through' : 'none',
                }}>
                  <TableCell>#{bill.order_number}</TableCell>
                  <TableCell>{bill.table_name || 'Takeaway'}</TableCell>
                  <TableCell>{bill.customer_name || '—'}</TableCell>
                  <TableCell>${bill.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={bill.status}
                      color={bill.status === 'void' ? 'default' : 'success'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={bill.payment_method || 'N/A'} />
                  </TableCell>
                  <TableCell>{new Date(bill.created_at).toLocaleTimeString()}</TableCell>
                  <TableCell align="right">
                    {bill.status === 'paid' && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => openVoidDialog(bill)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Void Confirmation Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Void Bill #{selectedBill?.order_number}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Alert severity="error">
              This will permanently void the bill. The order will be excluded from all reports.
            </Alert>
            <TextField
              label="Reason (required)"
              value={voidReason}
              onChange={e => setVoidReason(e.target.value)}
              size="small"
              fullWidth
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleVoid}
            disabled={loading || !voidReason.trim()}
          >
            Void Bill
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess(null)}>
        <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>
      </Snackbar>
    </Box>
  );
}
