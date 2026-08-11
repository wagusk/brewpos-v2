/**
 * ProductsTab - list + edit/delete products.
 */

import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Chip } from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useTheme } from '../../../core/theme/monoTheme';

interface Props {
  products: any[];
  categories: any[];
  onAdd: () => void;
  onEdit: (prod: any) => void;
  onDelete: (prod: any) => void;
}

export default function ProductsTab({ products, categories, onAdd, onEdit, onDelete }: Props) {
  const c = useTheme();
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Products ({products.length})</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={onAdd} sx={{ minHeight: c.ui.buttonMinHeight, fontWeight: 700, backgroundImage: 'none', boxShadow: 'none', '&:hover': { backgroundImage: 'none' } }}>
          Add Product
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: c.fontSize('body1'), fontWeight: 700 }}>Name</TableCell>
              <TableCell sx={{ fontSize: c.fontSize('body1'), fontWeight: 700 }}>Price</TableCell>
              <TableCell sx={{ fontSize: c.fontSize('body1'), fontWeight: 700 }}>Category</TableCell>
              <TableCell sx={{ fontSize: c.fontSize('body1'), fontWeight: 700 }}>Active</TableCell>
              <TableCell align="right" sx={{ fontSize: c.fontSize('body1'), fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((prod) => (
              <TableRow key={prod.id} sx={{ '& td': { py: 1.5 } }}>
                <TableCell sx={{ fontSize: c.fontSize('body1') }}>{prod.name}</TableCell>
                <TableCell sx={{ fontSize: c.fontSize('body1') }}>{'$' + prod.price.toFixed(2)}</TableCell>
                <TableCell sx={{ fontSize: c.fontSize('body1') }}>{categories.find((c) => c.id === prod.category_id)?.name}</TableCell>
                <TableCell>
                  <Chip size="small" label={prod.active ? 'Yes' : 'No'} color={prod.active ? 'success' : 'default'} sx={{ fontSize: c.fontSize('body2'), height: 28, fontWeight: 600 }} />
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => onEdit(prod)} sx={{ width: 48, height: 48 }}>
                    <Edit fontSize="medium" />
                  </IconButton>
                  <IconButton onClick={() => onDelete(prod)} sx={{ width: 48, height: 48 }}>
                    <Delete fontSize="medium" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
