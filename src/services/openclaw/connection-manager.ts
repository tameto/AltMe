import { OpenClawWebSocketClient } from './websocket-client';

/**
 * Singleton connection manager for the OpenClaw WebSocket client.
 * Allows auth store and other services to disconnect without
 * holding a direct reference to the WS client.
 */
let activeClient: OpenClawWebSocketClient | null = null;

export const setActiveClient = (client: OpenClawWebSocketClient | null): void => {
  activeClient = client;
};

export const getActiveClient = (): OpenClawWebSocketClient | null => {
  return activeClient;
};

export const disconnectOpenClaw = (): void => {
  if (activeClient) {
    activeClient.disconnect();
    activeClient = null;
  }
};

export const isOpenClawConnected = (): boolean => {
  return activeClient?.isConnected ?? false;
};
