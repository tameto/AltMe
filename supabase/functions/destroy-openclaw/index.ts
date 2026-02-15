import { corsHeaders } from '../_shared/cors.ts';
import { createServiceClient } from '../_shared/supabase.ts';

const DIGITALOCEAN_API_TOKEN = Deno.env.get('DIGITALOCEAN_API_TOKEN') ?? '';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'missing user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createServiceClient();

    // Look up openclaw_instances by user_id
    const { data: instance, error: fetchError } = await supabase
      .from('openclaw_instances')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (fetchError || !instance) {
      // No record found: return success (idempotent no-op)
      // No instance found: idempotent no-op
      return new Response(
        JSON.stringify({ success: true, message: 'no instance found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // If status is already destroying or stopped: return success (idempotent)
    if (instance.status === 'destroying' || instance.status === 'stopped') {
      // Already destroying/stopped: idempotent
      return new Response(
        JSON.stringify({ success: true, message: `already ${instance.status}` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Update status to destroying
    await supabase
      .from('openclaw_instances')
      .update({ status: 'destroying' })
      .eq('user_id', user_id);

    // Proceed with Droplet deletion

    // Call DigitalOcean API to delete the Droplet
    const doResponse = await fetch(
      `https://api.digitalocean.com/v2/droplets/${instance.droplet_id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${DIGITALOCEAN_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (doResponse.ok || doResponse.status === 204 || doResponse.status === 404) {
      // Success or already deleted — mark as stopped and clear fields
      if (doResponse.status === 404) {
        // Droplet already deleted on DigitalOcean
      }

      await supabase
        .from('openclaw_instances')
        .update({
          status: 'stopped',
          ip_address: null,
          gateway_token: null,
        })
        .eq('user_id', user_id);

      // Instance successfully stopped

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // DigitalOcean API failed with unexpected status
    const errorBody = await doResponse.text();
    const errorMessage = `DigitalOcean API error: ${doResponse.status} - ${errorBody}`;
    console.error(errorMessage);

    // Still mark as stopped but record the error
    await supabase
      .from('openclaw_instances')
      .update({
        status: 'stopped',
        ip_address: null,
        gateway_token: null,
        error_message: errorMessage,
      })
      .eq('user_id', user_id);

    return new Response(
      JSON.stringify({ success: true, warning: 'droplet deletion failed but instance marked stopped' }),
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
