/**
 * ConnectionStatus — reusable WebSocket connection indicator.
 *
 * Shows a POSChip with Wifi/WifiOff icon and Connected/Disconnected label.
 * Uses useWebSocketConnected hook for state tracking.
 *
 * Props:
 *   - position: 'absolute' | 'flex-end' | 'inline' (wrapping layout)
 *   - size: 'sm' | 'md' (POSChip size, default 'sm')
 */

import { Wifi, WifiOff } from '@mui/icons-material';
import { POSChip, POSIcon } from '../../components';
import useWebSocketConnected from './useWebSocketConnected';

interface ConnectionStatusProps {
  position?: 'absolute' | 'flex-end' | 'inline';
  size?: 'sm' | 'md';
}

export default function ConnectionStatus({ position = 'flex-end', size = 'sm' }: ConnectionStatusProps) {
  const connected = useWebSocketConnected();

  const chip = (
    <POSChip variant="status" size={size} status={connected ? 'ready' : 'pending'}>
      <POSIcon icon={connected ? <Wifi /> : <WifiOff />} size="sm" />
      {connected ? 'Connected' : 'Disconnected'}
    </POSChip>
  );

  if (position === 'inline') return chip;

  if (position === 'absolute') {
    return (
      <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
        {chip}
      </div>
    );
  }

  // flex-end
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      {chip}
    </div>
  );
}
