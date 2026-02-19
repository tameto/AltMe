import { corsHeaders } from '../_shared/cors.ts';
import { createServiceClient } from '../_shared/supabase.ts';

type DesiredState = 'active' | 'suspended' | 'deleting';
type RuntimeState = 'cold' | 'waking' | 'healthy' | 'sleeping' | 'error';

type Instance = {
  id: string;
  user_id: string;
  desired_state: DesiredState;
  runtime_state: RuntimeState;
  cf_worker_url: string | null;
  gateway_token: string | null;
  last_health_check: string | null;
  created_at: string;
};

type CheckResult = {
  instanceId: string;
  userId: string;
  previousRuntimeState: RuntimeState;
  newRuntimeState: RuntimeState;
  healthy: boolean;
  message: string;
};

/**
 * Query CF Worker /admin/status/{userId} and return the parsed runtime state.
 * Returns null if the request fails or the response is unparseable.
 */
const fetchCfStatus = async (
  cfWorkerUrl: string,
  userId: string,
  serviceRoleKey: string,
): Promise<{ runtimeState: RuntimeState; healthy: boolean } | null> => {
  const statusUrl = `${cfWorkerUrl}/admin/status/${userId}`;

  try {
    const resp = await fetch(statusUrl, {
      headers: { Authorization: `Bearer ${serviceRoleKey}` },
    });

    if (!resp.ok) {
      console.error(`CF Worker status check failed (${resp.status}) for user ${userId}`);
      return null;
    }

    const json = await resp.json() as Record<string, unknown>;

    // Map CF Worker response to our runtime_state values.
    // Expected response shape: { status: 'running' | 'stopped' | 'sleeping' | 'waking' | ... }
    const cfStatus = String(json.status ?? '');
    let runtimeState: RuntimeState;
    let healthy = false;

    switch (cfStatus) {
      case 'running':
        runtimeState = 'healthy';
        healthy = true;
        break;
      case 'waking':
        runtimeState = 'waking';
        break;
      case 'sleeping':
        runtimeState = 'sleeping';
        break;
      case 'stopped':
      case 'cold':
        runtimeState = 'cold';
        break;
      default:
        runtimeState = 'error';
    }

    return { runtimeState, healthy };
  } catch (err) {
    console.error(`CF Worker status fetch error for user ${userId}:`, err);
    return null;
  }
};

/**
 * Process a single instance health check against Cloudflare Worker.
 */
const checkInstance = async (
  instance: Instance,
  supabase: ReturnType<typeof createServiceClient>,
  serviceRoleKey: string,
): Promise<CheckResult> => {
  const result: CheckResult = {
    instanceId: instance.id,
    userId: instance.user_id,
    previousRuntimeState: instance.runtime_state,
    newRuntimeState: instance.runtime_state,
    healthy: false,
    message: '',
  };

  if (!instance.cf_worker_url) {
    result.message = 'No cf_worker_url configured';
    result.newRuntimeState = 'error';
    await supabase
      .from('openclaw_instances')
      .update({ runtime_state: 'error' })
      .eq('id', instance.id);
    return result;
  }

  const statusResult = await fetchCfStatus(
    instance.cf_worker_url,
    instance.user_id,
    serviceRoleKey,
  );

  if (!statusResult) {
    // CF Worker unreachable — mark as error if stale
    result.message = 'CF Worker status check failed';
    const HEALTH_STALE_THRESHOLD_MS = 15 * 60 * 1_000;
    const lastCheck = instance.last_health_check
      ? new Date(instance.last_health_check).getTime()
      : 0;

    if (Date.now() - lastCheck > HEALTH_STALE_THRESHOLD_MS) {
      result.newRuntimeState = 'error';
      result.message = 'CF Worker unreachable for over 15 minutes';
      await supabase
        .from('openclaw_instances')
        .update({ runtime_state: 'error' })
        .eq('id', instance.id);
    }
    return result;
  }

  result.healthy = statusResult.healthy;
  result.newRuntimeState = statusResult.runtimeState;
  result.message = `CF status: ${statusResult.runtimeState}`;

  // Update runtime_state and last_health_check in DB
  const updatePayload: Record<string, string> = {
    runtime_state: statusResult.runtimeState,
  };
  if (statusResult.healthy) {
    updatePayload.last_health_check = new Date().toISOString();
  }

  await supabase
    .from('openclaw_instances')
    .update(updatePayload)
    .eq('id', instance.id);

  return result;
};

/**
 * health-check-openclaw Edge Function
 * Triggered by Supabase pg_cron (every 5 minutes) or manual call.
 * Checks all OpenClaw instances with desired_state = 'active'.
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createServiceClient();
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Fetch all active instances (infra_provider = 'cloudflare' only)
    const { data: instances, error: queryError } = await supabase
      .from('openclaw_instances')
      .select(
        'id, user_id, desired_state, runtime_state, cf_worker_url, gateway_token, last_health_check, created_at',
      )
      .eq('desired_state', 'active')
      .eq('infra_provider', 'cloudflare');

    if (queryError) {
      console.error('Failed to query openclaw_instances:', queryError);
      return new Response(
        JSON.stringify({ error: 'query_failed', detail: queryError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!instances || instances.length === 0) {
      console.log('No active Cloudflare instances to check');
      return new Response(
        JSON.stringify({ checked: 0, results: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log(`Checking ${instances.length} Cloudflare instance(s)`);

    // Process all instances in parallel
    const settled = await Promise.allSettled(
      instances.map((instance) =>
        checkInstance(instance as Instance, supabase, serviceRoleKey)
      ),
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
      transitioned: results.filter(
        (r) => r.previousRuntimeState !== r.newRuntimeState,
      ).length,
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
