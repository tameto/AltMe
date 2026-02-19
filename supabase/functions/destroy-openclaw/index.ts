import { corsHeaders } from '../_shared/cors.ts';
import { createSupabaseClient, createServiceClient } from '../_shared/supabase.ts';

const CF_ACCOUNT_ID = Deno.env.get('CF_ACCOUNT_ID') ?? '';
const CF_KV_NAMESPACE_ID = Deno.env.get('CF_KV_NAMESPACE_ID') ?? '';
const CF_API_TOKEN = Deno.env.get('CF_API_TOKEN') ?? '';
const INTERNAL_FUNCTION_TOKEN = Deno.env.get('INTERNAL_FUNCTION_TOKEN') ?? '';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    let targetUserId: string | null = null;

    // Check if this is an internal function-to-function call
    const internalToken = req.headers.get('x-internal-function-token');
    if (internalToken && INTERNAL_FUNCTION_TOKEN && internalToken === INTERNAL_FUNCTION_TOKEN) {
      // Internal call: trust the provided user_id
      const body = await req.json();
      targetUserId = body?.user_id ?? null;
    } else {
      // External call: authenticate via JWT and use caller's own user_id
      const userClient = createSupabaseClient(req);
      const { data: { user }, error: authError } = await userClient.auth.getUser();
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      targetUserId = user.id;
    }

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: 'missing user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createServiceClient();
    const user_id = targetUserId;

    // Look up openclaw_instances by user_id
    const { data: instance, error: fetchError } = await supabase
      .from('openclaw_instances')
      .select('id, user_id, desired_state, runtime_state, cf_worker_url, gateway_token')
      .eq('user_id', user_id)
      .single();

    if (fetchError || !instance) {
      // No record found: idempotent no-op
      return new Response(
        JSON.stringify({ success: true, message: 'no instance found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // If already suspended or deleting: idempotent
    if (instance.desired_state === 'suspended' || instance.desired_state === 'deleting') {
      return new Response(
        JSON.stringify({ success: true, message: `already ${instance.desired_state}` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Update desired_state to 'suspended' and runtime_state to 'cold'
    await supabase
      .from('openclaw_instances')
      .update({ desired_state: 'suspended', runtime_state: 'cold' })
      .eq('user_id', user_id);

    // Delete KV entry soul:{userId}
    await deleteSoulFromKv(user_id);

    // Signal the CF Worker to stop the container immediately (best-effort)
    if (instance.cf_worker_url) {
      await stopCfContainer(instance.cf_worker_url, user_id);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('destroy-openclaw error:', error);
    return new Response(
      JSON.stringify({ error: 'internal_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

// -------------------------------------------------------------------
// Helper: Delete SOUL.md from Cloudflare KV
// -------------------------------------------------------------------
async function deleteSoulFromKv(userId: string): Promise<void> {
  if (!CF_ACCOUNT_ID || !CF_KV_NAMESPACE_ID || !CF_API_TOKEN) {
    console.warn('Missing Cloudflare KV env vars, skipping KV deletion');
    return;
  }

  const url =
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/soul:${userId}`;

  try {
    const resp = await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${CF_API_TOKEN}` },
    });
    if (!resp.ok && resp.status !== 404) {
      const body = await resp.text();
      console.error(`CF KV delete failed (${resp.status}):`, body);
    }
  } catch (err) {
    console.error('CF KV delete error:', err);
  }
}

// -------------------------------------------------------------------
// Helper: Signal CF Worker to stop the container (best-effort)
// -------------------------------------------------------------------
async function stopCfContainer(cfWorkerUrl: string, userId: string): Promise<void> {
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const stopUrl = `${cfWorkerUrl}/admin/stop/${userId}`;

  try {
    const resp = await fetch(stopUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
    });
    if (!resp.ok) {
      const body = await resp.text();
      console.warn(`CF Worker stop signal failed (${resp.status}):`, body);
    } else {
      console.log(`CF Worker stop signal sent for user ${userId}`);
    }
  } catch (err) {
    // best-effort: log and continue
    console.warn('CF Worker stop signal error (non-fatal):', err);
  }
}
