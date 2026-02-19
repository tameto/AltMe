import { corsHeaders } from '../_shared/cors.ts';
import { createSupabaseClient, createServiceClient } from '../_shared/supabase.ts';

const RATE_LIMIT_MAX_RESTARTS = 3;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

type OpenClawInstance = {
  id: string;
  user_id: string;
  desired_state: string;
  runtime_state: string;
  updated_at: string;
  error_message: string | null;
};

const callCFWorkerRestart = async (
  userId: string,
): Promise<{ success: boolean; error?: string }> => {
  const cfWorkerUrl = Deno.env.get('CF_WORKER_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  try {
    const response = await fetch(
      `${cfWorkerUrl}/admin/restart/${userId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const body = await response.text();
      console.error(`CF Worker restart failed (${response.status}):`, body);
      return { success: false, error: `CF Worker error: ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    console.error('CF Worker restart request failed:', error);
    return { success: false, error: String(error) };
  }
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Authenticate user
    const supabase = createSupabaseClient(req);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const userId = user.id;

    // 2. Get the user's openclaw instance using service client (to access all columns)
    const serviceClient = createServiceClient();

    const { data: instance, error: instanceError } = await serviceClient
      .from('openclaw_instances')
      .select('id, user_id, desired_state, runtime_state, updated_at, error_message')
      .eq('user_id', userId)
      .single();

    if (instanceError || !instance) {
      return new Response(
        JSON.stringify({ error: 'No OpenClaw instance found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const typedInstance = instance as OpenClawInstance;

    // 3. Check desired_state — suspended instances cannot be restarted
    if (typedInstance.desired_state === 'suspended') {
      return new Response(
        JSON.stringify({
          error: 'Instance is suspended',
          message: 'Subscription may have expired. Please resubscribe to restart.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    if (typedInstance.desired_state === 'deleting') {
      return new Response(
        JSON.stringify({
          error: 'Instance is being deleted',
          message: 'Instance is being shut down.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // 4. Rate limit check: max 3 restarts per 5 minutes
    //    Check based on updated_at timestamp with minimum gap between restarts.
    const now = Date.now();
    const minGapMs = RATE_LIMIT_WINDOW_MS / RATE_LIMIT_MAX_RESTARTS; // ~100 seconds
    const lastUpdated = new Date(typedInstance.updated_at).getTime();
    const timeSinceLastUpdate = now - lastUpdated;

    if (timeSinceLastUpdate < minGapMs) {
      const retryAfterSeconds = Math.ceil((minGapMs - timeSinceLastUpdate) / 1000);
      return new Response(
        JSON.stringify({
          error: 'Rate limited',
          message: `Too many restart requests. Please wait ${retryAfterSeconds} seconds.`,
          retryAfter: retryAfterSeconds,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfterSeconds),
          },
        },
      );
    }

    // 5. Call CF Worker to restart the container
    const restartResult = await callCFWorkerRestart(userId);

    if (!restartResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Restart failed',
          message: restartResult.error,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // 6. Update runtime_state to 'waking' in DB
    const { error: statusUpdateError } = await serviceClient
      .from('openclaw_instances')
      .update({
        runtime_state: 'waking',
        error_message: null,
      })
      .eq('user_id', userId);

    if (statusUpdateError) {
      console.error('Failed to update runtime_state:', statusUpdateError);
      // Non-fatal: restart was initiated, DB state will be reconciled by health-check
    }

    console.log(`Restart initiated for user ${userId} via CF Worker`);

    // 7. Return success
    return new Response(
      JSON.stringify({
        success: true,
        message: 'OpenClaw instance restart initiated',
        instance: {
          desired_state: typedInstance.desired_state,
          runtime_state: 'waking',
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Unexpected error in restart-openclaw:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
