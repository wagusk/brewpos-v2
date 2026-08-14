/**
 * useWebSocketConnected — tracks WebSocket connection state.
 * Subscribes to ws_connected/ws_disconnected events and returns current status.
 */

import { useState, useEffect } from 'react';
import { isWebSocketConnected, onWebSocketMessage } from '../../core/ws';

export default function useWebSocketConnected(): boolean {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    setConnected(isWebSocketConnected());

    const unsubscribe = onWebSocketMessage((event) => {
      if (event === 'ws_connected') setConnected(true);
      else if (event === 'ws_disconnected') setConnected(false);
    });

    return () => unsubscribe();
  }, []);

  return connected;
}
