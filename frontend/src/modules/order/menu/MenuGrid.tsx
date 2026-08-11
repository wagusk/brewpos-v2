/**
 * MenuGrid — product grid + category filter for the waiter page.
 * Shows all products filtered by selected category. Click adds to cart.
 */

import { Box, Typography, Grid, Card, CardContent, Chip } from '@mui/material';
import { Restaurant, LocalBar } from '@mui/icons-material';
import { useTheme } from '../../../core/theme/monoTheme';

interface Product {
  id: number;
  name: string;
  price: number;
  category_id: number;
  kind?: string;
}

interface Category {
  id: number;
  name: string;
  kind?: string;
}

interface Props {
  categories: Category[];
  products: Product[];
  selectedCategory: number | null;
  onSelectCategory: (id: number | null) => void;
  onAddToCart: (product: Product) => void;
}

const STATION_LABELS: Record<string, string> = { kitchen: 'Kitchen', bar: 'Bar', both: 'Both' };

export default function MenuGrid({ categories, products, selectedCategory, onSelectCategory, onAddToCart }: Props) {
  const c = useTheme();

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category_id === selectedCategory)
    : products;

  const stationColor = (kind: string) => {
    if (kind === 'bar') return c.stationBar;
    if (kind === 'both') return c.stationBoth;
    return c.stationKitchen;
  };

  return (
    <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
      <Typography sx={{ fontWeight: 700, mb: 2, fontSize: c.fontSize('h5'), color: c.text }}>Menu</Typography>
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
        <Chip label="All" onClick={() => onSelectCategory(null)} color={selectedCategory === null ? 'primary' : 'default'} sx={{ fontWeight: 700, fontSize: c.fontSize('body1'), height: 40 }} />
        {categories.map(cat => (
          <Chip key={cat.id} label={cat.name} onClick={() => onSelectCategory(cat.id)} color={selectedCategory === cat.id ? 'primary' : 'default'} icon={cat.kind === 'bar' ? <LocalBar fontSize="small" /> : <Restaurant fontSize="small" />} sx={{ fontWeight: 700, fontSize: c.fontSize('body1'), height: 40 }} />
        ))}
      </Box>

      <Grid container spacing={c.ui.cardGap / 8}>
        {filteredProducts.map(product => (
          <Grid item xs={6} sm={4} md={3} key={product.id}>
            <Card onClick={() => onAddToCart(product)} sx={{
              cursor: 'pointer',
              bgcolor: c.card, border: '1px solid ' + c.cardBorder,
              borderRadius: c.ui.cardRadius + 'px',
              boxShadow: 'none',
              minHeight: 130,
              '&:hover': { bgcolor: c.cardHover, borderColor: c.button },
              '&:active': { bgcolor: c.chipActive, borderColor: c.button },
            }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography sx={{ fontWeight: 700, mb: 0.5, fontSize: c.fontSize('body1'), color: c.text }}>
                  {product.name}
                </Typography>
                <Typography sx={{ display: 'block', mb: 1, fontSize: c.fontSize('subtitle2'), color: c.subtext, fontWeight: 600 }}>
                  {'$' + product.price.toFixed(2)}
                </Typography>
                <Chip
                  size="small"
                  label={STATION_LABELS[product.kind || ''] || 'Kitchen'}
                  sx={{
                    height: 24,
                    fontSize: c.fontSize('caption'),
                    bgcolor: stationColor(product.kind || 'kitchen'),
                    color: c.buttonText,
                    borderRadius: c.ui.inputRadius + 'px',
                    fontWeight: 600,
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
