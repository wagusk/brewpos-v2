/**
 * WebSocket client for real-time POS events.
 * Connects to backend /ws endpoint and dispatches Redux actions.
 * Automatically reconnects on disconnect.
 */

import { store } from './store/index';
import { ordersSlice } from './store/ordersSlice';
import { tablesSlice } from './store/tablesSlice';

type MessageListener = (event: string, data: any) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private listeners: Set<MessageListener> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000; // Start at 1s, exponential backoff
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isIntentionallyClosed = false;

  constructor(apiUrl: string) {
   // Convert HTTP(S) URL to WS(S), force port 8001 (matches both the
   // API resolution in core/api.ts and the Vite dev proxy target).
   const base = apiUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
   const withoutPath = base.replace(/\/[^/]*$/, '');           // drop trailing /api etc
   const withoutPort = withoutPath.replace(/:\d+/, '');         // drop wrong port
   this.url = `${withoutPort}:8000/ws`;                       // force correct port
   }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`[WS] Connecting to ${this.url}`);
        this.ws = new WebSocket(this.url);
        this.isIntentionallyClosed = false;

        this.ws.onopen = () => {
          console.log('[WS] Connected');
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          this.startHeartbeat();
          this.emit('ws_connected', null);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            console.log('[WS] Message:', msg.event, msg.data);
            this.handleMessage(msg.event, msg.data);
          } catch (e) {
            console.error('[WS] Failed to parse message:', e);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WS] Error:', error);
          this.emit('ws_error', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[WS] Disconnected');
          this.stopHeartbeat();
          this.emit('ws_disconnected', null);
          if (!this.isIntentionallyClosed) {
            this.reconnect();
          }
        };
      } catch (e) {
        console.error('[WS] Connection failed:', e);
        reject(e);
      }
    });
  }

  private handleMessage(event: string, data: any) {
    switch (event) {
      case 'order_created':
        store.dispatch(ordersSlice.actions.addOrUpdate(data));
        break;
      case 'order_updated':
        store.dispatch(ordersSlice.actions.addOrUpdate(data));
        break;
      case 'order_accepted':
        store.dispatch(ordersSlice.actions.addOrUpdate(data));
        break;
      case 'order_item_updated':
        store.dispatch(ordersSlice.actions.updateItem(data));
        break;
      case 'order_served':
        store.dispatch(ordersSlice.actions.addOrUpdate(data));
        break;
      case 'order_closed':
        store.dispatch(ordersSlice.actions.removeOrder(data.id));
        break;
      case 'order_cancelled':
        store.dispatch(ordersSlice.actions.removeOrder(data.id));
        break;
      case 'table_created':
        store.dispatch(tablesSlice.actions.addOrUpdate(data));
        break;
      case 'table_updated':
        store.dispatch(tablesSlice.actions.addOrUpdate(data));
        break;
      case 'table_deleted':
        store.dispatch(tablesSlice.actions.removeTable(data.id));
        break;
      case 'hello':
        console.log(`[WS] Server says hello. Connections: ${data.connections}`);
        break;
      case 'pong':
        // Heartbeat response, just log
        console.log(`[WS] Pong. Connections: ${data.connections}`);
        break;
    }
    // Emit to all listeners
    this.emit(event, data);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send('ping');
      }
    }, 30000); // Every 30s
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WS] Max reconnect attempts reached');
      this.emit('ws_failed', null);
      return;
    }
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    setTimeout(() => this.connect().catch(() => {}), delay);
  }

  disconnect() {
    this.isIntentionallyClosed = true;
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  on(listener: MessageListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: string, data: any) {
    this.listeners.forEach(listener => listener(event, data));
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Global instance
let wsClient: WebSocketClient | null = null;

export function initializeWebSocket(apiUrl: string): Promise<void> {
  if (wsClient) {
    return Promise.resolve();
  }
  wsClient = new WebSocketClient(apiUrl);
  return wsClient.connect();
}

export function getWebSocketClient(): WebSocketClient | null {
  return wsClient;
}

export function onWebSocketMessage(listener: MessageListener) {
  if (!wsClient) {
    console.warn('[WS] WebSocket not initialized');
    return () => {};
  }
  return wsClient.on(listener);
}

export function isWebSocketConnected(): boolean {
  return wsClient?.isConnected() ?? false;
}

export function disconnectWebSocket() {
  if (wsClient) {
    wsClient.disconnect();
    wsClient = null;
  }
}
