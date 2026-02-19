import { OPENCLAW } from '@/src/config/constants';
import { supabase } from '@/src/services/supabase/client';
import type { DesiredState, OpenClawInstance, OpenClawStatus, RuntimeState } from '@/src/shared/types/openclaw';

/**
 * Fetch the current user's OpenClaw instance from the public view.
 * gateway_token is excluded on the client side (handled via Edge Function).
 */
export const getMyInstance = async (): Promise<OpenClawInstance | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('openclaw_instances_public')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch OpenClaw instance:', error.message);
    return null;
  }

  if (!data) return null;

  return mapToInstance(data);
};

/**
 * Get the gateway token for WebSocket connection.
 * This calls an Edge Function since gateway_token is not exposed via the public view.
 */
export const getGatewayToken = async (): Promise<string | null> => {
  const { data, error } = await supabase.functions.invoke('get-gateway-token');

  if (error) {
    console.error('Failed to get gateway token:', error.message);
    return null;
  }

  return data?.token ?? null;
};

/**
 * Request a restart of the user's OpenClaw instance.
 */
export const restartInstance = async (): Promise<{ success: boolean; error?: string }> => {
  const { data, error } = await supabase.functions.invoke('restart-openclaw');

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: data?.success ?? false, error: data?.error };
};

/**
 * Request SOUL.md regeneration (after twin name change or personality re-diagnosis).
 */
export const updateSoulMd = async (): Promise<{ success: boolean; error?: string }> => {
  const { data, error } = await supabase.functions.invoke('update-soul-md');

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: data?.success ?? false, error: data?.error };
};

/**
 * Subscribe to real-time changes on the user's OpenClaw instance.
 */
export const subscribeToInstanceChanges = (
  userId: string,
  onUpdate: (instance: OpenClawInstance) => void,
) => {
  const channel = supabase
    .channel(`openclaw-instance-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'openclaw_instances',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onUpdate(mapToInstance(payload.new));
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Get the WebSocket URL for the user's OpenClaw instance.
 * Returns CF Worker URL if available, falls back to IP-based URL.
 */
export const getWebSocketUrl = (instance: OpenClawInstance): string | null => {
  if (instance.cfWorkerUrl) {
    return instance.cfWorkerUrl;
  }
  // Legacy fallback (should not be needed after migration)
  if (instance.ipAddress) {
    return `wss://${instance.ipAddress}:${OPENCLAW.wsPort}`;
  }
  return null;
};

// Map DB snake_case to camelCase
const mapToInstance = (row: Record<string, unknown>): OpenClawInstance => ({
  id: row.id as string,
  userId: row.user_id as string,
  dropletId: (row.droplet_id as number) ?? null,
  ipAddress: (row.ip_address as string) ?? null,
  status: row.status as OpenClawStatus,
  infraProvider: (row.infra_provider as string) ?? 'cloudflare',
  containerName: (row.container_name as string) ?? null,
  desiredState: (row.desired_state as DesiredState) ?? 'active',
  runtimeState: (row.runtime_state as RuntimeState) ?? 'cold',
  soulVersion: (row.soul_version as number) ?? 1,
  cfWorkerUrl: (row.cf_worker_url as string) ?? null,
  region: row.region as string,
  dropletSize: row.droplet_size as string,
  soulMd: (row.soul_md as string) ?? null,
  lastHealthCheck: (row.last_health_check as string) ?? null,
  lastWakeAt: (row.last_wake_at as string) ?? null,
  errorMessage: (row.error_message as string) ?? null,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
});
