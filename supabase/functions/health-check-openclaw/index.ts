import { corsHeaders } from '../_shared/cors.ts';
import { createServiceClient } from '../_shared/supabase.ts';

const DIGITALOCEAN_API_TOKEN = Deno.env.get('DIGITALOCEAN_API_TOKEN') ?? '';
const WEBSOCKET_PORT = 18789;
const WEBSOCKET_TIMEOUT_MS = 5_000;
const PROVISIONING_TIMEOUT_MS = 15 * 60 * 1_000;
const HEALTH_STALE_THRESHOLD_MS = 15 * 60 * 1_000;

type InstanceStatus = 'provisioning' | 'running' | 'stopped' | 'error' | 'destroying';

type Instance = {
  id: string;
  user_id: string;
  droplet_id: number | null;
  ip_address: string | null;
  gateway_token: string | null;
  status: InstanceStatus;
  last_health_check: string | null;
  created_at: string;
};

type CheckResult = {
  instanceId: string;
  userId: string;
  previousStatus: InstanceStatus;
  newStatus: InstanceStatus;
  healthy: boolean;
  message: string;
};

/**
 * Fetch Droplet info from the DigitalOcean API.
 * Returns the droplet object or null on failure.
 */
const fetchDroplet = async (dropletId: number): Promise<Record<string, unknown> | null> => {
  try {
    const res = await fetch(`https://api.digitalocean.com/v2/droplets/${dropletId}`, {
      headers: { Authorization: `Bearer ${DIGITALOCEAN_API_TOKEN}` },
    });
    if (!res.ok) {
      console.error(`DO API error for droplet ${dropletId}: ${res.status}`);
      return null;
    }
    const json = await res.json();
    return json.droplet ?? null;
  } catch (err) {
    console.error(`DO API fetch failed for droplet ${dropletId}:`, err);
    return null;
  }
};

/**
 * Extract the first public IPv4 address from a DigitalOcean droplet object.
 */
const extractIpAddress = (droplet: Record<string, unknown>): string | null => {
  const networks = droplet.networks as Record<string, unknown[]> | undefined;
  if (!networks?.v4) return null;
  const publicNet = (networks.v4 as Array<{ ip_address: string; type: string }>).find(
    (n) => n.type === 'public',
  );
  return publicNet?.ip_address ?? null;
};

/**
 * Attempt a WebSocket health check against an OpenClaw Gateway.
 * Connects, sends a connect handshake, waits for a "connected" response.
 * Resolves true if healthy, false otherwise.
 */
const wsHealthCheck = (ipAddress: string, gatewayToken: string): Promise<boolean> => {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (result: boolean, ws?: WebSocket) => {
      if (settled) return;
      settled = true;
      try {
        ws?.close();
      } catch {
        // ignore close errors
      }
      resolve(result);
    };

    const timeout = setTimeout(() => settle(false), WEBSOCKET_TIMEOUT_MS);

    try {
      const ws = new WebSocket(`ws://${ipAddress}:${WEBSOCKET_PORT}`);

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: 'connect',
            params: {
              auth: { token: gatewayToken },
              deviceId: 'health-check',
              clientType: 'mobile',
            },
          }),
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(String(event.data));
          if (data.type === 'connected') {
            clearTimeout(timeout);
            settle(true, ws);
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        settle(false, ws);
      };

      ws.onclose = () => {
        clearTimeout(timeout);
        settle(false);
      };
    } catch {
      clearTimeout(timeout);
      settle(false);
    }
  });
};

/**
 * Process a single instance health check.
 */
const checkInstance = async (
  instance: Instance,
  supabase: ReturnType<typeof createServiceClient>,
): Promise<CheckResult> => {
  const result: CheckResult = {
    instanceId: instance.id,
    userId: instance.user_id,
    previousStatus: instance.status,
    newStatus: instance.status,
    healthy: false,
    message: '',
  };

  // ---------- Provisioning instances ----------
  if (instance.status === 'provisioning') {
    const elapsed = Date.now() - new Date(instance.created_at).getTime();

    // Timeout check
    if (elapsed > PROVISIONING_TIMEOUT_MS) {
      result.newStatus = 'error';
      result.message = 'Provisioning timeout';
      await supabase
        .from('openclaw_instances')
        .update({ status: 'error', error_message: 'Provisioning timeout' })
        .eq('id', instance.id);
      return result;
    }

    // Check Droplet status via DigitalOcean API
    if (!instance.droplet_id) {
      result.message = 'No droplet_id yet, still provisioning';
      return result;
    }

    const droplet = await fetchDroplet(instance.droplet_id);
    if (!droplet) {
      result.message = 'Could not fetch droplet info from DigitalOcean';
      return result;
    }

    const dropletStatus = droplet.status as string;
    if (dropletStatus !== 'active') {
      result.message = `Droplet status: ${dropletStatus}, waiting`;
      return result;
    }

    // Droplet is active — resolve IP if missing
    let ipAddress = instance.ip_address;
    if (!ipAddress) {
      ipAddress = extractIpAddress(droplet);
    }

    if (!ipAddress || !instance.gateway_token) {
      result.message = 'Droplet active but IP or gateway_token missing';

      // Persist IP if we resolved it
      if (ipAddress && !instance.ip_address) {
        await supabase
          .from('openclaw_instances')
          .update({ ip_address: ipAddress })
          .eq('id', instance.id);
      }
      return result;
    }

    // Try WebSocket health check
    const healthy = await wsHealthCheck(ipAddress, instance.gateway_token);
    if (healthy) {
      result.healthy = true;
      result.newStatus = 'running';
      result.message = 'Provisioning complete, now running';
      await supabase
        .from('openclaw_instances')
        .update({
          status: 'running',
          ip_address: ipAddress,
          last_health_check: new Date().toISOString(),
          error_message: null,
        })
        .eq('id', instance.id);
    } else {
      result.message = 'Droplet active but WebSocket not ready yet';
    }

    return result;
  }

  // ---------- Running instances ----------
  if (instance.status === 'running') {
    let ipAddress = instance.ip_address;

    // Resolve IP from DigitalOcean if missing
    if (!ipAddress && instance.droplet_id) {
      const droplet = await fetchDroplet(instance.droplet_id);
      if (droplet) {
        ipAddress = extractIpAddress(droplet);
        if (ipAddress) {
          await supabase
            .from('openclaw_instances')
            .update({ ip_address: ipAddress })
            .eq('id', instance.id);
        }
      }
    }

    if (!ipAddress) {
      result.message = 'No IP address available';
      // Check staleness
      const lastCheck = instance.last_health_check
        ? new Date(instance.last_health_check).getTime()
        : 0;
      if (Date.now() - lastCheck > HEALTH_STALE_THRESHOLD_MS) {
        result.newStatus = 'error';
        result.message = 'No IP address and health check stale for over 15 minutes';
        await supabase
          .from('openclaw_instances')
          .update({ status: 'error', error_message: result.message })
          .eq('id', instance.id);
      }
      return result;
    }

    if (!instance.gateway_token) {
      result.message = 'No gateway_token configured';
      return result;
    }

    const healthy = await wsHealthCheck(ipAddress, instance.gateway_token);
    if (healthy) {
      result.healthy = true;
      result.message = 'Healthy';
      await supabase
        .from('openclaw_instances')
        .update({
          last_health_check: new Date().toISOString(),
          error_message: null,
        })
        .eq('id', instance.id);
    } else {
      result.message = 'WebSocket health check failed';

      // If last successful health check is older than threshold, mark as error
      const lastCheck = instance.last_health_check
        ? new Date(instance.last_health_check).getTime()
        : 0;
      if (Date.now() - lastCheck > HEALTH_STALE_THRESHOLD_MS) {
        result.newStatus = 'error';
        result.message = 'Consecutive health check failures for over 15 minutes';
        await supabase
          .from('openclaw_instances')
          .update({
            status: 'error',
            error_message: 'Health check failed for over 15 minutes',
          })
          .eq('id', instance.id);
      }
    }

    return result;
  }

  // Should not reach here given the query filter, but handle gracefully
  result.message = `Unexpected status: ${instance.status}`;
  return result;
};

/**
 * health-check-openclaw Edge Function
 * Triggered by Supabase pg_cron (every 5 minutes) or manual call.
 * Checks all OpenClaw instances with status 'running' or 'provisioning'.
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createServiceClient();

    // Fetch all instances that need health checking
    const { data: instances, error: queryError } = await supabase
      .from('openclaw_instances')
      .select('id, user_id, droplet_id, ip_address, gateway_token, status, last_health_check, created_at')
      .in('status', ['running', 'provisioning']);

    if (queryError) {
      console.error('Failed to query openclaw_instances:', queryError);
      return new Response(
        JSON.stringify({ error: 'query_failed', detail: queryError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!instances || instances.length === 0) {
      console.log('No instances to check');
      return new Response(
        JSON.stringify({ checked: 0, results: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log(`Checking ${instances.length} instance(s)`);

    // Process all instances in parallel
    const settled = await Promise.allSettled(
      instances.map((instance) => checkInstance(instance as Instance, supabase)),
    );

    const results: CheckResult[] = [];
    for (const outcome of settled) {
      if (outcome.status === 'fulfilled') {
        results.push(outcome.value);
      } else {
        console.error('Instance check threw:', outcome.reason);
      }
    }

    const summary = {
      checked: instances.length,
      healthy: results.filter((r) => r.healthy).length,
      unhealthy: results.filter((r) => !r.healthy).length,
      transitioned: results.filter((r) => r.previousStatus !== r.newStatus).length,
      results,
    };

    console.log(
      `Health check complete: ${summary.healthy} healthy, ${summary.unhealthy} unhealthy, ${summary.transitioned} transitioned`,
    );

    return new Response(
      JSON.stringify(summary),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Health check error:', error);
    return new Response(
      JSON.stringify({ error: 'internal_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
