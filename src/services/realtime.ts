export type RealtimeEventType =
  | 'CALL_CREATED'
  | 'CALL_ATTENDING'
  | 'CALL_RESOLVED'
  | 'CALL_CANCELLED'
  | 'SESSION_STARTED'
  | 'SESSION_CLOSED';

export interface RealtimeEvent<T = any> {
  type: RealtimeEventType;
  payload: T;
  timestamp: number;
}

export interface RealtimeOptions {
  wsUrl?: string;
  enableBroadcastChannel?: boolean;
}

export class RealtimeService {
  private channel: BroadcastChannel | null = null;
  private ws: WebSocket | null = null;
  private listeners = new Set<(event: RealtimeEvent) => void>();
  private wsUrl?: string;

  constructor(options: RealtimeOptions = {}) {
    this.wsUrl = options.wsUrl;

    // 1. BroadcastChannel setup for local multi-tab / PWA offline synchronization
    if (
      options.enableBroadcastChannel !== false &&
      typeof window !== 'undefined' &&
      typeof BroadcastChannel !== 'undefined'
    ) {
      try {
        this.channel = new BroadcastChannel('bar_flow_realtime');
        this.channel.onmessage = (e) => {
          if (e.data && e.data.type) {
            this.notifyListeners(e.data, false);
          }
        };
      } catch {
        this.channel = null;
      }
    }

    // 2. Optional WebSocket setup if wsUrl is provided
    if (this.wsUrl && typeof WebSocket !== 'undefined') {
      this.initWebSocket();
    }
  }

  private initWebSocket() {
    if (!this.wsUrl) return;

    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.type) {
            this.notifyListeners(parsed, false);
          }
        } catch {
          // ignore non-json messages
        }
      };

      this.ws.onclose = () => {
        // Auto-reconnect after 3s
        setTimeout(() => this.initWebSocket(), 3000);
      };
    } catch {
      // WS connection failure fallback
    }
  }

  public publish(event: RealtimeEvent): void {
    // 1. Notify local subscribers in this tab
    this.notifyListeners(event, true);

    // 2. Broadcast to other tabs/windows via BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage(event);
      } catch {
        // Channel failed
      }
    }

    // 3. Send to remote WebSocket if active
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(event));
      } catch {
        // WS send failed
      }
    }
  }

  public subscribe(listener: (event: RealtimeEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(event: RealtimeEvent, _isOrigin: boolean): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in realtime listener callback:', err);
      }
    });
  }

  public close(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }
}

// Global runtime singleton
export const realtimeService = new RealtimeService({
  wsUrl: typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_WS_URL : undefined,
  enableBroadcastChannel: true,
});
