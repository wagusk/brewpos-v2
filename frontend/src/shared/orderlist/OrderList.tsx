/**
 * OrderList — order card grid for station displays (bar / kitchen).
 * Shared between BarPage and KitchenPage to avoid duplication.
 *
 * Renders order cards with item actions (accept, mark status, cancel).
 * Filters by station to show only relevant items.
 */

import { Box, Typography, Card, CardContent, Chip, Button, IconButton, List, ListItem, ListItemText, Grid, Paper, Tooltip } from '@mui/material';
import { LocalBar, SoupKitchen, CheckCircle, AccessTime, Send, Cancel, Fastfood, Note } from '@mui/icons-material';
import { useTheme } from '../../core/theme/monoTheme';

export interface OrderItem {
  id: number;
  name: string;
  qty: number;
  status: string;
  notes?: string;
  station: string;
}

export interface Order {
  id: number;
  number: number;
  type: string;
  status: string;
  items: OrderItem[];
  notes?: string;
  created_at: string;
  table_name?: string;
}

interface Props {
  orders: Order[];
  loading: boolean;
  station: 'bar' | 'kitchen';
  onAccept: (orderId: number) => void;
  onMarkItemStatus: (orderId: number, itemId: number, newStatus: string) => void;
}

export default function OrderList({ orders, loading, station, onAccept, onMarkItemStatus }: Props) {
  const c = useTheme();

  const stationIcon = (s: string) => {
    if (s === 'bar') return <LocalBar fontSize="small" />;
    if (s === 'both') return <Fastfood fontSize="small" />;
    return <SoupKitchen fontSize="small" />;
  };

  const stationColor = (s: string) => {
    if (s === 'bar') return c.stationBar;
    if (s === 'both') return c.stationBoth;
    return c.stationKitchen;
  };

  const filtered = station === 'bar'
    ? orders.filter(order => order.items.some(item => item.station === 'bar' || item.station === 'both'))
    : orders;

  if (filtered.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', bgcolor: c.card, border: '1px solid ' + c.cardBorder, borderRadius: c.ui.cardRadius + 'px', boxShadow: 'none' }}>
        <LocalBar sx={{ fontSize: c.ui.iconSize * 2.5 + 'rem', opacity: 0.3, mb: 2, color: c.muted }} />
        <Typography sx={{ fontSize: c.fontSize('h6'), color: c.subtext }}>No active orders</Typography>
        <Typography sx={{ fontSize: c.fontSize('body2'), color: c.subtext }}>{station === 'bar' ? 'Drink orders will appear here' : 'Orders will appear here when waiters send them'}</Typography>
      </Paper>
    );
  }

  return (
    <Grid container spacing={c.ui.cardGap / 8}>
      {filtered.map(order => (
        <Grid item xs={12} sm={6} md={4} key={order.id}>
          <Card sx={{ border: '2px solid', borderColor: order.status === 'open' ? c.warning : order.status === 'accepted' ? c.success : c.divider, bgcolor: order.status === 'open' ? c.chip : 'transparent', borderRadius: c.ui.cardRadius + 'px' }}>
            <CardContent sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: c.fontSize('h6'), color: c.text }}>{'#' + order.number}</Typography>
                <Chip size="small" label={order.table_name || order.type} color="primary" variant="outlined" />
              </Box>

              <List dense sx={{ mb: 1 }}>
                {order.items.filter(item => station === 'bar' ? (item.station === 'bar' || item.station === 'both') : true).map(item => (
                  <ListItem key={item.id} sx={{ px: 0, py: 0.75 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: c.fontSize('body1'), color: c.text }}>{item.qty + 'x ' + item.name}</Typography>
                          <Tooltip title={'Station: ' + item.station}>
                            <Box component="span" sx={{ color: stationColor(item.station) }}>{stationIcon(item.station)}</Box>
                          </Tooltip>
                        </Box>
                      }
                      secondary={item.notes}
                      secondaryTypographyProps={{ fontSize: c.fontSize('body2'), noWrap: true, color: c.subtext }}
                      sx={{ flex: 1 }}
                    />
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {item.status === 'new' && (
                        <IconButton onClick={() => onMarkItemStatus(order.id, item.id, 'preparing')} sx={{ color: c.warning, width: 48, height: 48, bgcolor: c.input, border: '1px solid ' + c.inputBorder, borderRadius: c.ui.inputRadius + 'px' }}><AccessTime fontSize="medium" /></IconButton>
                      )}
                      {item.status === 'preparing' && (
                        <IconButton onClick={() => onMarkItemStatus(order.id, item.id, 'ready')} sx={{ color: c.success, width: 48, height: 48, bgcolor: c.input, border: '1px solid ' + c.inputBorder, borderRadius: c.ui.inputRadius + 'px' }}><CheckCircle fontSize="medium" /></IconButton>
                      )}
                      {(item.status === 'new' || item.status === 'preparing') && (
                        <IconButton onClick={() => onMarkItemStatus(order.id, item.id, 'served')} sx={{ color: c.info, width: 48, height: 48, bgcolor: c.input, border: '1px solid ' + c.inputBorder, borderRadius: c.ui.inputRadius + 'px' }}><Send fontSize="medium" /></IconButton>
                      )}
                      {item.status !== 'served' && item.status !== 'cancelled' && (
                        <IconButton onClick={() => onMarkItemStatus(order.id, item.id, 'cancelled')} sx={{ color: c.errorText, width: 48, height: 48, bgcolor: c.input, border: '1px solid ' + c.inputBorder, borderRadius: c.ui.inputRadius + 'px' }}><Cancel fontSize="medium" /></IconButton>
                      )}
                      {item.status === 'served' && <Box sx={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle fontSize="medium" sx={{ color: c.muted }} /></Box>}
                    </Box>
                  </ListItem>
                ))}
              </List>

              {order.notes && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, color: c.subtext }}>
                  <Note fontSize="small" />
                  <Typography sx={{ fontSize: c.fontSize('caption') }}>{order.notes}</Typography>
                </Box>
              )}

              {order.status === 'open' && (
                <Button fullWidth variant="contained" onClick={() => onAccept(order.id)} disabled={loading} sx={{ mt: 1.5, minHeight: c.ui.buttonMinHeight, borderRadius: c.ui.buttonRadius + 'px', bgcolor: c.button, color: c.buttonText, fontWeight: 700, fontSize: c.fontSize('body1'), backgroundImage: 'none', boxShadow: 'none', '&:hover': { bgcolor: c.buttonHover, backgroundImage: 'none' } }}>Accept</Button>
              )}

              <Typography sx={{ display: 'block', mt: 0.5, fontSize: c.fontSize('caption'), color: c.subtext }}>
                {new Date(order.created_at).toLocaleTimeString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
