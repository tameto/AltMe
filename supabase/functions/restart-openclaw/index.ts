import { corsHeaders } from '../_shared/cors.ts';
import { createSupabaseClient, createServiceClient } from '../_shared/supabase.ts';

const RATE_LIMIT_MAX_RESTARTS = 3;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

const DIGITALOCEAN_API_TOKEN = Deno.env.get('DIGITALOCEAN_API_TOKEN') ?? '';
const DIGITALOCEAN_API_BASE = 'https://api.digitalocean.com/v2';

type OpenClawInstance = {
  id: string;
  user_id: string;
  droplet_id: number | null;
  ip_address: string | null;
  status: string;
  updated_at: string;
  error_message: string | null;
};

const rebootDroplet = async (dropletId: number): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(
      `${DIGITALOCEAN_API_BASE}/droplets/${dropletId}/actions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DIGITALOCEAN_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'reboot' }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      console.error(`DigitalOcean reboot failed (${response.status}):`, body);
      return { success: false, error: `DigitalOcean API error: ${response.status}` };
    }

    const data = await response.json();
    console.log('DigitalOcean reboot action:', data.action?.id, data.action?.status);
    return { success: true };
  } catch (error) {
    console.error('DigitalOcean reboot request failed:', error);
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
      .select('id, user_id, droplet_id, ip_address, status, updated_at, error_message')
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

    // 3. Check instance status — must be 'running' or 'error' to restart
    if (typedInstance.status === 'stopped') {
      return new Response(
        JSON.stringify({
          error: 'Instance is stopped',
          message: 'Subscription may have expired. Please resubscribe to restart.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    if (typedInstance.status === 'provisioning') {
      return new Response(
        JSON.stringify({
          error: 'Instance is provisioning',
          message: 'Instance is still being set up. Please wait.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    if (typedInstance.status === 'destroying') {
      return new Response(
        JSON.stringify({
          error: 'Instance is being destroyed',
          message: 'Instance is being shut down.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    if (!typedInstance.droplet_id) {
      return new Response(
        JSON.stringify({ error: 'No Droplet associated with instance' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // 4. Rate limit check: enforce minimum gap between restarts
    //    Max 3 restarts per 5 minutes = minimum ~100 seconds between restarts.
    //    We check the updated_at timestamp to enforce this gap.
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

    // 5. Update instance status to 'provisioning' before reboot
    const { error: statusUpdateError } = await serviceClient
      .from('openclaw_instances')
      .update({
        status: 'provisioning',
        error_message: null,
      })
      .eq('user_id', userId);

    if (statusUpdateError) {
      console.error('Failed to update instance status:', statusUpdateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update instance status' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // 6. Call DigitalOcean API to reboot the Droplet
    const rebootResult = await rebootDroplet(typedInstance.droplet_id);

    if (!rebootResult.success) {
      // Revert status to error since reboot failed
      await serviceClient
        .from('openclaw_instances')
        .update({
          status: 'error',
          error_message: `Reboot failed: ${rebootResult.error}`,
        })
        .eq('user_id', userId);

      return new Response(
        JSON.stringify({
          error: 'Reboot failed',
          message: rebootResult.error,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // 7. Reboot initiated successfully
    //    Status remains 'provisioning' — health-check-openclaw will set it back to 'running'
    console.log(`Reboot initiated for user ${userId}, droplet ${typedInstance.droplet_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'OpenClaw instance restart initiated',
        instance: {
          status: 'provisioning',
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
