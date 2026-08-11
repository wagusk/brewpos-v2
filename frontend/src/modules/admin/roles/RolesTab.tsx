/**
 * RolesTab - list + edit/delete roles.
 */

import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useTheme } from '../../../core/theme/monoTheme';

interface Props {
  roles: any[];
  onAdd: () => void;
  onEdit: (rl: any) => void;
  onDelete: (rl: any) => void;
}

export default function RolesTab({ roles, onAdd, onEdit, onDelete }: Props) {
  const c = useTheme();
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Roles ({roles.length})</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={onAdd} sx={{ minHeight: c.ui.buttonMinHeight, fontWeight: 700, backgroundImage: 'none', boxShadow: 'none', '&:hover': { backgroundImage: 'none' } }}>
          Add Role
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: c.fontSize('body1'), fontWeight: 700 }}>Name</TableCell>
              <TableCell sx={{ fontSize: c.fontSize('body1'), fontWeight: 700 }}>Label</TableCell>
              <TableCell sx={{ fontSize: c.fontSize('body1'), fontWeight: 700 }}>Color</TableCell>
              <TableCell align="right" sx={{ fontSize: c.fontSize('body1'), fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.map((rl) => (
              <TableRow key={rl.id} sx={{ '& td': { py: 1.5 } }}>
                <TableCell sx={{ fontSize: c.fontSize('body1') }}>{rl.name}</TableCell>
                <TableCell sx={{ fontSize: c.fontSize('body1') }}>{rl.label}</TableCell>
                <TableCell>
                  <Box sx={{ width: 24, height: 24, bgcolor: rl.color, borderRadius: 1 }} />
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => onEdit(rl)} sx={{ width: 48, height: 48 }}>
                    <Edit fontSize="medium" />
                  </IconButton>
                  <IconButton onClick={() => onDelete(rl)} sx={{ width: 48, height: 48 }}>
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
