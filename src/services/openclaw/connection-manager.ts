import { OpenClawWebSocketClient } from './websocket-client';

/**
 * Singleton connection manager for the OpenClaw WebSocket client.
 * Allows auth store and other services to disconnect without
 * holding a direct reference to the WS client.
 */
let activeClient: OpenClawWebSocketClient | null = null;

/**
 * Wake the user's container via CF Worker /admin/status/{userId}.
 * Call this before establishing a WebSocket connection to pre-warm the container.
 * Returns true if the wake request was accepted.
 */
export const wakeContainer = async (
  cfWorkerUrl: string,
  userId: string,
  serviceKey: string,
): Promise<boolean> => {
  try {
    // cfWorkerUrl is already "https://..." so no need to add protocol
    const baseUrl = cfWorkerUrl.startsWith('http') ? cfWorkerUrl : `https://${cfWorkerUrl}`;
    const response = await fetch(`${baseUrl}/admin/status/${userId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch {
    return false;
  }
};

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
