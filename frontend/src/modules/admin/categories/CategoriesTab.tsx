/**
 * CategoriesTab - list + edit/delete categories.
 */

import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Chip } from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useTheme } from '../../../core/theme/monoTheme';

interface Props {
  categories: any[];
  onAdd: () => void;
  onEdit: (cat: any) => void;
  onDelete: (cat: any) => void;
}

export default function CategoriesTab({ categories, onAdd, onEdit, onDelete }: Props) {
  const c = useTheme();
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Categories ({categories.length})</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={onAdd} sx={{ minHeight: c.ui.buttonMinHeight, fontWeight: 700, backgroundImage: 'none', boxShadow: 'none', '&:hover': { backgroundImage: 'none' } }}>
          Add Category
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: c.fontSize('body1'), fontWeight: 700 }}>Name</TableCell>
              <TableCell sx={{ fontSize: c.fontSize('body1'), fontWeight: 700 }}>Color</TableCell>
              <TableCell sx={{ fontSize: c.fontSize('body1'), fontWeight: 700 }}>Icon</TableCell>
              <TableCell sx={{ fontSize: c.fontSize('body1'), fontWeight: 700 }}>Station</TableCell>
              <TableCell align="right" sx={{ fontSize: c.fontSize('body1'), fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id} sx={{ '& td': { py: 1.5 } }}>
                <TableCell sx={{ fontSize: c.fontSize('body1') }}>{cat.name}</TableCell>
                <TableCell>
                  <Box sx={{ width: 24, height: 24, bgcolor: cat.color, borderRadius: 1 }} />
                </TableCell>
                <TableCell sx={{ fontSize: c.fontSize('body1') }}>{cat.icon}</TableCell>
                <TableCell>
                  <Chip size="small" label={cat.kind} sx={{ fontSize: c.fontSize('body2'), height: 28, fontWeight: 600 }} />
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => onEdit(cat)} sx={{ width: 48, height: 48 }}>
                    <Edit fontSize="medium" />
                  </IconButton>
                  <IconButton onClick={() => onDelete(cat)} sx={{ width: 48, height: 48 }}>
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
