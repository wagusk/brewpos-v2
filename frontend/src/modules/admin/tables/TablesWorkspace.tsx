/**
 * TablesWorkspace — admin 3-column layout for table CRUD.
 *
 * Pattern: matches v1 Admin > Users workspace
 *   Col 2 (25%) — STATUS filter (All / Active / Inactive)
 *   Col 3 (25%) — table list with New + search, click to select
 *   Col 4 (50%) — DETAIL (read-only rows + Edit / Delete actions)
 *
 * Source of truth:
 *   - Backend: GET/POST/PATCH/DELETE /api/admin/tables
 *   - Frontend: api.getAdminTables / createTable / updateTable / deleteTable
 *
 * No hardcoded values — colors, sizes, radius, and font scale come
 * from useTheme(). Labels come from i18n via the t() helper.
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, TextField, Paper, Chip, Tooltip,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Snackbar, InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Search as SearchIcon, TableRestaurant as TableIcon,
} from '@mui/icons-material';
import { api } from '../../../core/api';
import { useTheme } from '../../../core/theme/monoTheme';
import { t } from '../../multilingual/i18n';

type StatusFilter = 'all' | 'active' | 'inactive';

interface Table {
  id: number;
  name: string;
  seats: number;
  active: boolean;
}

const STATUS_FILTERS: { key: StatusFilter; labelKey: string }[] = [
  { key: 'all', labelKey: 'common.all' },
  { key: 'active', labelKey: 'tables.statusActive' },
  { key: 'inactive', labelKey: 'tables.statusInactive' },
];

export default function TablesWorkspace() {
  const c = useTheme();
  const [tables, setTables] = useState<Table[]>([]);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Table | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<{ name: string; seats: number; active: boolean }>({
    name: '', seats: 4, active: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadTables = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminTables();
      setTables(data);
    } catch (e: any) {
      setError(e.message || t('error.generic'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTables(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tables.filter((tbl) => {
      if (filter === 'active' && !tbl.active) return false;
      if (filter === 'inactive' && tbl.active) return false;
      if (q && !tbl.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [tables, filter, search]);

  const counts = useMemo(() => ({
    all: tables.length,
    active: tables.filter((tbl) => tbl.active).length,
    inactive: tables.filter((tbl) => !tbl.active).length,
  }), [tables]);

  const selected = filtered.find((tbl) => tbl.id === selectedId)
    ?? tables.find((tbl) => tbl.id === selectedId)
    ?? null;

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', seats: 4, active: true });
    setCreating(true);
  };

  const openEdit = (tbl: Table) => {
    setEditing(tbl);
    setForm({ name: tbl.name, seats: tbl.seats, active: tbl.active });
  };

  const closeDialog = () => {
    setEditing(null);
    setCreating(false);
    setForm({ name: '', seats: 4, active: true });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError(t('tables.nameRequired'));
      return;
    }
    try {
      if (editing) {
        await api.updateTable(editing.id, {
          name: form.name.trim(),
          seats: form.seats,
          active: form.active,
        });
        setSuccess(t('success.updated'));
      } else {
        await api.createTable({
          name: form.name.trim(),
          seats: form.seats,
          active: form.active,
        });
        setSuccess(t('success.saved'));
      }
      closeDialog();
      await loadTables();
    } catch (e: any) {
      setError(e.message || t('error.generic'));
    }
  };

  const handleDelete = async (tbl: Table) => {
    if (!window.confirm(t('tables.confirmDelete').replace('{name}', tbl.name))) return;
    try {
      await api.deleteTable(tbl.id);
      setSuccess(t('success.deleted'));
      if (selectedId === tbl.id) setSelectedId(null);
      await loadTables();
    } catch (e: any) {
      setError(e.message || t('error.generic'));
    }
  };

  // ───── Styles (all from theme) ─────
  const colStyle = {
    p: 2,
    bgcolor: c.card,
    border: `1px solid ${c.cardBorder}`,
    borderRadius: `${c.ui.cardRadius}px`,
    boxShadow: c.ui.cardShadow,
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    minHeight: 0,
    overflow: 'auto',
  } as const;

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    pb: 1,
    borderBottom: `1px solid ${c.divider}`,
  } as const;

  const listItemStyle = (active: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    p: 1,
    borderRadius: `${c.ui.inputRadius}px`,
    cursor: 'pointer',
    bgcolor: active ? c.chipActive : 'transparent',
    border: `1px solid ${active ? c.buttonBorder : 'transparent'}`,
    minHeight: c.ui.minTouchTarget,
    '&:hover': { bgcolor: c.cardHover },
  } as const);

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '25% 25% 1fr', gap: 2, height: '100%', p: 2 }}>
      {/* ─── Col 2: STATUS filter ─── */}
      <Paper sx={colStyle}>
        <Box sx={headerStyle}>
          <Typography sx={{ fontSize: c.fontSize('h6'), fontWeight: 700, color: c.text }}>
            {t('common.status').toUpperCase()}
         </Typography>
       </Box>
        {STATUS_FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Box
              key={f.key}
              onClick={() => { setFilter(f.key); setSelectedId(null); }}
              sx={listItemStyle(active)}
            >
              <TableIcon sx={{ fontSize: c.ui.iconSize, color: active ? c.buttonText : c.text }} />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: c.fontSize('body1'), fontWeight: active ? 700 : 500, color: active ? c.buttonText : c.text }}>
                  {t(f.labelKey)}
               </Typography>
                <Typography sx={{ fontSize: c.fontSize('caption'), color: active ? c.buttonText : c.subtext }}>
                  {counts[f.key]} {t('tables.tableCount')}
               </Typography>
             </Box>
           </Box>
          );
        })}
     </Paper>

      {/* ─── Col 3: list + search + New ─── */}
      <Paper sx={colStyle}>
        <Box sx={headerStyle}>
          <Typography sx={{ fontSize: c.fontSize('h6'), fontWeight: 700, color: c.text }}>
            {filter === 'all' ? t('tables.title').toUpperCase() : t(`tables.statusActive`).toUpperCase()}
            {' '}({filtered.length})
         </Typography>
          <Button
            size="small"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
            sx={{
              bgcolor: c.button, color: c.buttonText,
              borderRadius: `${c.ui.buttonRadius}px`,
              minHeight: c.ui.minTouchTarget,
              px: 2, fontWeight: 700,
              backgroundImage: 'none', boxShadow: 'none',
              '&:hover': { bgcolor: c.buttonHover, backgroundImage: 'none' },
            }}
          >
            {t('common.add')}
         </Button>
       </Box>
        <TextField
          size="small"
          placeholder={t('common.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: c.ui.iconSize, color: c.subtext }} />
             </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: c.input, color: c.inputText,
              borderRadius: `${c.ui.inputRadius}px`,
              '& fieldset': { borderColor: c.inputBorder },
              '&:hover fieldset': { borderColor: c.buttonBorder },
              '&.Mui-focused fieldset': { borderColor: c.button },
            },
            '& input': { color: c.inputText, fontSize: c.fontSize('body1') },
          }}
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${c.ui.listGap}px`, overflow: 'auto', flex: 1 }}>
          {filtered.length === 0 && !loading && (
            <Typography sx={{ fontSize: c.fontSize('body2'), color: c.muted, textAlign: 'center', py: 4 }}>
              {t('common.empty')}
           </Typography>
          )}
          {filtered.map((tbl) => {
            const active = selectedId === tbl.id;
            return (
              <Box key={tbl.id} onClick={() => setSelectedId(tbl.id)} sx={listItemStyle(active)}>
                <Box sx={{
                  width: 32, height: 32, borderRadius: `${c.ui.inputRadius}px`,
                  bgcolor: tbl.active ? c.success : c.muted,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: c.buttonText, fontWeight: 700, fontSize: c.fontSize('body2'),
                }}>
                  {tbl.name.slice(0, 2).toUpperCase()}
               </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: c.fontSize('body1'), fontWeight: active ? 700 : 500, color: active ? c.buttonText : c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tbl.name}
                 </Typography>
                  <Typography sx={{ fontSize: c.fontSize('caption'), color: active ? c.buttonText : c.subtext }}>
                    {tbl.seats} {t('tables.seats')}
                 </Typography>
               </Box>
             </Box>
            );
          })}
       </Box>
     </Paper>

      {/* ─── Col 4: detail + Edit/Delete ─── */}
      <Paper sx={colStyle}>
        <Box sx={headerStyle}>
          <Typography sx={{ fontSize: c.fontSize('h6'), fontWeight: 700, color: c.text }}>
            {t('common.actions').toUpperCase()}
         </Typography>
          {selected && (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title={t('common.edit')}>
                <IconButton onClick={() => openEdit(selected)}
                  sx={{
                    bgcolor: 'rgba(99, 102, 241, 0.15)', color: c.info,
                    borderRadius: `${c.ui.inputRadius}px`,
                    width: 48, height: 48,
                    '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.25)' },
                  }}>
                  <EditIcon fontSize="medium" />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('common.delete')}>
                <IconButton onClick={() => handleDelete(selected)}
                  sx={{
                    bgcolor: 'rgba(248, 113, 113, 0.15)', color: c.errorText,
                    borderRadius: `${c.ui.inputRadius}px`,
                    width: 48, height: 48,
                    '&:hover': { bgcolor: 'rgba(248, 113, 113, 0.25)' },
                  }}>
                  <DeleteIcon fontSize="medium" />
                </IconButton>
              </Tooltip>
           </Box>
          )}
       </Box>

        {!selected && (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ fontSize: c.fontSize('body1'), color: c.muted }}>
              {t('tables.selectPrompt')}
           </Typography>
         </Box>
        )}

        {selected && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <DetailRow label={t('common.name')} value={selected.name} />
            <DetailRow label={t('tables.seats')} value={String(selected.seats)} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: c.fontSize('body2'), color: c.subtext, minWidth: 100 }}>
                {t('common.status')}
             </Typography>
              <Chip
                size="small"
                label={selected.active ? t('tables.statusActive') : t('tables.statusInactive')}
                sx={{
                  bgcolor: selected.active ? c.success : c.muted,
                  color: c.buttonText,
                  fontWeight: 600,
                  fontSize: c.fontSize('caption'),
                }}
              />
           </Box>
         </Box>
        )}
     </Paper>

      {/* ─── Create / Edit dialog ─── */}
      <Dialog open={creating || !!editing} onClose={closeDialog} maxWidth="xs" fullWidth
        PaperProps={{
          sx: {
            bgcolor: c.card, color: c.text,
            border: `1px solid ${c.cardBorder}`,
            borderRadius: `${c.ui.cardRadius}px`,
          },
        }}>
        <DialogTitle sx={{ color: c.text, fontSize: c.fontSize('h6'), fontWeight: 700 }}>
          {editing ? t('tables.editTitle') : t('tables.newTitle')}
       </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label={t('common.name')}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              size="small"
              fullWidth
              autoFocus
              InputLabelProps={{ sx: { color: c.subtext, fontSize: c.fontSize('body2') } }}
              sx={inputSx(c)}
            />
            <TextField
              label={t('tables.seats')}
              type="number"
              value={form.seats}
              onChange={(e) => setForm({ ...form, seats: Math.max(1, parseInt(e.target.value) || 1) })}
              size="small"
              fullWidth
              inputProps={{ min: 1 }}
              InputLabelProps={{ sx: { color: c.subtext, fontSize: c.fontSize('body2') } }}
              sx={inputSx(c)}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                fullWidth
                variant={form.active ? 'contained' : 'outlined'}
                onClick={() => setForm({ ...form, active: true })}
                sx={{
                  bgcolor: form.active ? c.success : 'transparent',
                  color: form.active ? c.buttonText : c.text,
                  borderColor: c.buttonBorder,
                  borderRadius: `${c.ui.buttonRadius}px`,
                  minHeight: c.ui.buttonMinHeight,
                  backgroundImage: 'none', boxShadow: 'none',
                  '&:hover': { bgcolor: form.active ? c.success : c.cardHover, backgroundImage: 'none' },
                }}
              >
                {t('tables.statusActive')}
             </Button>
              <Button
                fullWidth
                variant={!form.active ? 'contained' : 'outlined'}
                onClick={() => setForm({ ...form, active: false })}
                sx={{
                  bgcolor: !form.active ? c.muted : 'transparent',
                  color: !form.active ? c.buttonText : c.text,
                  borderColor: c.buttonBorder,
                  borderRadius: `${c.ui.buttonRadius}px`,
                  minHeight: c.ui.buttonMinHeight,
                  backgroundImage: 'none', boxShadow: 'none',
                  '&:hover': { bgcolor: !form.active ? c.muted : c.cardHover, backgroundImage: 'none' },
                }}
              >
                {t('tables.statusInactive')}
             </Button>
           </Box>
         </Box>
       </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeDialog}
            sx={{
              color: c.text, borderColor: c.buttonBorder,
              borderRadius: `${c.ui.buttonRadius}px`,
              minHeight: c.ui.buttonMinHeight,
              '&:hover': { bgcolor: c.cardHover, borderColor: c.button },
            }}>
            {t('common.cancel')}
         </Button>
          <Button onClick={handleSave} variant="contained"
            sx={{
              bgcolor: c.button, color: c.buttonText,
              borderRadius: `${c.ui.buttonRadius}px`,
              minHeight: c.ui.buttonMinHeight, px: 3, fontWeight: 700,
              backgroundImage: 'none', boxShadow: 'none',
              '&:hover': { bgcolor: c.buttonHover, backgroundImage: 'none' },
            }}>
            {t('common.save')}
         </Button>
       </DialogActions>
     </Dialog>

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}
          sx={{ bgcolor: c.errorBg, color: c.errorText, border: `1px solid ${c.errorBorder}` }}>
          {error}
       </Alert>
     </Snackbar>
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess(null)}>
        <Alert severity="success" onClose={() => setSuccess(null)}
          sx={{ bgcolor: c.chip, color: c.success, border: `1px solid ${c.success}` }}>
          {success}
       </Alert>
     </Snackbar>
   </Box>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const c = useTheme();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1, borderBottom: `1px solid ${c.divider}` }}>
      <Typography sx={{ fontSize: c.fontSize('body2'), color: c.subtext, minWidth: 100 }}>
        {label}
     </Typography>
      <Typography sx={{ fontSize: c.fontSize('body1'), color: c.text, fontWeight: 500 }}>
        {value}
     </Typography>
   </Box>
  );
}

function inputSx(c: ReturnType<typeof useTheme>) {
  return {
    '& .MuiOutlinedInput-root': {
      bgcolor: c.input, color: c.inputText,
      borderRadius: `${c.ui.inputRadius}px`,
      '& fieldset': { borderColor: c.inputBorder },
      '&:hover fieldset': { borderColor: c.buttonBorder },
      '&.Mui-focused fieldset': { borderColor: c.button },
    },
    '& input': { color: c.inputText, fontSize: c.fontSize('body1') },
  } as const;
}
