/**
 * UsersTab - list + edit/delete users.
 */

import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Chip } from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useTheme } from '../../../core/theme/monoTheme';

interface Props {
  users: any[];
  onAdd: () => void;
  onEdit: (usr: any) => void;
  onDelete: (usr: any) => void;
}

export default function UsersTab({ users, onAdd, onEdit, onDelete }: Props) {
  const c = useTheme();
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Users ({users.length})</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={onAdd} sx={{ minHeight: c.ui.buttonMinHeight, fontWeight: 700, backgroundImage: 'none', boxShadow: 'none', '&:hover': { backgroundImage: 'none' } }}>
          Add User
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: c.fontSize('body1'), fontWeight: 700 }}>Name</TableCell>
              <TableCell sx={{ fontSize: c.fontSize('body1'), fontWeight: 700 }}>Role</TableCell>
              <TableCell sx={{ fontSize: c.fontSize('body1'), fontWeight: 700 }}>Active</TableCell>
              <TableCell align="right" sx={{ fontSize: c.fontSize('body1'), fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((usr) => (
              <TableRow key={usr.id} sx={{ '& td': { py: 1.5 } }}>
                <TableCell sx={{ fontSize: c.fontSize('body1') }}>{usr.name}</TableCell>
                <TableCell>
                  <Chip size="small" label={usr.role} sx={{ fontSize: c.fontSize('body2'), height: 28, fontWeight: 600 }} />
                </TableCell>
                <TableCell>
                  <Chip size="small" label={usr.active ? 'Yes' : 'No'} color={usr.active ? 'success' : 'default'} sx={{ fontSize: c.fontSize('body2'), height: 28, fontWeight: 600 }} />
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => onEdit(usr)} sx={{ width: 48, height: 48 }}>
                    <Edit fontSize="medium" />
                  </IconButton>
                  <IconButton onClick={() => onDelete(usr)} sx={{ width: 48, height: 48 }}>
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
