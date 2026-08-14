/**
 * MenuGrid — category filter + search + product grid for the POS.
 *
 * All data is loaded dynamically from /api/menu. Nothing is hardcoded.
 * Products are shown based on the active category AND a free-text
 * search across name and description. Clicking a product opens the
 * modifier dialog (or adds directly if no modifier groups exist).
 */

import { useMemo } from 'react';
import { POSCard, POSChip, POSTextField, POSIcon } from '../../../components';
import {
  Restaurant, LocalBar, Search, ImageNotSupported,
  LocalCafe, BakeryDining, LunchDining, Icecream, RestaurantMenu,
} from '@mui/icons-material';
import { useTheme } from '../../../core/theme/monoTheme';
import type { ProductWithMods } from './ModifierDialog';

interface Category {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  kind?: string;
  sort?: number;
}

// Backend category.icon (Material Symbols-style name) → MUI icon.
// Unknown names fall back to a kind-aware default.
const ICON_BY_NAME: Record<string, typeof Restaurant> = {
  local_cafe: LocalCafe,
  bakery_dining: BakeryDining,
  lunch_dining: LunchDining,
  local_bar: LocalBar,
  icecream: Icecream,
  restaurant_menu: RestaurantMenu,
  emoji_food_beverage: LocalBar,
};

function CategoryIcon({ name, kind }: { name?: string; kind?: string }) {
  if (name && ICON_BY_NAME[name]) {
    const I = ICON_BY_NAME[name];
    return <POSIcon icon={<I />} size="sm" />;
  }
  return kind === 'bar'
    ? <POSIcon icon={<LocalBar />} size="sm" />
    : <POSIcon icon={<Restaurant />} size="sm" />;
}

interface Props {
  categories: Category[];
  products: ProductWithMods[];
  selectedCategory: number | null;
  search: string;
  onSearchChange: (v: string) => void;
  onSelectCategory: (id: number | null) => void;
  onProductClick: (product: ProductWithMods) => void;
}

const STATION_LABELS: Record<string, string> = { kitchen: 'Kitchen', bar: 'Bar', both: 'Both' };

export default function MenuGrid({
  categories, products, selectedCategory, search,
  onSearchChange, onSelectCategory, onProductClick,
}: Props) {
  const c = useTheme();

  // Sort categories by configured sort, then id (stable fallback).
  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.id - b.id),
    [categories],
  );

  // Color resolver — use backend-configured color when present, fall back
  // to kind-based station token, fall back to default c.button.
  const categoryColor = (cat: Category): string => {
    if (cat.color && /^#[0-9a-fA-F]{3,8}$/.test(cat.color)) return cat.color;
    if (cat.kind === 'bar') return c.stationBar;
    if (cat.kind === 'both') return c.stationBoth;
    if (cat.kind === 'kitchen') return c.stationKitchen;
    return c.button;
  };

  // Build a category-id → name lookup so search can match by category too.
  const categoryNameById = useMemo(() => {
    const m = new Map<number, string>();
    for (const cat of sortedCategories) m.set(cat.id, cat.name);
    return m;
  }, [sortedCategories]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(p => {
      if (!p.active) return false;
      if (selectedCategory !== null && p.category_id !== selectedCategory) return false;
      if (q) {
        const inName = p.name.toLowerCase().includes(q);
        const inDesc = (p.description || '').toLowerCase().includes(q);
        const inCat = (categoryNameById.get(p.category_id) || '').toLowerCase().includes(q);
        if (!inName && !inDesc && !inCat) return false;
      }
      return true;
    });
  }, [products, selectedCategory, search, categoryNameById]);

  const stationColor = (kind: string) => {
    if (kind === 'bar') return c.stationBar;
    if (kind === 'both') return c.stationBoth;
    return c.stationKitchen;
  };

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: c.ui.spacingBase * 2, display: 'flex', flexDirection: 'column' }}>
      {/* Header row: title + search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: c.ui.spacingBase * 2, marginBottom: c.ui.spacingBase * 2, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: c.fontSize('h5'), color: c.text }}>Menu</span>
        <div style={{ flex: 1, minWidth: 220 }}>
          <POSTextField
            variant="search"
            size="md"
            placeholder="Search products..."
            value={search}
            onChange={(v) => onSearchChange(v)}
            icon={<POSIcon icon={<Search />} size="sm" variant="muted" />}
            fullWidth
          />
        </div>
      </div>

      {/* Category filter chips */}
      <div style={{ display: 'flex', gap: c.ui.spacingBase * 1.5, flexWrap: 'wrap', marginBottom: c.ui.spacingBase * 2 }}>
        <POSChip
          variant="default"
          selected={selectedCategory === null}
          onClick={() => onSelectCategory(null)}
          size="md"
          style={
            selectedCategory === null
              ? { backgroundColor: c.stationBoth, color: c.buttonText }
              : {}
          }
        >
          All
        </POSChip>
        {sortedCategories.map(cat => (
          <POSChip
            key={cat.id}
            variant="default"
            selected={selectedCategory === cat.id}
            onClick={() => onSelectCategory(cat.id)}
            icon={<CategoryIcon name={cat.icon} kind={cat.kind} />}
            size="md"
            style={
              selectedCategory === cat.id
                ? { backgroundColor: categoryColor(cat), color: c.buttonText }
                : {}
            }
          >
            {cat.name}
          </POSChip>
        ))}
      </div>

      {/* Product grid */}
      {filtered.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: c.subtext, padding: c.ui.spacingBase * 6 }}>
          <POSIcon icon={<ImageNotSupported />} size="lg" variant="muted" style={{ opacity: 0.4, marginBottom: c.ui.spacingBase }} />
          <span style={{ fontSize: c.fontSize('body1') }}>No products match the current filter</span>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fill, minmax(${c.ui.minTouchTarget * 4}px, 1fr))`,
          gap: `${c.ui.cardGap}px`,
        }}>
          {filtered.map(product => {
            const cat = categories.find(cat => cat.id === product.category_id);
            const catColor = cat ? categoryColor(cat) : c.button;
            return (
              <POSCard
                key={product.id}
                clickable
                onClick={() => onProductClick(product)}
                variant="default"
                padding={0}
                style={{
                  minHeight: c.ui.minTouchTarget * 3,
                  overflow: 'hidden',
                  backgroundColor: catColor + '80',
                  border: `1px solid ${catColor}`,
                }}
              >
              {product.image ? (
                <div
                  style={{
                    width: '100%',
                    height: c.ui.minTouchTarget * 2,
                    backgroundImage: `url(${product.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderBottom: `1px solid ${c.cardBorder}`,
                  }}
                />
              ) : null}
              <div style={{ padding: c.ui.spacingBase * 2, flex: 1 }}>
                <span style={{ fontWeight: 700, marginBottom: c.ui.spacingBase * 0.5, fontSize: c.fontSize('body1'), color: c.text, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {product.name}
                </span>
                <span style={{ display: 'block', marginBottom: c.ui.spacingBase, fontSize: c.fontSize('body2'), color: c.subtext, fontWeight: 600 }}>
                  ${product.price.toFixed(2)}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: c.ui.spacingBase * 0.75, flexWrap: 'wrap' }}>
                  {cat && (
                    <POSChip
                      variant="default"
                      size="sm"
                      style={{ backgroundColor: catColor + '20', color: catColor, borderColor: catColor + '40', fontWeight: 600 }}
                    >
                      {cat.name}
                    </POSChip>
                  )}
                  {product.modifier_groups.length > 0 && (
                    <POSChip
                      variant="default"
                      size="sm"
                    >
                      {product.modifier_groups.length + ' opt'}
                    </POSChip>
                  )}
                </div>
              </div>
            </POSCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
