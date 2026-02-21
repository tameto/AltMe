import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { createServiceClient } from '../_shared/supabase.ts';
import { chatCompletion } from '../_shared/openai.ts';

const MAX_COMMUNITIES_PER_RUN = 10;
const MIN_MESSAGES_GENERATED = 3;
const MAX_MESSAGES_GENERATED = 8;

type Member = {
  user_id: string;
  profiles: {
    twin_name: string | null;
    avatar_icon: string | null;
  } | null;
  personality_results: {
    personality_traits: Record<string, number> | null;
    summary: string | null;
  } | null;
};

type Community = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  language: string | null;
  member_count: number;
};

type GeneratedMessage = {
  agent_user_id: string;
  content: string;
};

Deno.serve(async (req: Request) => {
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  try {
    const supabase = createServiceClient();

    // 1. Fetch active communities with at least 2 members
    const { data: communities, error: communitiesError } = await supabase
      .from('communities')
      .select('id, name, description, category, language, member_count')
      .eq('is_active', true)
      .gte('member_count', 2)
      .limit(MAX_COMMUNITIES_PER_RUN);

    if (communitiesError) {
      throw new Error(`Failed to fetch communities: ${communitiesError.message}`);
    }

    if (!communities || communities.length === 0) {
      console.log('No active communities with sufficient members found');
      return new Response(
        JSON.stringify({ processed: 0, skipped: 0, errors: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log(`Found ${communities.length} communities to process`);

    let processed = 0;
    let skipped = 0;
    let errors = 0;

    for (const community of communities as Community[]) {
      try {
        // 2. Check if autonomous message was posted in last 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count: recentAutonomousCount } = await supabase
          .from('community_messages')
          .select('*', { count: 'exact', head: true })
          .eq('community_id', community.id)
          .eq('is_autonomous', true)
          .gte('created_at', twentyFourHoursAgo);

        if ((recentAutonomousCount ?? 0) > 0) {
          console.log(`Skipping community ${community.id}: autonomous message already posted today`);
          skipped++;
          continue;
        }

        // 3. Fetch community members with profiles and personality in single query
        const { data: allMembers, error: membersError } = await supabase
          .from('community_members')
          .select('user_id, profiles(twin_name, avatar_icon), personality_results(personality_traits, summary)')
          .eq('community_id', community.id);

        if (membersError || !allMembers || allMembers.length < 2) {
          console.log(`Skipping community ${community.id}: insufficient members`);
          skipped++;
          continue;
        }

        // Fisher-Yates shuffle for unbiased random selection
        const arr = [...allMembers];
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        const selectedCount = Math.min(5, Math.max(2, arr.length));
        const memberData: Member[] = arr.slice(0, selectedCount).map((m) => ({
          user_id: m.user_id,
          profiles: m.profiles as Member['profiles'],
          personality_results: m.personality_results as Member['personality_results'],
        }));
        const selectedMemberIds = memberData.map((m) => m.user_id);

        // 5. Build OpenAI prompt
        const messages = buildPrompt(community, memberData);

        // 6. Call OpenAI
        console.log(`Generating conversation for community ${community.id} (${community.name})`);
        const rawResponse = await chatCompletion({
          messages,
          temperature: 0.85,
          maxTokens: 1200,
        });

        // 7. Parse JSON from response
        const generatedMessages = parseGeneratedMessages(rawResponse, selectedMemberIds);

        if (generatedMessages.length === 0) {
          console.warn(`Community ${community.id}: no valid messages parsed from OpenAI response`);
          errors++;
          continue;
        }

        // 8. Batch insert into community_messages
        const inserts = generatedMessages.map((msg) => ({
          community_id: community.id,
          agent_user_id: msg.agent_user_id,
          content: msg.content,
          is_autonomous: true,
        }));

        const { error: insertError } = await supabase
          .from('community_messages')
          .insert(inserts);

        if (insertError) {
          console.error(`Failed to insert messages for community ${community.id}: ${insertError.message}`);
          errors++;
          continue;
        }

        console.log(
          `Community ${community.id}: inserted ${generatedMessages.length} autonomous messages`,
        );
        processed++;
      } catch (communityError) {
        console.error(`Error processing community ${community.id}:`, communityError);
        errors++;
      }
    }

    const summary = { processed, skipped, errors };
    console.log('Run complete:', summary);

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'internal_error', message: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

function buildPrompt(
  community: Community,
  members: Member[],
): { role: 'system' | 'user'; content: string }[] {
  const language = community.language ?? 'ja';
  const languageLabel =
    language === 'ja' ? '日本語' : language === 'ko' ? '한국어' : 'English';

  const memberDescriptions = members
    .map((m, i) => {
      const name = m.profiles?.twin_name ?? `Twin${i + 1}`;
      const traits = m.personality_results?.personality_traits;
      const summary = m.personality_results?.summary;

      let description = `- ID: ${m.user_id}, Name: ${name}`;
      if (summary) {
        description += `\n  Personality summary: ${summary}`;
      }
      if (traits) {
        const traitLines = Object.entries(traits)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
        description += `\n  Traits: ${traitLines}`;
      }
      return description;
    })
    .join('\n');

  const systemPrompt = `You are a simulation engine that generates authentic-feeling conversations between AI twins in a community chat app.

Community details:
- Name: ${community.name}
- Description: ${community.description ?? 'No description'}
- Category: ${community.category ?? 'General'}
- Language: ${languageLabel}

Participants (AI twins with unique personalities):
${memberDescriptions}

Rules:
1. Generate between ${MIN_MESSAGES_GENERATED} and ${MAX_MESSAGES_GENERATED} messages total.
2. Write entirely in ${languageLabel}.
3. Each message should feel natural, on-topic for the community, and reflect the twin's personality.
4. Vary who speaks — not just one person dominating.
5. Keep each message concise (20-100 characters in Japanese/Korean, 30-150 characters in English).
6. Output ONLY a valid JSON array. No markdown, no explanation, no surrounding text.

Output format (strict JSON array):
[
  {"agent_user_id": "<uuid from participants>", "content": "<message text>"},
  ...
]`;

  const userPrompt = `Generate a natural community chat conversation for "${community.name}" following the rules above. Output only the JSON array.`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}

function parseGeneratedMessages(
  raw: string,
  validUserIds: string[],
): GeneratedMessage[] {
  // Extract JSON array from response (handle cases where model adds extra text)
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.warn('No JSON array found in OpenAI response');
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    console.warn('Failed to parse JSON from OpenAI response');
    return [];
  }

  if (!Array.isArray(parsed)) {
    console.warn('Parsed value is not an array');
    return [];
  }

  const validSet = new Set(validUserIds);
  const results: GeneratedMessage[] = [];

  for (const item of parsed) {
    if (
      typeof item === 'object' &&
      item !== null &&
      typeof (item as Record<string, unknown>).agent_user_id === 'string' &&
      typeof (item as Record<string, unknown>).content === 'string' &&
      validSet.has((item as Record<string, unknown>).agent_user_id as string)
    ) {
      results.push({
        agent_user_id: (item as Record<string, unknown>).agent_user_id as string,
        content: (item as Record<string, unknown>).content as string,
      });
    }
  }

  return results;
}
