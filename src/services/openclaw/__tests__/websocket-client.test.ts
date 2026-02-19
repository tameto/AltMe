/**
 * TDD-RED: OpenClaw WebSocket Client TLS/WSS Tests
 *
 * These tests define the expected behavior of TLS/WSS WebSocket connections
 * BEFORE implementation. Tests should FAIL initially (Red phase).
 *
 * SDD Spec: .sdd/specs/20260220-tls-wss/spec.md
 * FR-004: Mobile app MUST connect to wss://{ip}:443
 * FR-007: Fallback to ws:// for backward compatibility
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

describe('OpenClawWebSocketClient - TLS/WSS', () => {
  const defaultOptions = {
    ipAddress: '203.0.113.1',
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

  describe('TLS connection (FR-004)', () => {
    it('should connect using wss:// protocol', () => {
      const client = new OpenClawWebSocketClient(defaultOptions);
      client.connect();

      expect(mockWSInstances).toHaveLength(1);
      expect(mockWSInstances[0].url).toMatch(/^wss:\/\//);
    });

    it('should connect to port 443 instead of 18789', () => {
      const client = new OpenClawWebSocketClient(defaultOptions);
      client.connect();

      expect(mockWSInstances).toHaveLength(1);
      expect(mockWSInstances[0].url).toBe('wss://203.0.113.1:443');
    });

    it('should use OPENCLAW.wsPort constant for the port', () => {
      expect(OPENCLAW).toHaveProperty('wsPort');
      expect((OPENCLAW as any).wsPort).toBe(443);
    });
  });

  describe('Backward compatibility fallback (FR-007)', () => {
    it('should fall back to ws:// if wss:// connection fails', () => {
      const client = new OpenClawWebSocketClient(defaultOptions);
      client.connect();

      // Simulate wss:// connection failure
      const wssInstance = mockWSInstances[0];
      wssInstance.readyState = MockWebSocket.CLOSED;
      wssInstance.onerror?.();
      wssInstance.onclose?.();

      // Advance timers for reconnect
      jest.advanceTimersByTime(1500);

      // Should have attempted a second connection with ws:// fallback
      expect(mockWSInstances.length).toBeGreaterThanOrEqual(2);
      const fallbackInstance = mockWSInstances[mockWSInstances.length - 1];
      expect(fallbackInstance.url).toMatch(/^ws:\/\//);
      expect(fallbackInstance.url).toContain(':18789');
    });
  });

  describe('Successful TLS handshake', () => {
    it('should complete handshake over wss:// and send gateway_token encrypted', () => {
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

      // The URL should be wss:// (encrypted)
      expect(ws.url).toMatch(/^wss:\/\//);
    });
  });
});
