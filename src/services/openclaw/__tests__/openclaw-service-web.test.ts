/**
 * M135: OpenClaw service tests (client, websocket-client, connection-manager)
 *
 * Tests for OpenClaw client functions, WebSocket client lifecycle,
 * and connection manager singleton behavior.
 */

// Mock supabase before imports
jest.mock('@/src/services/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
      }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
    functions: {
      invoke: jest.fn().mockResolvedValue({ data: { success: true }, error: null }),
    },
    channel: jest.fn().mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
    }),
    removeChannel: jest.fn(),
  },
}));

jest.mock('@/src/config/constants', () => ({
  OPENCLAW: {
    wsPort: 18789,
    connectionTimeoutMs: 10000,
    coldStartTimeoutMs: 8000,
    coldStartWarningMs: 5000,
    reconnect: {
      maxAttempts: 5,
      initialDelayMs: 1000,
      maxDelayMs: 30000,
    },
  },
}));

import { supabase } from '@/src/services/supabase/client';
import {
  getMyInstance,
  getGatewayToken,
  restartInstance,
  updateSoulMd,
  subscribeToInstanceChanges,
  getWebSocketUrl,
} from '../client';
import {
  setActiveClient,
  getActiveClient,
  disconnectOpenClaw,
  isOpenClawConnected,
  wakeContainer,
} from '../connection-manager';
import { OpenClawWebSocketClient } from '../websocket-client';

describe('M135: OpenClaw client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMyInstance', () => {
    it('returns null when user is not authenticated', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
        data: { user: null },
      });
      const result = await getMyInstance();
      expect(result).toBeNull();
    });

    it('returns null when no instance exists', async () => {
      const result = await getMyInstance();
      expect(result).toBeNull();
    });

    it('returns mapped instance when data exists', async () => {
      const mockRow = {
        id: 'inst-1',
        user_id: 'user-1',
        droplet_id: 123,
        ip_address: '1.2.3.4',
        status: 'active',
        infra_provider: 'cloudflare',
        container_name: 'test',
        desired_state: 'active',
        runtime_state: 'healthy',
        soul_version: 2,
        cf_worker_url: 'https://worker.dev',
        region: 'nyc1',
        droplet_size: 's-1vcpu-1gb',
        soul_md: 'test soul',
        last_health_check: '2024-01-01T00:00:00Z',
        last_wake_at: null,
        error_message: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: mockRow, error: null }),
          }),
        }),
      });

      const result = await getMyInstance();
      expect(result).not.toBeNull();
      expect(result?.id).toBe('inst-1');
      expect(result?.runtimeState).toBe('healthy');
      expect(result?.cfWorkerUrl).toBe('https://worker.dev');
    });
  });

  describe('getGatewayToken', () => {
    it('returns token from Edge Function', async () => {
      (supabase.functions.invoke as jest.Mock).mockResolvedValueOnce({
        data: { token: 'gw-token-123' },
        error: null,
      });
      const token = await getGatewayToken();
      expect(token).toBe('gw-token-123');
    });

    it('returns null on error', async () => {
      (supabase.functions.invoke as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { message: 'Failed' },
      });
      const token = await getGatewayToken();
      expect(token).toBeNull();
    });
  });

  describe('restartInstance', () => {
    it('returns success on successful restart', async () => {
      const result = await restartInstance();
      expect(result.success).toBe(true);
    });

    it('returns error on failure', async () => {
      (supabase.functions.invoke as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { message: 'Restart failed' },
      });
      const result = await restartInstance();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Restart failed');
    });
  });

  describe('updateSoulMd', () => {
    it('returns success on successful update', async () => {
      const result = await updateSoulMd();
      expect(result.success).toBe(true);
    });
  });

  describe('subscribeToInstanceChanges', () => {
    it('subscribes to real-time changes and returns unsubscribe fn', () => {
      const onUpdate = jest.fn();
      const unsub = subscribeToInstanceChanges('user-1', onUpdate);
      expect(supabase.channel).toHaveBeenCalledWith('openclaw-instance-user-1');
      expect(typeof unsub).toBe('function');
    });
  });

  describe('getWebSocketUrl', () => {
    it('returns CF Worker URL when available', () => {
      const instance = {
        cfWorkerUrl: 'https://worker.dev',
        ipAddress: '1.2.3.4',
      } as Parameters<typeof getWebSocketUrl>[0];
      expect(getWebSocketUrl(instance)).toBe('https://worker.dev');
    });

    it('falls back to IP-based URL', () => {
      const instance = {
        cfWorkerUrl: null,
        ipAddress: '1.2.3.4',
      } as Parameters<typeof getWebSocketUrl>[0];
      const url = getWebSocketUrl(instance);
      expect(url).toContain('1.2.3.4');
    });

    it('returns null when no URL available', () => {
      const instance = {
        cfWorkerUrl: null,
        ipAddress: null,
      } as Parameters<typeof getWebSocketUrl>[0];
      expect(getWebSocketUrl(instance)).toBeNull();
    });
  });
});

describe('M135: Connection manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setActiveClient(null);
  });

  it('getActiveClient returns null when no client set', () => {
    expect(getActiveClient()).toBeNull();
  });

  it('setActiveClient stores the client', () => {
    const mockClient = { disconnect: jest.fn(), isConnected: true } as unknown as OpenClawWebSocketClient;
    setActiveClient(mockClient);
    expect(getActiveClient()).toBe(mockClient);
  });

  it('disconnectOpenClaw calls disconnect and clears client', () => {
    const mockDisconnect = jest.fn();
    const mockClient = { disconnect: mockDisconnect, isConnected: true } as unknown as OpenClawWebSocketClient;
    setActiveClient(mockClient);

    disconnectOpenClaw();
    expect(mockDisconnect).toHaveBeenCalled();
    expect(getActiveClient()).toBeNull();
  });

  it('disconnectOpenClaw does nothing when no active client', () => {
    expect(() => disconnectOpenClaw()).not.toThrow();
  });

  it('isOpenClawConnected returns false when no client', () => {
    expect(isOpenClawConnected()).toBe(false);
  });

  it('isOpenClawConnected returns client.isConnected value', () => {
    const mockClient = { isConnected: true } as unknown as OpenClawWebSocketClient;
    setActiveClient(mockClient);
    expect(isOpenClawConnected()).toBe(true);
  });

  describe('wakeContainer', () => {
    it('sends POST to CF Worker admin endpoint', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true });
      const result = await wakeContainer('https://worker.dev', 'user-1', 'key-123');
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://worker.dev/admin/status/user-1',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('returns false on fetch error', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      const result = await wakeContainer('https://worker.dev', 'user-1', 'key-123');
      expect(result).toBe(false);
    });

    it('adds https:// prefix when missing', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true });
      await wakeContainer('worker.dev', 'user-1', 'key-123');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://worker.dev/admin/status/user-1',
        expect.any(Object),
      );
    });
  });
});
