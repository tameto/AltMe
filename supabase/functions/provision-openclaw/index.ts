import { corsHeaders } from '../_shared/cors.ts';
import { createServiceClient } from '../_shared/supabase.ts';

const DO_API_TOKEN = Deno.env.get('DIGITALOCEAN_API_TOKEN') ?? '';
const DO_API_BASE = 'https://api.digitalocean.com/v2';

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
  droplet_id: number | null;
  ip_address: string | null;
  status: string;
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

    console.log(`Provisioning OpenClaw for user ${user_id}`);

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
      // Already running — return success (no-op)
      if (existingInstance.status === 'running') {
        console.log(`Instance already running for user ${user_id}, returning existing`);
        return new Response(
          JSON.stringify({ success: true, instance_id: existingInstance.id, status: 'running' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // Stopped or error — clean up existing Droplet before reprovisioning
      if (existingInstance.status === 'stopped' || existingInstance.status === 'error') {
        console.log(`Existing instance in ${existingInstance.status} state, cleaning up`);

        if (existingInstance.droplet_id) {
          await deleteDroplet(existingInstance.droplet_id);
        }

        // Remove the old record so we can create a fresh one
        await supabase
          .from('openclaw_instances')
          .delete()
          .eq('user_id', user_id);
      }

      // If status is 'provisioning', let it continue (avoid double-provisioning)
      if (existingInstance.status === 'provisioning') {
        console.log(`Instance already provisioning for user ${user_id}`);
        return new Response(
          JSON.stringify({ success: true, instance_id: existingInstance.id, status: 'provisioning' }),
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
    // Step 4: Create DigitalOcean Droplet
    // ---------------------------------------------------------------
    const userIdPrefix = user_id.substring(0, 8);
    const dropletName = `altme-${userIdPrefix}`;

    const cloudInitScript = generateCloudInit({
      soulMd,
      gatewayToken,
    });

    console.log(`Creating Droplet ${dropletName} for user ${user_id}`);

    const dropletResponse = await fetch(`${DO_API_BASE}/droplets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DO_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: dropletName,
        region: 'sgp1',
        size: 's-1vcpu-1gb',
        image: 'docker-20-04',
        tags: ['altme', `user-${user_id}`],
        user_data: cloudInitScript,
      }),
    });

    if (!dropletResponse.ok) {
      const errorBody = await dropletResponse.text();
      console.error(`DigitalOcean API error (${dropletResponse.status}):`, errorBody);
      return new Response(
        JSON.stringify({ error: 'droplet_creation_failed', details: errorBody }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const dropletData = await dropletResponse.json();
    const dropletId: number = dropletData.droplet.id;

    console.log(`Droplet created: id=${dropletId}, name=${dropletName}`);

    // ---------------------------------------------------------------
    // Step 5: Insert record in openclaw_instances
    // ---------------------------------------------------------------
    const { data: instance, error: insertError } = await supabase
      .from('openclaw_instances')
      .insert({
        user_id,
        droplet_id: dropletId,
        region: 'sgp1',
        status: 'provisioning',
        gateway_token: gatewayToken,
        soul_md: soulMd,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Failed to insert instance record:', insertError);
      // Attempt to clean up the Droplet we just created
      await deleteDroplet(dropletId);
      return new Response(
        JSON.stringify({ error: 'database_insert_failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log(`Provisioning started: instance_id=${instance.id} for user ${user_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        instance_id: instance.id,
        droplet_id: dropletId,
        status: 'provisioning',
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
// Helper: Delete a DigitalOcean Droplet
// -------------------------------------------------------------------
async function deleteDroplet(dropletId: number): Promise<void> {
  console.log(`Deleting Droplet ${dropletId}`);
  try {
    const resp = await fetch(`${DO_API_BASE}/droplets/${dropletId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${DO_API_TOKEN}`,
      },
    });
    if (!resp.ok) {
      const body = await resp.text();
      console.error(`Failed to delete Droplet ${dropletId} (${resp.status}):`, body);
    }
  } catch (err) {
    console.error(`Error deleting Droplet ${dropletId}:`, err);
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

// -------------------------------------------------------------------
// Helper: Generate cloud-init script
// -------------------------------------------------------------------
function generateCloudInit(params: {
  soulMd: string;
  gatewayToken: string;
}): string {
  // Quoted heredoc ('SOULEOF') disables shell expansion, so no escaping needed
  const escapedSoulMd = params.soulMd;

  return `#!/bin/bash
set -euo pipefail

# -----------------------------------------------
# AltMe OpenClaw Provisioning - cloud-init script
# -----------------------------------------------

echo "=== AltMe: Starting OpenClaw provisioning ==="

# Docker is pre-installed on the docker-20-04 image, but ensure it's running
systemctl enable docker
systemctl start docker

# Install Docker Compose (v2 plugin)
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m)" \\
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# Create OpenClaw directory
mkdir -p /opt/openclaw

# Write SOUL.md
cat > /opt/openclaw/soul.md << 'SOULEOF'
${escapedSoulMd}
SOULEOF

# Write docker-compose.yml
cat > /opt/openclaw/docker-compose.yml << 'COMPOSEEOF'
version: "3.8"

services:
  openclaw:
    image: ghcr.io/openclaw/openclaw:latest
    container_name: openclaw
    restart: unless-stopped
    ports:
      - "18789:18789"
    volumes:
      - /opt/openclaw/soul.md:/app/SOUL.md:ro
    environment:
      - OPENCLAW_GATEWAY_TOKEN=${params.gatewayToken}
      - OPENCLAW_MODEL=anthropic/claude-sonnet-4-5-20250929
      - OPENCLAW_HOST=0.0.0.0
      - OPENCLAW_PORT=18789
COMPOSEEOF

# Configure UFW to allow OpenClaw gateway port
ufw allow 18789/tcp
ufw --force enable

# Pull and start OpenClaw
cd /opt/openclaw
docker compose pull
docker compose up -d

echo "=== AltMe: OpenClaw provisioning complete ==="
`;
}
