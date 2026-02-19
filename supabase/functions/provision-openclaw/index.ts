import { corsHeaders } from '../_shared/cors.ts';
import { createServiceClient } from '../_shared/supabase.ts';

const CF_WORKER_URL = Deno.env.get('CF_WORKER_URL') ?? '';
const CF_ACCOUNT_ID = Deno.env.get('CF_ACCOUNT_ID') ?? '';
const CF_KV_NAMESPACE_ID = Deno.env.get('CF_KV_NAMESPACE_ID') ?? '';
const CF_API_TOKEN = Deno.env.get('CF_API_TOKEN') ?? '';

interface ProvisionRequest {
  user_id: string;
}

interface PersonalityResult {
  extraversion: number;
  agreeableness: number;
  conscientiousness: number;
  neuroticism: number;
  openness: number;
  summary: string;
}

interface Profile {
  display_name: string;
  twin_name: string;
  locale: string;
}

interface OpenClawInstance {
  id: string;
  user_id: string;
  status: string;
  desired_state: string;
  runtime_state: string;
  gateway_token: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // This function is called internally via service_role, not directly by users.
    // Verify the request comes from an authorized source via service_role key.
    const authHeader = req.headers.get('Authorization');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (authHeader !== `Bearer ${serviceRoleKey}`) {
      return new Response(
        JSON.stringify({ error: 'unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const body: ProvisionRequest = await req.json();
    const { user_id } = body;

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log(`Provisioning OpenClaw (Cloudflare) for user ${user_id}`);

    const supabase = createServiceClient();

    // ---------------------------------------------------------------
    // Step 1: Idempotency check — look for existing instance
    // ---------------------------------------------------------------
    const { data: existingInstance } = await supabase
      .from('openclaw_instances')
      .select('*')
      .eq('user_id', user_id)
      .single<OpenClawInstance>();

    if (existingInstance) {
      // Already active — return success (no-op)
      if (
        existingInstance.desired_state === 'active' &&
        existingInstance.status === 'running'
      ) {
        console.log(`Instance already running for user ${user_id}, returning existing`);
        return new Response(
          JSON.stringify({ success: true, instance_id: existingInstance.id, status: 'running' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // Suspended — re-activate by updating desired_state
      if (existingInstance.desired_state === 'suspended') {
        console.log(`Re-activating suspended instance for user ${user_id}`);
        await supabase
          .from('openclaw_instances')
          .update({ desired_state: 'active', runtime_state: 'cold' })
          .eq('user_id', user_id);

        return new Response(
          JSON.stringify({ success: true, instance_id: existingInstance.id, status: 'running' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    }

    // ---------------------------------------------------------------
    // Step 2: Gather user data
    // ---------------------------------------------------------------
    const { data: personality, error: personalityError } = await supabase
      .from('personality_results')
      .select('extraversion, agreeableness, conscientiousness, neuroticism, openness, summary')
      .eq('user_id', user_id)
      .single<PersonalityResult>();

    if (personalityError || !personality) {
      console.error('Failed to fetch personality data:', personalityError);
      return new Response(
        JSON.stringify({ error: 'personality_data_not_found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('display_name, twin_name, locale')
      .eq('id', user_id)
      .single<Profile>();

    if (profileError || !profile) {
      console.error('Failed to fetch profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'profile_not_found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ---------------------------------------------------------------
    // Step 3: Generate SOUL.md and gateway token
    // ---------------------------------------------------------------
    const displayName = profile.display_name || 'User';
    const twinName = profile.twin_name || 'AltMe';

    const soulMd = generateSoulMd({
      displayName,
      twinName,
      extraversion: personality.extraversion,
      agreeableness: personality.agreeableness,
      conscientiousness: personality.conscientiousness,
      neuroticism: personality.neuroticism,
      openness: personality.openness,
      personalitySummary: personality.summary,
    });

    const gatewayToken = crypto.randomUUID();

    // ---------------------------------------------------------------
    // Step 4: Write SOUL.md to Cloudflare KV
    // ---------------------------------------------------------------
    const kvWriteOk = await writeSoulToKv(user_id, soulMd);
    if (!kvWriteOk) {
      console.error(`Failed to write SOUL.md to Cloudflare KV for user ${user_id}`);
      return new Response(
        JSON.stringify({ error: 'kv_write_failed' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ---------------------------------------------------------------
    // Step 5: Insert record in openclaw_instances
    // ---------------------------------------------------------------
    const { data: instance, error: insertError } = await supabase
      .from('openclaw_instances')
      .insert({
        user_id,
        infra_provider: 'cloudflare',
        desired_state: 'active',
        runtime_state: 'cold',
        cf_worker_url: CF_WORKER_URL,
        soul_version: 1,
        status: 'running',
        gateway_token: gatewayToken,
        soul_md: soulMd,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Failed to insert instance record:', insertError);
      // Attempt to clean up the KV entry we just wrote
      await deleteSoulFromKv(user_id);
      return new Response(
        JSON.stringify({ error: 'database_insert_failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log(`Provisioning complete (Cloudflare): instance_id=${instance.id} for user ${user_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        instance_id: instance.id,
        cf_worker_url: CF_WORKER_URL,
        status: 'running',
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Provision error:', error);
    return new Response(
      JSON.stringify({ error: 'internal_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

// -------------------------------------------------------------------
// Helper: Write SOUL.md to Cloudflare KV
// -------------------------------------------------------------------
async function writeSoulToKv(userId: string, soulMd: string): Promise<boolean> {
  if (!CF_ACCOUNT_ID || !CF_KV_NAMESPACE_ID || !CF_API_TOKEN) {
    console.error('Missing Cloudflare KV env vars (CF_ACCOUNT_ID, CF_KV_NAMESPACE_ID, CF_API_TOKEN)');
    return false;
  }

  const url =
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/soul:${userId}`;

  try {
    const resp = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'text/plain',
      },
      body: soulMd,
    });

    if (!resp.ok) {
      const body = await resp.text();
      console.error(`CF KV write failed (${resp.status}):`, body);
      return false;
    }

    return true;
  } catch (err) {
    console.error('CF KV write error:', err);
    return false;
  }
}

// -------------------------------------------------------------------
// Helper: Delete SOUL.md from Cloudflare KV (cleanup on insert failure)
// -------------------------------------------------------------------
async function deleteSoulFromKv(userId: string): Promise<void> {
  if (!CF_ACCOUNT_ID || !CF_KV_NAMESPACE_ID || !CF_API_TOKEN) return;

  const url =
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/soul:${userId}`;

  try {
    const resp = await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${CF_API_TOKEN}` },
    });
    if (!resp.ok) {
      const body = await resp.text();
      console.error(`CF KV delete failed (${resp.status}):`, body);
    }
  } catch (err) {
    console.error('CF KV delete error:', err);
  }
}

// -------------------------------------------------------------------
// Helper: Generate SOUL.md
// -------------------------------------------------------------------
interface SoulMdParams {
  displayName: string;
  twinName: string;
  extraversion: number;
  agreeableness: number;
  conscientiousness: number;
  neuroticism: number;
  openness: number;
  personalitySummary: string;
}

function generateSoulMd(params: SoulMdParams): string {
  return `# AltMe Twin - ${params.displayName}

## Core Identity
あなたは${params.displayName}さんのAIツイン「${params.twinName}」です。

## Personality
- 外向性: ${params.extraversion}/100
- 協調性: ${params.agreeableness}/100
- 誠実性: ${params.conscientiousness}/100
- 神経症傾向: ${params.neuroticism}/100
- 開放性: ${params.openness}/100

## Communication Style
${params.personalitySummary}

## Rules
- 日本語で応答（ユーザーのlocaleに従う）
- 共感的で温かいトーン
- ユーザーの過去の会話を参照して文脈を維持
- プライバシーを尊重
- 1回のレスポンスは100〜200文字程度`;
}
