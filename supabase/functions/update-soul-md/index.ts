import { corsHeaders } from '../_shared/cors.ts';
import { createSupabaseClient, createServiceClient } from '../_shared/supabase.ts';

type PersonalityTraits = {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
};

type PersonalityResult = {
  openness: number | null;
  conscientiousness: number | null;
  extraversion: number | null;
  agreeableness: number | null;
  neuroticism: number | null;
  summary: string | null;
};

type Profile = {
  display_name: string | null;
  twin_name: string | null;
  locale: string | null;
  timezone: string | null;
};

const DEFAULT_SOUL_MD = `# AltMe Twin

## Core Identity
あなたはユーザーのAIツインです。

## Personality
デフォルト設定

## Communication Style
共感的で温かいトーン。日本語で応答。

## Rules
- 日本語で応答
- 共感的で温かいトーン
- ユーザーの過去の会話を参照して文脈を維持
- プライバシーを尊重
- 1回のレスポンスは100〜200文字程度
`;

const generateSoulMd = (
  displayName: string,
  twinName: string,
  traits: PersonalityTraits | null,
  personalitySummary: string | null,
  locale: string,
): string => {
  const traitsSection = traits
    ? `## Personality
- 外向性: ${traits.extraversion}/100
- 協調性: ${traits.agreeableness}/100
- 誠実性: ${traits.conscientiousness}/100
- 神経症傾向: ${traits.neuroticism}/100
- 開放性: ${traits.openness}/100`
    : `## Personality
デフォルト設定`;

  const communicationSection = personalitySummary
    ? `## Communication Style
${personalitySummary}`
    : `## Communication Style
共感的で温かいトーン`;

  const localeRule = locale === 'ja'
    ? '日本語で応答'
    : `ユーザーのlocale（${locale}）に従って応答`;

  return `# AltMe Twin - ${displayName}

## Core Identity
あなたは${displayName}さんのAIツイン「${twinName}」です。

${traitsSection}

${communicationSection}

## Rules
- ${localeRule}
- 共感的で温かいトーン
- ユーザーの過去の会話を参照して文脈を維持
- プライバシーを尊重
- 1回のレスポンスは100〜200文字程度
`;
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

    // 2. Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('display_name, twin_name, locale, timezone')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Failed to fetch profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const typedProfile = profile as Profile;

    // 3. Get latest personality data
    const { data: personalityData, error: personalityError } = await supabase
      .from('personality_results')
      .select('openness, conscientiousness, extraversion, agreeableness, neuroticism, summary')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let traits: PersonalityTraits | null = null;
    let personalitySummary: string | null = null;

    if (!personalityError && personalityData) {
      const typedPersonality = personalityData as PersonalityResult;
      if (
        typedPersonality.openness !== null &&
        typedPersonality.conscientiousness !== null &&
        typedPersonality.extraversion !== null &&
        typedPersonality.agreeableness !== null &&
        typedPersonality.neuroticism !== null
      ) {
        traits = {
          openness: typedPersonality.openness,
          conscientiousness: typedPersonality.conscientiousness,
          extraversion: typedPersonality.extraversion,
          agreeableness: typedPersonality.agreeableness,
          neuroticism: typedPersonality.neuroticism,
        };
      }
      personalitySummary = typedPersonality.summary;
    } else {
      console.log('No personality data found for user, using defaults');
    }

    // 4. Generate SOUL.md
    const displayName = typedProfile.display_name || 'ユーザー';
    const twinName = typedProfile.twin_name || 'AltMe';
    const locale = typedProfile.locale || 'ja';

    const soulMd = traits || personalitySummary
      ? generateSoulMd(displayName, twinName, traits, personalitySummary, locale)
      : DEFAULT_SOUL_MD;

    // 5. Update openclaw_instances.soul_md using service client (bypasses RLS)
    const serviceClient = createServiceClient();

    const { data: instance, error: instanceFetchError } = await serviceClient
      .from('openclaw_instances')
      .select('id, status, droplet_id')
      .eq('user_id', userId)
      .single();

    if (instanceFetchError && instanceFetchError.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is acceptable
      console.error('Failed to fetch openclaw instance:', instanceFetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch instance' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    if (instance) {
      // Update existing instance's soul_md
      const { error: updateError } = await serviceClient
        .from('openclaw_instances')
        .update({ soul_md: soulMd })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Failed to update soul_md:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update SOUL.md' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }

      // 6. If instance is running, trigger a restart to apply the new SOUL.md
      if (instance.status === 'running' && instance.droplet_id) {
        try {
          const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
          const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

          // Call restart-openclaw edge function to apply changes
          const restartResponse = await fetch(
            `${supabaseUrl}/functions/v1/restart-openclaw`,
            {
              method: 'POST',
              headers: {
                'Authorization': req.headers.get('Authorization') ?? '',
                'Content-Type': 'application/json',
                'apikey': serviceRoleKey,
              },
              body: JSON.stringify({ user_id: userId }),
            },
          );

          if (!restartResponse.ok) {
            const restartError = await restartResponse.text();
            console.error('restart-openclaw call failed:', restartError);
            // Non-fatal: SOUL.md is saved in DB, will be applied on next restart
          } else {
            console.log('restart-openclaw triggered successfully for SOUL.md update');
          }
        } catch (restartErr) {
          console.error('Failed to call restart-openclaw:', restartErr);
          // Non-fatal: SOUL.md is saved in DB, will be applied on next restart
        }
      }
    } else {
      // No instance exists yet — just upsert the soul_md for when the instance is provisioned
      const { error: upsertError } = await serviceClient
        .from('openclaw_instances')
        .upsert(
          {
            user_id: userId,
            soul_md: soulMd,
            status: 'stopped',
          },
          { onConflict: 'user_id' },
        );

      if (upsertError) {
        console.error('Failed to upsert soul_md:', upsertError);
        return new Response(
          JSON.stringify({ error: 'Failed to save SOUL.md' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'SOUL.md updated',
        instanceStatus: instance?.status ?? 'no_instance',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Unexpected error in update-soul-md:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
