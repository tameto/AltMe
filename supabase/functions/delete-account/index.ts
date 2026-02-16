import { corsHeaders } from '../_shared/cors.ts';
import { createSupabaseClient, createServiceClient } from '../_shared/supabase.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Authenticate the user via their JWT
    const supabase = createSupabaseClient(req);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const userId = user.id;
    const serviceClient = createServiceClient();

    const steps: Record<string, string> = {
      openclaw: 'skipped',
      revenuecat: 'skipped',
      auth: 'pending',
    };

    // 2. Destroy OpenClaw instance (if exists, failure doesn't block)
    try {
      const { data: instance } = await serviceClient
        .from('openclaw_instances')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (instance) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

        const internalToken = Deno.env.get('INTERNAL_FUNCTION_TOKEN') ?? '';
        const destroyRes = await fetch(`${supabaseUrl}/functions/v1/destroy-openclaw`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
            'x-internal-function-token': internalToken,
          },
          body: JSON.stringify({ user_id: userId }),
        });

        steps.openclaw = destroyRes.ok ? 'success' : 'failed';
        if (!destroyRes.ok) {
          console.error(`destroy-openclaw failed for ${userId}: ${destroyRes.status}`);
        }
      }
    } catch (err) {
      steps.openclaw = 'failed';
      console.error(`OpenClaw destroy error for ${userId}:`, err);
    }

    // 3. Cancel RevenueCat subscriber (if exists)
    try {
      const revenuecatApiKey = Deno.env.get('REVENUECAT_API_KEY') ?? '';
      if (revenuecatApiKey) {
        const rcRes = await fetch(
          `https://api.revenuecat.com/v1/subscribers/${userId}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${revenuecatApiKey}`,
              'Content-Type': 'application/json',
            },
          },
        );

        steps.revenuecat = rcRes.ok || rcRes.status === 404 ? 'success' : 'failed';
        if (!rcRes.ok && rcRes.status !== 404) {
          console.error(`RevenueCat delete failed for ${userId}: ${rcRes.status}`);
        }
      }
    } catch (err) {
      steps.revenuecat = 'failed';
      console.error(`RevenueCat cancel error for ${userId}:`, err);
    }

    // 4. Delete user via auth.admin (CASCADE deletes all data)
    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error(`auth.admin.deleteUser failed for ${userId}:`, deleteError);
      return new Response(
        JSON.stringify({ error: 'account_deletion_failed', steps }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    steps.auth = 'success';

    console.log(`Account deleted for ${userId}:`, steps);

    return new Response(
      JSON.stringify({ success: true, steps }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('delete-account error:', error);
    return new Response(
      JSON.stringify({ error: 'internal_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
