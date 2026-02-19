/**
 * OpenClaw WebSocket Client - Cloudflare Worker Proxy Tests
 *
 * Tests for CF Worker proxy connection behavior.
 * Before: wss://{ip}:443 with TLS fallback
 * After: wss://{cfWorkerUrl}/ws/{userId} (TLS provided by Cloudflare)
 *
 * SDD Spec: specs/features/chat.md
 */

import { OpenClawWebSocketClient } from '../websocket-client';
import { OPENCLAW } from '@/src/config/constants';

// ---- Mock WebSocket ----

type MockWSInstance = {
  url: string;
  readyState: number;
  onopen: (() => void) | null;
  onclose: (() => void) | null;
  onmessage: ((event: { data: string }) => void) | null;
  onerror: (() => void) | null;
  send: jest.Mock;
  close: jest.Mock;
};

let mockWSInstances: MockWSInstance[] = [];

class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  url: string;
  readyState = MockWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  send = jest.fn();
  close = jest.fn(() => {
    this.readyState = MockWebSocket.CLOSED;
  });

  constructor(url: string) {
    this.url = url;
    mockWSInstances.push(this as unknown as MockWSInstance);
  }
}

// Replace global WebSocket
(global as any).WebSocket = MockWebSocket;

describe('OpenClawWebSocketClient - CF Worker Proxy', () => {
  const defaultOptions = {
    cfWorkerUrl: 'my-worker.workers.dev',
    userId: 'user-123',
    gatewayToken: 'test-token-uuid',
    deviceId: 'test-device-id',
    onTextDelta: jest.fn(),
    onTextDone: jest.fn(),
    onConnected: jest.fn(),
    onError: jest.fn(),
    onStatusChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockWSInstances = [];
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('CF Worker WSS connection', () => {
    it('should connect using wss:// protocol', () => {
      const client = new OpenClawWebSocketClient(defaultOptions);
      client.connect();

      expect(mockWSInstances).toHaveLength(1);
      expect(mockWSInstances[0].url).toMatch(/^wss:\/\//);
    });

    it('should connect to the CF Worker URL with /ws/{userId} path', () => {
      const client = new OpenClawWebSocketClient(defaultOptions);
      client.connect();

      expect(mockWSInstances).toHaveLength(1);
      expect(mockWSInstances[0].url).toBe('wss://my-worker.workers.dev/ws/user-123');
    });

    it('should use coldStartTimeoutMs constant', () => {
      expect(OPENCLAW).toHaveProperty('coldStartTimeoutMs');
      expect((OPENCLAW as any).coldStartTimeoutMs).toBe(8000);
    });

    it('should use coldStartWarningMs constant', () => {
      expect(OPENCLAW).toHaveProperty('coldStartWarningMs');
      expect((OPENCLAW as any).coldStartWarningMs).toBe(5000);
    });
  });

  describe('No TLS fallback', () => {
    it('should not fall back to ws:// if connection fails', () => {
      const client = new OpenClawWebSocketClient(defaultOptions);
      client.connect();

      // Simulate connection failure
      const wsInstance = mockWSInstances[0];
      wsInstance.readyState = MockWebSocket.CLOSED;
      wsInstance.onerror?.();
      wsInstance.onclose?.();

      // Advance timers for reconnect
      jest.advanceTimersByTime(1500);

      // Reconnect should still use wss://
      expect(mockWSInstances.length).toBeGreaterThanOrEqual(2);
      const reconnectedInstance = mockWSInstances[mockWSInstances.length - 1];
      expect(reconnectedInstance.url).toMatch(/^wss:\/\//);
      expect(reconnectedInstance.url).not.toMatch(/^ws:\/\//);
    });
  });

  describe('Successful handshake via CF Worker', () => {
    it('should complete handshake over wss:// and send gateway_token', () => {
      const client = new OpenClawWebSocketClient(defaultOptions);
      client.connect();

      const ws = mockWSInstances[0];
      ws.readyState = MockWebSocket.OPEN;
      ws.onopen?.();

      // Verify handshake was sent over the wss:// connection
      expect(ws.send).toHaveBeenCalledTimes(1);
      const handshake = JSON.parse(ws.send.mock.calls[0][0]);
      expect(handshake.type).toBe('connect');
      expect(handshake.params.auth.token).toBe('test-token-uuid');

      // The URL should be wss:// (TLS provided by Cloudflare)
      expect(ws.url).toMatch(/^wss:\/\//);
    });
  });
});
