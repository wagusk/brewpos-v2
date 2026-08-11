import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField,
  Button, IconButton, Chip, Alert, Snackbar, Dialog,
  DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { api } from '../../core/api';
import { useNavigate } from 'react-router-dom';

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

export default function DiscountPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [discountReason, setDiscountReason] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    try {
      const data = await api.getBillHistory('?period=day&limit=50');
      setBills(data.filter((b: Bill) => b.status === 'paid'));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const openDiscountDialog = (bill: Bill) => {
    setSelectedBill(bill);
    setDiscountReason('');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedBill(null);
    setDiscountReason('');
  };

  return (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        Bill History & Discounts
      </Typography>

      {bills.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">No paid bills yet</Typography>
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
                <TableCell>Method</TableCell>
                <TableCell>Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bills.map(bill => (
                <TableRow key={bill.order_id}>
                  <TableCell>#{bill.order_number}</TableCell>
                  <TableCell>{bill.table_name || 'Takeaway'}</TableCell>
                  <TableCell>{bill.customer_name || '—'}</TableCell>
                  <TableCell>${bill.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip size="small" label={bill.payment_method || 'N/A'} />
                  </TableCell>
                  <TableCell>{new Date(bill.created_at).toLocaleTimeString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess(null)}>
        <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>
      </Snackbar>
    </Box>
  );
}
