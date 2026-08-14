import { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Search as SearchIcon, TableRestaurant as TableIcon,
} from '@mui/icons-material';
import { POSCard, POSButton, POSTextField, POSChip, POSIcon, POSSelect } from '../../../components';
import { api } from '../../../core/api';
import { useTheme } from '../../../core/theme/monoTheme';
import { t } from '../../multilingual/i18n';
import { RootState } from '../../../core/store';
import { tablesSlice } from '../../../core/store/tablesSlice';
import { onWebSocketMessage } from '../../../core/ws';

type StatusFilter = 'all' | 'active' | 'inactive';

const STATUS_FILTERS: { key: StatusFilter; labelKey: string }[] = [
  { key: 'all', labelKey: 'common.all' },
  { key: 'active', labelKey: 'tables.statusActive' },
  { key: 'inactive', labelKey: 'tables.statusInactive' },
];

export default function TablesWorkspace() {
  const c = useTheme();
  const dispatch = useDispatch();
  const tablesMap = useSelector((state: RootState) => state.tables.tables);
  const tables = Object.values(tablesMap);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [sections, setSections] = useState<{ name: string; color: string }[]>([]);
  const [form, setForm] = useState<{ name: string; seats: number; active: boolean; section: string; sort: number }>({
    name: '', seats: 4, active: true, section: 'Main Hall', sort: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadTables = async () => {
    setLoading(true);
    try {
      const data = await api.getTables();
      dispatch(tablesSlice.actions.setTables(Array.isArray(data) ? data : []));
    } catch (e: any) {
      setError(e.message || t('error.generic'));
    } finally {
      setLoading(false);
    }
  };

  const loadSections = async () => {
    try {
      const res = await api.getTableSections();
      if (res && Array.isArray(res.sections)) {
        setSections(res.sections);
      }
    } catch {}
  };

  useEffect(() => {
    loadTables();
    loadSections();

    // Subscribe to WebSocket table events
    const unsubscribe = onWebSocketMessage((event, data) => {
      if (event === 'table_created' || event === 'table_updated') {
        dispatch(tablesSlice.actions.addOrUpdate(data));
      } else if (event === 'table_deleted') {
        dispatch(tablesSlice.actions.removeTable(data.id));
        if (selectedId === data.id) setSelectedId(null);
      }
    });

    return () => unsubscribe();
  }, [dispatch, selectedId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tables.filter((tbl: any) => {
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
    setForm({ name: '', seats: 4, active: true, section: sections[0]?.name || 'Main Hall', sort: 0 });
    setCreating(true);
  };

  const openEdit = (tbl: any) => {
    setEditing(tbl);
    setForm({
      name: tbl.name,
      seats: tbl.seats,
      active: tbl.active,
      section: tbl.section || 'Main Hall',
      sort: tbl.sort || 0,
    });
  };

  const closeDialog = () => {
    setEditing(null);
    setCreating(false);
    setForm({ name: '', seats: 4, active: true, section: 'Main Hall', sort: 0 });
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
          section: form.section,
          sort: form.sort,
        });
        setSuccess(t('success.updated'));
      } else {
        await api.createTable({
          name: form.name.trim(),
          seats: form.seats,
          active: form.active,
          section: form.section,
          sort: form.sort,
        });
        setSuccess(t('success.saved'));
      }
      closeDialog();
      await loadTables();
    } catch (e: any) {
      setError(e.message || t('error.generic'));
    }
  };

  const handleDelete = async (tbl: any) => {
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

  const colStyle: React.CSSProperties = {
    padding: `${c.ui.cardPadding}px`,
    backgroundColor: c.card,
    border: `1px solid ${c.cardBorder}`,
    borderRadius: `${c.ui.cardRadius}px`,
    boxShadow: c.ui.cardShadow,
    display: 'flex',
    flexDirection: 'column',
    gap: `${c.ui.listGap}px`,
    minHeight: 0,
    overflow: 'auto',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: `${c.ui.listGap}px`,
    borderBottom: `1px solid ${c.divider}`,
  };

  const listItemStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: `${c.ui.listGap}px`,
    padding: `${c.ui.listGap}px`,
    borderRadius: `${c.ui.inputRadius}px`,
    cursor: 'pointer',
    backgroundColor: active ? c.chipActive : 'transparent',
    border: `1px solid ${active ? c.buttonBorder : 'transparent'}`,
    minHeight: c.ui.minTouchTarget,
  });

  const sectionOptions = (sections.length > 0 ? sections : [{ name: 'Main Hall', color: '#5b8def' }, { name: 'Patio', color: '#10b981' }, { name: 'Bar', color: '#f59e0b' }, { name: 'Private', color: '#a855f7' }]).map(s => ({
    label: s.name,
    value: s.name,
  }));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '25% 25% 1fr', gap: `${c.ui.cardGap}px`, height: '100%', padding: `${c.ui.cardPadding}px` }}>
      {/* ─── Col 2: STATUS filter ─── */}
      <POSCard padding="sm" style={colStyle}>
        <div style={headerStyle}>
          <span style={{ fontSize: c.fontSize('h6'), fontWeight: 700, color: c.text }}>
            {t('common.status').toUpperCase()}
          </span>
        </div>
        {STATUS_FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <POSCard
              key={f.key}
              clickable
              selected={active}
              onClick={() => { setFilter(f.key); setSelectedId(null); }}
              style={listItemStyle(active)}
            >
              <POSIcon
                icon={<TableIcon />}
                size="md"
                variant={active ? 'info' : 'default'}
                color={active ? c.buttonText : c.text}
              />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: c.fontSize('body1'), fontWeight: active ? 700 : 500, color: active ? c.buttonText : c.text }}>
                  {t(f.labelKey)}
                </span>
                <span style={{ fontSize: c.fontSize('caption'), color: active ? c.buttonText : c.subtext }}>
                  {counts[f.key]} {t('tables.tableCount')}
                </span>
              </div>
            </POSCard>
          );
        })}
      </POSCard>

      {/* ─── Col 3: list + search + New ─── */}
      <POSCard padding="sm" style={colStyle}>
        <div style={headerStyle}>
          <span style={{ fontSize: c.fontSize('h6'), fontWeight: 700, color: c.text }}>
            {filter === 'all' ? t('tables.title').toUpperCase() : t(`tables.statusActive`).toUpperCase()}
            {' '}({filtered.length})
          </span>
          <POSButton
            variant="primary"
            size="sm"
            onClick={openCreate}
            icon={<AddIcon />}
          >
            {t('common.add')}
          </POSButton>
        </div>
        <POSTextField
          variant="search"
          size="sm"
          placeholder={t('common.search')}
          value={search}
          onChange={(val: string) => setSearch(val)}
          icon={<SearchIcon />}
          fullWidth
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${c.ui.listGap}px`, overflow: 'auto', flex: 1 }}>
          {filtered.length === 0 && !loading && (
            <span style={{ fontSize: c.fontSize('body2'), color: c.muted, textAlign: 'center' as const, padding: `${c.ui.cardPadding * 2}px` }}>
              {t('common.empty')}
            </span>
          )}
          {filtered.map((tbl: any) => {
            const active = selectedId === tbl.id;
            return (
              <POSCard
                key={tbl.id}
                clickable
                selected={active}
                onClick={() => setSelectedId(tbl.id)}
                style={listItemStyle(active)}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: `${c.ui.inputRadius}px`,
                  backgroundColor: tbl.active ? c.success : c.muted,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: c.buttonText, fontWeight: 700, fontSize: c.fontSize('body2'),
                }}>
                  {tbl.name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: c.fontSize('body1'), fontWeight: active ? 700 : 500, color: active ? c.buttonText : c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tbl.name}
                  </span>
                  <span style={{ fontSize: c.fontSize('caption'), color: active ? c.buttonText : c.subtext, display: 'block' }}>
                    {tbl.section || 'Main Hall'} · {tbl.seats} {t('tables.seats')}
                  </span>
                </div>
              </POSCard>
            );
          })}
        </div>
      </POSCard>

      {/* ─── Col 4: detail + Edit/Delete ─── */}
      <POSCard padding="sm" style={colStyle}>
        <div style={headerStyle}>
          <span style={{ fontSize: c.fontSize('h6'), fontWeight: 700, color: c.text }}>
            {t('common.actions').toUpperCase()}
          </span>
          {selected && (
            <div style={{ display: 'flex', gap: `${c.ui.listGap}px` }}>
              <div title={t('common.edit')}>
                <POSButton
                  variant="ghost"
                  size="sm"
                  onClick={() => openEdit(selected)}
                  icon={<EditIcon />}
                >
                  <span>{''}</span>
                </POSButton>
              </div>
              <div title={t('common.delete')}>
                <POSButton
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(selected)}
                  icon={<DeleteIcon />}
                >
                  <span>{''}</span>
                </POSButton>
              </div>
            </div>
          )}
        </div>

        {!selected && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: c.fontSize('body1'), color: c.muted }}>
              {t('tables.selectPrompt')}
            </span>
          </div>
        )}

        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${c.ui.listGap}px` }}>
            <DetailRow label={t('common.name')} value={selected.name} />
            <DetailRow label={t('tables.seats')} value={String(selected.seats)} />
            <DetailRow label="Section" value={selected.section || 'Main Hall'} />
            <DetailRow label="Sort Order" value={String(selected.sort ?? 0)} />
            <div style={{ display: 'flex', alignItems: 'center', gap: `${c.ui.listGap}px` }}>
              <span style={{ fontSize: c.fontSize('body2'), color: c.subtext, minWidth: 100 }}>
                {t('common.status')}
              </span>
              <POSChip
                variant="status"
                status={selected.active ? 'ready' : 'void'}
                size="sm"
              >
                {selected.active ? t('tables.statusActive') : t('tables.statusInactive')}
              </POSChip>
            </div>
          </div>
        )}
      </POSCard>

      {/* ─── Create / Edit dialog ─── */}
      {(creating || !!editing) && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={(e: React.MouseEvent) => { if (e.target === e.currentTarget) closeDialog(); }}>
          <POSCard
            elevation="lg"
            padding="lg"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 400,
              backgroundColor: c.card,
              border: `1px solid ${c.cardBorder}`,
              borderRadius: `${c.ui.cardRadius}px`,
            }}
          >
            <div style={{
              fontSize: c.fontSize('h6'),
              fontWeight: 700,
              color: c.text,
              marginBottom: `${c.ui.cardPadding}px`,
            }}>
              {editing ? t('tables.editTitle') : t('tables.newTitle')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${c.ui.cardGap}px` }}>
              <POSTextField
                label={t('common.name')}
                value={form.name}
                onChange={(val: string) => setForm({ ...form, name: val })}
                size="sm"
                fullWidth
                autoFocus
              />
              <POSTextField
                label={t('tables.seats')}
                type="number"
                value={String(form.seats)}
                onChange={(val: string) => setForm({ ...form, seats: Math.max(1, parseInt(val) || 1) })}
                size="sm"
                fullWidth
              />
              <POSSelect
                label="Section"
                value={form.section}
                onChange={(val: any) => setForm({ ...form, section: val })}
                options={sectionOptions}
                size="sm"
                fullWidth
              />
              <POSTextField
                label="Sort Order"
                type="number"
                value={String(form.sort)}
                onChange={(val: string) => setForm({ ...form, sort: parseInt(val) || 0 })}
                size="sm"
                fullWidth
              />
              <div style={{ display: 'flex', gap: `${c.ui.listGap}px` }}>
                <POSButton
                  variant={form.active ? 'success' : 'outline'}
                  size="md"
                  fullWidth
                  onClick={() => setForm({ ...form, active: true })}
                >
                  {t('tables.statusActive')}
                </POSButton>
                <POSButton
                  variant={!form.active ? 'secondary' : 'outline'}
                  size="md"
                  fullWidth
                  onClick={() => setForm({ ...form, active: false })}
                >
                  {t('tables.statusInactive')}
                </POSButton>
              </div>
            </div>
            <div style={{ display: 'flex', gap: `${c.ui.listGap}px`, marginTop: `${c.ui.cardGap}px`, justifyContent: 'flex-end' }}>
              <POSButton variant="outline" size="md" onClick={closeDialog}>
                {t('common.cancel')}
              </POSButton>
              <POSButton variant="primary" size="md" onClick={handleSave}>
                {t('common.save')}
              </POSButton>
            </div>
          </POSCard>
        </div>
      )}

      {/* ─── Error notification ─── */}
      {error && (
        <div style={{
          position: 'fixed',
          bottom: `${c.ui.cardPadding * 2}px`,
          right: `${c.ui.cardPadding * 2}px`,
          zIndex: 1100,
        }}>
          <POSCard
            elevation="lg"
            padding="md"
            onClick={() => setError(null)}
            style={{
              backgroundColor: c.errorBg,
              border: `1px solid ${c.errorBorder}`,
              borderRadius: `${c.ui.cardRadius}px`,
              cursor: 'pointer',
              maxWidth: 400,
            }}
          >
            <span style={{ color: c.errorText, fontSize: c.fontSize('body1'), fontWeight: 600 }}>
              {error}
            </span>
          </POSCard>
        </div>
      )}

      {/* ─── Success notification ─── */}
      {success && (
        <div style={{
          position: 'fixed',
          bottom: `${c.ui.cardPadding * 2}px`,
          right: `${c.ui.cardPadding * 2}px`,
          zIndex: 1100,
        }}>
          <POSCard
            elevation="lg"
            padding="md"
            onClick={() => setSuccess(null)}
            style={{
              backgroundColor: c.successLight,
              border: `1px solid ${c.success}`,
              borderRadius: `${c.ui.cardRadius}px`,
              cursor: 'pointer',
              maxWidth: 400,
            }}
          >
            <span style={{ color: c.successDark, fontSize: c.fontSize('body1'), fontWeight: 600 }}>
              {success}
            </span>
          </POSCard>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const c = useTheme();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: `${c.ui.listGap}px`, paddingBottom: `${c.ui.listGap}px`, borderBottom: `1px solid ${c.divider}` }}>
      <span style={{ fontSize: c.fontSize('body2'), color: c.subtext, minWidth: 100 }}>
        {label}
      </span>
      <span style={{ fontSize: c.fontSize('body1'), color: c.text, fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}
