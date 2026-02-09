import type { OutgoingMessage, IncomingMessage } from "./messages";

export type SocketStatus = "disconnected" | "connecting" | "connected" | "error";
export type MessageCallback = (msg: IncomingMessage) => void;

const RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_ATTEMPTS = 5;
const HEARTBEAT_INTERVAL_MS = 15000;

class SocketManager {
  private ws: WebSocket | null = null;
  private url: string = "";
  private listeners: Set<MessageCallback> = new Set();
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  status: SocketStatus = "disconnected";

  connect(url: string): void {
    this.url = url;
    this.status = "connecting";
    this.reconnectAttempts = 0;
    this.createSocket();
  }

  disconnect(): void {
    this.clearTimers();
    this.reconnectAttempts = MAX_RECONNECT_ATTEMPTS; // prevent auto-reconnect
    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }
    this.status = "disconnected";
  }

  send(msg: OutgoingMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      console.warn("[Socket] Cannot send, not connected:", msg.type);
    }
  }

  onMessage(cb: MessageCallback): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private createSocket(): void {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log("[Socket] Connected to", this.url);
        this.status = "connected";
        this.reconnectAttempts = 0;
        this.startHeartbeat();
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data as string) as IncomingMessage;
          for (const cb of this.listeners) {
            cb(msg);
          }
        } catch (err) {
          console.error("[Socket] Failed to parse message:", err);
        }
      };

      this.ws.onclose = (event) => {
        console.log("[Socket] Closed:", event.code, event.reason);
        this.status = "disconnected";
        this.clearTimers();
        this.attemptReconnect();
      };

      this.ws.onerror = () => {
        console.error("[Socket] Error");
        this.status = "error";
      };
    } catch (err) {
      console.error("[Socket] Failed to create WebSocket:", err);
      this.status = "error";
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log("[Socket] Max reconnect attempts reached");
      return;
    }
    this.reconnectAttempts++;
    console.log(
      `[Socket] Reconnecting (${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`
    );
    this.reconnectTimer = setTimeout(() => {
      this.status = "connecting";
      this.createSocket();
    }, RECONNECT_DELAY_MS);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "ping" }));
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}

export const socket = new SocketManager();
