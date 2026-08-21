// WebSocket client for real-time backend events.
//
// Connects to /ws on the same origin (or VITE_WS_URL override). Auto-reconnects
// with exponential backoff (1s, 2s, 4s, 8s, capped at 30s). Maintains a
// registry of event subscribers keyed by event name; subscribers receive the
// parsed payload every time an event arrives.

export type WsEvent = {
  event: string;
  data: unknown;
};

export type WsHandler = (data: unknown) => void;

const subscribers = new Map<string, Set<WsHandler>>();
let socket: WebSocket | null = null;
let connected = false;
let attempt = 0;
let reconnectTimer: number | null = null;

function wsUrl(): string {
  const override = (import.meta.env.VITE_WS_URL as string | undefined)?.trim();
  if (override) return override;
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${window.location.host}/ws`;
}

export function isConnected(): boolean {
  return connected;
}

export function subscribe(event: string, handler: WsHandler): () => void {
  let set = subscribers.get(event);
  if (!set) {
    set = new Set();
    subscribers.set(event, set);
  }
  set.add(handler);
  ensureConnection();
  return () => {
    const s = subscribers.get(event);
    if (!s) return;
    s.delete(handler);
    if (s.size === 0) subscribers.delete(event);
  };
}

function dispatch(msg: WsEvent): void {
  const set = subscribers.get(msg.event);
  if (!set) return;
  for (const handler of set) {
    try {
      handler(msg.data);
    } catch (e) {
      // Don't let one bad subscriber kill the dispatch loop
      // eslint-disable-next-line no-console
      console.error("ws subscriber error", msg.event, e);
    }
  }
}

function ensureConnection(): void {
  if (
    socket &&
    (socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }
  if (reconnectTimer !== null) {
    window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  try {
    socket = new WebSocket(wsUrl());
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("ws: failed to construct socket", e);
    scheduleReconnect();
    return;
  }
  socket.addEventListener("open", () => {
    connected = true;
    attempt = 0;
    dispatch({ event: "ws_connected", data: null });
  });
  socket.addEventListener("close", () => {
    connected = false;
    dispatch({ event: "ws_disconnected", data: null });
    scheduleReconnect();
  });
  socket.addEventListener("error", () => {
    // Browsers intentionally don't surface error details; let close handle reconnect
  });
  socket.addEventListener("message", (e) => {
    let msg: WsEvent;
    try {
      msg = JSON.parse(e.data);
    } catch {
      return;
    }
    if (msg && typeof msg === "object" && "event" in msg) {
      dispatch(msg);
    }
  });
}

function scheduleReconnect(): void {
  if (reconnectTimer !== null) return;
  if (subscribers.size === 0) return; // nobody listening
  attempt += 1;
  const delay = Math.min(30_000, 1000 * 2 ** Math.min(attempt - 1, 5));
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    ensureConnection();
  }, delay);
}

export function disconnect(): void {
  if (reconnectTimer !== null) {
    window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (socket) {
    socket.close();
    socket = null;
  }
  connected = false;
}
