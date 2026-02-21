/**
 * M086: WebSocket Web 動作テスト
 * - ブラウザ WebSocket 接続 / ハンドシェイク / デルタ受信 / 完了受信
 * - エラー / 再接続 / フォールバック
 * - visibilitychange / beforeunload
 * - sendMessage / isConnected
 */

import { OpenClawWebSocketClient } from '../websocket-client';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).WebSocket = MockWebSocket;

// Helper: simulate full connection handshake
function connectAndHandshake(client: OpenClawWebSocketClient): MockWSInstance {
  client.connect();
  const ws = mockWSInstances[mockWSInstances.length - 1];
  ws.readyState = MockWebSocket.OPEN;
  ws.onopen?.();
  // Simulate server connected response
  ws.onmessage?.({
    data: JSON.stringify({ type: 'connected', sessionId: 'sess-1', serverVersion: '1.0' }),
  });
  return ws;
}

describe('M086: WebSocket Web 動作テスト', () => {
  const defaultOptions = {
    cfWorkerUrl: 'https://worker.example.dev',
    userId: 'user-web-1',
    gatewayToken: 'tok-web-abc',
    deviceId: 'browser-device-1',
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

  // ---- 接続 ----

  it('cfWorkerUrl から http(s) プレフィックスを除去して wss:// で接続する', () => {
    const client = new OpenClawWebSocketClient(defaultOptions);
    client.connect();
    expect(mockWSInstances[0].url).toBe('wss://worker.example.dev/ws/user-web-1');
  });

  it('接続開始時に onStatusChange("connecting") が呼ばれる', () => {
    const client = new OpenClawWebSocketClient(defaultOptions);
    client.connect();
    expect(defaultOptions.onStatusChange).toHaveBeenCalledWith('connecting');
  });

  it('既に接続中のとき connect() を再度呼んでも二重接続しない', () => {
    const client = new OpenClawWebSocketClient(defaultOptions);
    client.connect();
    const ws = mockWSInstances[0];
    ws.readyState = MockWebSocket.OPEN;
    client.connect(); // should be no-op
    expect(mockWSInstances).toHaveLength(1);
  });

  // ---- ハンドシェイク ----

  it('onopen で connect ハンドシェイクが送信される', () => {
    const client = new OpenClawWebSocketClient(defaultOptions);
    client.connect();
    const ws = mockWSInstances[0];
    ws.readyState = MockWebSocket.OPEN;
    ws.onopen?.();

    expect(ws.send).toHaveBeenCalledTimes(1);
    const handshake = JSON.parse(ws.send.mock.calls[0][0]);
    expect(handshake.type).toBe('connect');
    expect(handshake.params.auth.token).toBe('tok-web-abc');
    expect(handshake.params.deviceId).toBe('browser-device-1');
  });

  it('connected メッセージ受信で onConnected と onStatusChange("connected") が呼ばれる', () => {
    const client = new OpenClawWebSocketClient(defaultOptions);
    connectAndHandshake(client);

    expect(defaultOptions.onConnected).toHaveBeenCalledWith('sess-1');
    expect(defaultOptions.onStatusChange).toHaveBeenCalledWith('connected');
    expect(client.isConnected).toBe(true);
    expect(client.currentSessionId).toBe('sess-1');
  });

  // ---- テキストデルタ受信 ----

  it('text_delta メッセージで onTextDelta が呼ばれる', () => {
    const client = new OpenClawWebSocketClient(defaultOptions);
    const ws = connectAndHandshake(client);

    ws.onmessage?.({
      data: JSON.stringify({ type: 'agent', event: 'text_delta', delta: 'Hello ', sessionId: 'sess-1' }),
    });
    ws.onmessage?.({
      data: JSON.stringify({ type: 'agent', event: 'text_delta', delta: 'World', sessionId: 'sess-1' }),
    });

    expect(defaultOptions.onTextDelta).toHaveBeenCalledTimes(2);
    expect(defaultOptions.onTextDelta).toHaveBeenCalledWith('Hello ', 'sess-1');
    expect(defaultOptions.onTextDelta).toHaveBeenCalledWith('World', 'sess-1');
  });

  // ---- テキスト完了受信 ----

  it('text_done メッセージで onTextDone が呼ばれる', () => {
    const client = new OpenClawWebSocketClient(defaultOptions);
    const ws = connectAndHandshake(client);

    ws.onmessage?.({
      data: JSON.stringify({ type: 'agent', event: 'text_done', content: 'Hello World', sessionId: 'sess-1' }),
    });

    expect(defaultOptions.onTextDone).toHaveBeenCalledWith('Hello World', 'sess-1');
  });

  // ---- sendMessage ----

  it('sendMessage でメッセージが JSON として送信される', () => {
    const client = new OpenClawWebSocketClient(defaultOptions);
    const ws = connectAndHandshake(client);

    client.sendMessage('こんにちは');

    expect(ws.send).toHaveBeenCalledTimes(2); // handshake + message
    const msg = JSON.parse(ws.send.mock.calls[1][0]);
    expect(msg.type).toBe('message');
    expect(msg.content).toBe('こんにちは');
    expect(msg.sessionId).toBe('sess-1');
  });

  it('未接続時の sendMessage で onError が呼ばれる', () => {
    const client = new OpenClawWebSocketClient(defaultOptions);
    client.sendMessage('test');
    expect(defaultOptions.onError).toHaveBeenCalledWith('NOT_CONNECTED', expect.any(String));
  });

  // ---- エラーハンドリング ----

  it('server error メッセージで onError が呼ばれる', () => {
    const client = new OpenClawWebSocketClient(defaultOptions);
    const ws = connectAndHandshake(client);

    ws.onmessage?.({
      data: JSON.stringify({ type: 'error', code: 'RATE_LIMITED', message: 'Too many requests' }),
    });

    expect(defaultOptions.onError).toHaveBeenCalledWith('RATE_LIMITED', 'Too many requests');
  });

  it('AUTH_FAILED エラーで disconnect が呼ばれる', () => {
    const client = new OpenClawWebSocketClient(defaultOptions);
    const ws = connectAndHandshake(client);

    ws.onmessage?.({
      data: JSON.stringify({ type: 'error', code: 'AUTH_FAILED', message: 'Invalid token' }),
    });

    expect(defaultOptions.onError).toHaveBeenCalledWith('AUTH_FAILED', 'Invalid token');
    expect(client.isConnected).toBe(false);
  });

  it('不正な JSON メッセージは無視される', () => {
    const client = new OpenClawWebSocketClient(defaultOptions);
    const ws = connectAndHandshake(client);

    // Should not throw
    ws.onmessage?.({ data: 'not-json' });
    expect(defaultOptions.onError).not.toHaveBeenCalled();
  });

  // ---- 再接続 ----

  it('接続断で再接続がスケジュールされる', () => {
    const client = new OpenClawWebSocketClient(defaultOptions);
    client.connect();
    const ws = mockWSInstances[0];
    ws.readyState = MockWebSocket.CLOSED;
    ws.onclose?.();

    expect(defaultOptions.onStatusChange).toHaveBeenCalledWith('reconnecting');

    // Advance past initial delay (1000ms)
    jest.advanceTimersByTime(1500);

    // New connection attempt should exist
    expect(mockWSInstances.length).toBeGreaterThanOrEqual(2);
  });

  it('手動 disconnect 後は再接続しない', () => {
    const client = new OpenClawWebSocketClient(defaultOptions);
    connectAndHandshake(client);

    client.disconnect();
    const instanceCountAfterDisconnect = mockWSInstances.length;

    // Advance timers - should not create new connections
    jest.advanceTimersByTime(60000);

    expect(mockWSInstances.length).toBe(instanceCountAfterDisconnect);
  });

  it('再接続は指数バックオフで遅延する', () => {
    const client = new OpenClawWebSocketClient(defaultOptions);
    client.connect();

    // First failure
    const ws1 = mockWSInstances[0];
    ws1.readyState = MockWebSocket.CLOSED;
    ws1.onclose?.();

    // First reconnect after 1000ms
    jest.advanceTimersByTime(1100);
    expect(mockWSInstances).toHaveLength(2);

    // Second failure
    const ws2 = mockWSInstances[1];
    ws2.readyState = MockWebSocket.CLOSED;
    ws2.onclose?.();

    // Second reconnect after 2000ms (not 1000ms)
    jest.advanceTimersByTime(1500);
    expect(mockWSInstances).toHaveLength(2); // Not yet
    jest.advanceTimersByTime(1000);
    expect(mockWSInstances).toHaveLength(3); // Now
  });

  // ---- 接続タイムアウト ----

  it('接続タイムアウトで CONNECTION_TIMEOUT エラーが発生する', () => {
    const client = new OpenClawWebSocketClient(defaultOptions);
    client.connect();

    // Never call onopen - simulate timeout
    jest.advanceTimersByTime(11000); // > connectionTimeoutMs (10000)

    expect(defaultOptions.onError).toHaveBeenCalledWith('CONNECTION_TIMEOUT', expect.any(String));
  });

  // ---- disconnect ----

  it('disconnect で WebSocket が閉じられ状態がリセットされる', () => {
    const client = new OpenClawWebSocketClient(defaultOptions);
    const ws = connectAndHandshake(client);

    client.disconnect();

    expect(ws.close).toHaveBeenCalled();
    expect(client.isConnected).toBe(false);
    expect(client.currentSessionId).toBeNull();
    expect(defaultOptions.onStatusChange).toHaveBeenCalledWith('disconnected');
  });
});
