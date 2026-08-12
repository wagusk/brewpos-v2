/**
 * ModifierDialog — chooses modifier options + qty + notes for a product.
 *
 * All rules come from the product prop. The frontend never assumes
 * what options exist, what counts as "valid", or how many items are
 * being added — every constraint is read from the backend's
 * `modifier_groups` payload.
 *
 * Group fields (all optional except name + options):
 *   - required:  at least one option must be picked
 *   - multi:     multiple options may be picked (vs. radio)
 *   - min:       minimum picks required (defaults: 1 if required, else 0)
 *   - max:       maximum picks allowed (defaults: ∞ if multi, else 1)
 *
 * Option fields:
 *   - price_delta: applied to base price
 *   - active:      false hides the option (out-of-stock, season, etc.)
 *
 * Always available inside the dialog: qty stepper (1–99), notes field.
 * Add button reflects base + modifier delta × qty so the cart row total
 * matches what the user sees.
 */

import { useEffect, useMemo, useState } from 'react';
import { Check, RadioButtonUnchecked, Add, Remove } from '@mui/icons-material';
import { useTheme } from '../../../core/theme/monoTheme';
import { POSCard, POSButton, POSChip, POSIcon, POSTextField } from '../../../components';

export interface ModOption {
  id: number;
  name: string;
  price_delta: number;
  active?: boolean;
}

export interface ModGroup {
  id: number;
  name: string;
  required: boolean;
  multi: boolean;
  /** Optional backend-driven selection bounds. Defaults derived from required/multi. */
  min?: number;
  max?: number;
  options: ModOption[];
}

export interface ProductWithMods {
  id: number;
  name: string;
  price: number;
  description?: string;
  category_id?: number;
  kind?: string | null;
  image?: string;
  active?: boolean;
  modifier_groups: ModGroup[];
}

interface Props {
  product: ProductWithMods | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (payload: { modifiers: number[]; notes: string; qty: number }) => void;
}

export default function ModifierDialog({ product, open, onClose, onConfirm }: Props) {
  const c = useTheme();
  const [selected, setSelected] = useState<Record<number, Set<number>>>({});
  const [notes, setNotes] = useState('');
  const [qty, setQty] = useState(1);

  // Reset state every time a fresh product opens
  useEffect(() => {
    if (!product) return;
    const init: Record<number, Set<number>> = {};
    product.modifier_groups.forEach(g => { init[g.id] = new Set(); });
    setSelected(init);
    setNotes('');
    setQty(1);
  }, [product?.id]);

  const groupBounds = (g: ModGroup): { min: number; max: number } => {
    const min = g.min ?? (g.required ? 1 : 0);
    const max = g.max ?? (g.multi ? Infinity : 1);
    return { min, max };
  };

  const toggle = (group: ModGroup, optionId: number) => {
    setSelected(prev => {
      const next: Record<number, Set<number>> = { ...prev };
      const cur = new Set(next[group.id] || []);
      const { max } = groupBounds(group);
      if (group.multi) {
        if (cur.has(optionId)) {
          cur.delete(optionId);
        } else {
          // Enforce max picks. Backend can set max=N to cap; frontend never invents limits.
          if (cur.size >= max) return prev;
          cur.add(optionId);
        }
      } else {
        cur.clear();
        cur.add(optionId);
      }
      next[group.id] = cur;
      return next;
    });
  };

  // Per-group validation messages. Empty array = all groups satisfied.
  const groupErrors = useMemo(() => {
    if (!product) return [];
    return product.modifier_groups
      .map(g => {
        const { min, max } = groupBounds(g);
        const count = selected[g.id]?.size || 0;
        if (min > 0 && count < min) return { groupId: g.id, name: g.name, msg: `Choose at least ${min}` };
        if (max < Infinity && count > max) return { groupId: g.id, name: g.name, msg: `Choose at most ${max}` };
        return null;
      })
      .filter((e): e is { groupId: number; name: string; msg: string } => !!e);
  }, [product, selected]);

  const allValid = groupErrors.length === 0;

  const modifierDelta = useMemo(() => {
    if (!product) return 0;
    let delta = 0;
    product.modifier_groups.forEach(g => {
      const sel = selected[g.id] || new Set();
      g.options.forEach(o => { if (sel.has(o.id)) delta += o.price_delta; });
    });
    return delta;
  }, [product, selected]);

  if (!product || !open) return null;

  const unitPrice = product.price + modifierDelta;
  const lineTotal = unitPrice * qty;

  const handleConfirm = () => {
    if (!allValid) return;
    const flat: number[] = [];
    Object.values(selected).forEach(s => s.forEach(id => flat.push(id)));
    onConfirm({ modifiers: flat, notes: notes.trim(), qty });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1300 }}>
      {/* Backdrop */}
      <div
        style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      />
      {/* Dialog surface */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: `${c.ui.spacingBase * 2}px`,
      }}>
        <POSCard
          elevation="lg"
          padding="lg"
          style={{
            width: '100%',
            maxWidth: 600,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: `${c.ui.spacingBase}px` }}>
            <div style={{ fontWeight: 700, fontSize: c.fontSize('h5'), color: c.text }}>
              {product.name}
            </div>
            {product.description && (
              <div style={{ fontSize: c.fontSize('body2'), color: c.subtext, marginTop: `${c.ui.spacingBase / 2}px` }}>
                {product.description}
              </div>
            )}
          </div>

          {/* Scrollable content */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: `${c.ui.cardGap}px`,
            borderTop: `1px solid ${c.divider}`,
            paddingTop: `${c.ui.cardGap}px`,
          }}>
            {product.modifier_groups.length === 0 && (
              <div style={{ fontSize: c.fontSize('body2'), color: c.subtext }}>
                No modifier options for this item. Pick a quantity and add a note if needed.
              </div>
            )}

            {product.modifier_groups.map(group => {
              const sel = selected[group.id] || new Set();
              const visibleOptions = group.options.filter(o => o.active !== false);
              return (
                <div key={group.id}>
                  {/* Group header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: `${c.ui.spacingBase}px`, marginBottom: `${c.ui.spacingBase}px` }}>
                    <span style={{ fontWeight: 700, fontSize: c.fontSize('body1'), color: c.text }}>
                      {group.name}
                    </span>
                    {group.required && (
                      <POSChip variant="default" size="sm">
                        Required
                      </POSChip>
                    )}
                    <span style={{ marginLeft: 'auto', fontSize: c.fontSize('caption'), color: c.subtext }}>
                      {groupBounds(group).max === 1
                        ? 'Choose one'
                        : groupBounds(group).max === Infinity
                          ? 'Choose any'
                          : `Choose up to ${groupBounds(group).max}`}
                    </span>
                  </div>

                  {/* Options */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: `${c.ui.spacingBase}px` }}>
                    {visibleOptions.length === 0 && (
                      <div style={{ fontSize: c.fontSize('caption'), color: c.muted, fontStyle: 'italic' }}>
                        No options available right now.
                      </div>
                    )}
                    {visibleOptions.map(opt => {
                      const picked = sel.has(opt.id);
                      return (
                        <POSCard
                          key={opt.id}
                          clickable
                          selected={picked}
                          onClick={() => toggle(group, opt.id)}
                          padding="md"
                          style={{
                            minHeight: c.ui.buttonMinHeight,
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            width: '100%',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: `${c.ui.spacingBase}px` }}>
                              <POSIcon
                                icon={picked ? <Check /> : <RadioButtonUnchecked />}
                                size="sm"
                                variant={picked ? 'success' : 'muted'}
                              />
                              <span style={{ fontWeight: 600, fontSize: c.fontSize('body1'), color: c.text }}>
                                {opt.name}
                              </span>
                            </div>
                            {opt.price_delta !== 0 && (
                              <span style={{
                                fontWeight: 700,
                                fontSize: c.fontSize('body2'),
                                color: picked ? c.text : c.subtext,
                              }}>
                                {opt.price_delta > 0 ? '+' : ''}{opt.price_delta.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </POSCard>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Validation errors */}
            {groupErrors.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${c.ui.spacingBase / 2}px` }}>
                {groupErrors.map(e => (
                  <div key={e.groupId} style={{ fontSize: c.fontSize('caption'), color: c.errorText, fontWeight: 600 }}>
                    {e.name}: {e.msg}
                  </div>
                ))}
              </div>
            )}

            {/* Divider */}
            <div style={{ borderTop: `1px solid ${c.divider}` }} />

            {/* Special instructions */}
            <div>
              <div style={{ fontWeight: 700, fontSize: c.fontSize('body1'), color: c.text, marginBottom: `${c.ui.spacingBase}px` }}>
                Special instructions
              </div>
              <POSCard variant="outlined" padding="sm" style={{ minHeight: c.ui.inputMinHeight }}>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. no onions, extra spicy"
                  rows={2}
                  style={{
                    width: '100%',
                    minHeight: `${c.ui.inputMinHeight}px`,
                    padding: `${c.ui.inputPaddingY}px ${c.ui.inputPaddingX}px`,
                    border: 'none',
                    borderRadius: `${c.ui.inputRadius}px`,
                    backgroundColor: 'transparent',
                    color: c.inputText,
                    fontSize: c.fontSize('body1'),
                    fontWeight: 500,
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                  }}
                />
              </POSCard>
            </div>
          </div>

          {/* Actions footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: `${c.ui.spacingBase}px`,
            borderTop: `1px solid ${c.divider}`,
            paddingTop: `${c.ui.spacingBase * 2}px`,
            marginTop: `${c.ui.cardGap}px`,
          }}>
            {/* Quantity stepper */}
            <div style={{ display: 'flex', alignItems: 'center', gap: `${c.ui.spacingBase / 2}px`, marginRight: 'auto' }}>
              <POSButton
                variant="ghost"
                size="sm"
                onClick={() => setQty(q => Math.max(1, q - 1))}
                disabled={qty <= 1}
                aria-label="Decrease quantity"
                icon={<POSIcon icon={<Remove />} size="sm" />}
              >
                {' '}
              </POSButton>
              <POSTextField
                value={String(qty)}
                onChange={(val) => {
                  const n = parseInt(val.replace(/\D/g, ''), 10);
                  if (!Number.isFinite(n)) return;
                  setQty(Math.min(99, Math.max(1, n)));
                }}
                size="sm"
                fullWidth={false}
              />
              <POSButton
                variant="ghost"
                size="sm"
                onClick={() => setQty(q => Math.min(99, q + 1))}
                disabled={qty >= 99}
                aria-label="Increase quantity"
                icon={<POSIcon icon={<Add />} size="sm" />}
              >
                {' '}
              </POSButton>
            </div>

            <POSButton variant="secondary" size="md" onClick={onClose}>
              Cancel
            </POSButton>
            <POSButton
              variant="primary"
              size="md"
              onClick={handleConfirm}
              disabled={!allValid}
            >
              Add {qty} · ${lineTotal.toFixed(2)}
            </POSButton>
          </div>
        </POSCard>
      </div>
    </div>
  );
}
