// OpenClaw Instance
// 仕様書: specs/features/openclaw-provisioning.md, specs/features/chat.md

export type OpenClawStatus = 'provisioning' | 'running' | 'stopped' | 'error' | 'destroying';

export type DesiredState = 'active' | 'suspended' | 'deleting';
export type RuntimeState = 'cold' | 'waking' | 'healthy' | 'sleeping' | 'error';

export type OpenClawInstance = {
  id: string;
  userId: string;
  dropletId: number | null;
  ipAddress: string | null;
  status: OpenClawStatus;
  infraProvider: string;
  containerName: string | null;
  desiredState: DesiredState;
  runtimeState: RuntimeState;
  soulVersion: number;
  cfWorkerUrl: string | null;
  region: string;
  dropletSize: string;
  soulMd: string | null;
  lastHealthCheck: string | null;
  lastWakeAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

// WebSocket message types (specs/features/chat.md#WebSocket接続仕様)

export type WsConnectPayload = {
  type: 'connect';
  params: {
    auth: { token: string };
    deviceId: string;
    clientType: 'mobile';
  };
};

export type WsConnectedEvent = {
  type: 'connected';
  sessionId: string;
  serverVersion: string;
};

export type WsMessagePayload = {
  type: 'message';
  content: string;
  sessionId: string;
};

export type WsAgentTextDelta = {
  type: 'agent';
  event: 'text_delta';
  delta: string;
  sessionId: string;
};

export type WsAgentTextDone = {
  type: 'agent';
  event: 'text_done';
  content: string;
  sessionId: string;
};

export type WsErrorEvent = {
  type: 'error';
  code: string;
  message: string;
  retryAfter?: number;
};

export type WsIncomingMessage =
  | WsConnectedEvent
  | WsAgentTextDelta
  | WsAgentTextDone
  | WsErrorEvent;

export type WsOutgoingMessage =
  | WsConnectPayload
  | WsMessagePayload;

// Connection state for Zustand store
export type WsConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'waking';

export type ConnectionMode = 'websocket' | 'edge_function' | 'disconnected';
