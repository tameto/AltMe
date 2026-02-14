import { OPENCLAW } from '@/src/config/constants';
import type {
  WsConnectPayload,
  WsIncomingMessage,
  WsOutgoingMessage,
  WsConnectionStatus,
} from '@/src/shared/types/openclaw';

type WebSocketClientOptions = {
  ipAddress: string;
  gatewayToken: string;
  deviceId: string;
  onTextDelta: (delta: string, sessionId: string) => void;
  onTextDone: (content: string, sessionId: string) => void;
  onConnected: (sessionId: string) => void;
  onError: (code: string, message: string) => void;
  onStatusChange: (status: WsConnectionStatus) => void;
};

export class OpenClawWebSocketClient {
  private ws: WebSocket | null = null;
  private options: WebSocketClientOptions;
  private sessionId: string | null = null;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isManualClose = false;

  constructor(options: WebSocketClientOptions) {
    this.options = options;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    this.isManualClose = false;
    this.options.onStatusChange('connecting');

    const url = `ws://${this.options.ipAddress}:${OPENCLAW.gatewayPort}`;
    this.ws = new WebSocket(url);

    const connectionTimeout = setTimeout(() => {
      if (this.ws?.readyState !== WebSocket.OPEN) {
        this.ws?.close();
        this.options.onError('CONNECTION_TIMEOUT', 'Connection timed out');
        this.scheduleReconnect();
      }
    }, OPENCLAW.connectionTimeoutMs);

    this.ws.onopen = () => {
      clearTimeout(connectionTimeout);
      this.sendConnectHandshake();
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data as string);
    };

    this.ws.onclose = () => {
      clearTimeout(connectionTimeout);
      if (!this.isManualClose) {
        this.options.onStatusChange('disconnected');
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      clearTimeout(connectionTimeout);
    };
  }

  disconnect(): void {
    this.isManualClose = true;
    this.clearReconnectTimer();
    this.reconnectAttempt = 0;
    this.sessionId = null;

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.options.onStatusChange('disconnected');
  }

  sendMessage(content: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.sessionId) {
      this.options.onError('NOT_CONNECTED', 'WebSocket is not connected');
      return;
    }

    const payload: WsOutgoingMessage = {
      type: 'message',
      content,
      sessionId: this.sessionId,
    };

    this.ws.send(JSON.stringify(payload));
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.sessionId !== null;
  }

  get currentSessionId(): string | null {
    return this.sessionId;
  }

  private sendConnectHandshake(): void {
    const payload: WsConnectPayload = {
      type: 'connect',
      params: {
        auth: { token: this.options.gatewayToken },
        deviceId: this.options.deviceId,
        clientType: 'mobile',
      },
    };

    this.ws?.send(JSON.stringify(payload));
  }

  private handleMessage(raw: string): void {
    let msg: WsIncomingMessage;
    try {
      msg = JSON.parse(raw) as WsIncomingMessage;
    } catch {
      return;
    }

    switch (msg.type) {
      case 'connected':
        this.sessionId = msg.sessionId;
        this.reconnectAttempt = 0;
        this.options.onStatusChange('connected');
        this.options.onConnected(msg.sessionId);
        break;

      case 'agent':
        if (msg.event === 'text_delta') {
          this.options.onTextDelta(msg.delta, msg.sessionId);
        } else if (msg.event === 'text_done') {
          this.options.onTextDone(msg.content, msg.sessionId);
        }
        break;

      case 'error':
        this.options.onError(msg.code, msg.message);
        if (msg.code === 'AUTH_FAILED') {
          this.disconnect();
        }
        break;
    }
  }

  private scheduleReconnect(): void {
    if (this.isManualClose) return;
    if (this.reconnectAttempt >= OPENCLAW.reconnect.maxAttempts) {
      this.options.onError('MAX_RECONNECT', 'Maximum reconnection attempts reached');
      this.options.onStatusChange('disconnected');
      return;
    }

    this.options.onStatusChange('reconnecting');

    const delay = Math.min(
      OPENCLAW.reconnect.initialDelayMs * Math.pow(2, this.reconnectAttempt),
      OPENCLAW.reconnect.maxDelayMs,
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempt++;
      this.connect();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
