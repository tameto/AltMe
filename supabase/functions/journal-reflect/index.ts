import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase.ts';
import { chatCompletion } from '../_shared/openai.ts';

Deno.serve(async (req: Request) => {
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  try {
    const supabase = createSupabaseClient(req);

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Check entitlement (journal is Pro only)
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .single();

    const isPro = subscription?.status === 'active' || subscription?.status === 'trial';
    if (!isPro) {
      return new Response(
        JSON.stringify({ error: 'pro_required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { journalEntryId } = await req.json();
    if (!journalEntryId) {
      return new Response(
        JSON.stringify({ error: 'journal_entry_id_required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Get journal entry
    const { data: entry } = await supabase
      .from('journal_entries')
      .select('content, mood')
      .eq('id', journalEntryId)
      .eq('user_id', user.id)
      .single();

    if (!entry) {
      return new Response(
        JSON.stringify({ error: 'entry_not_found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Get personality for context
    const { data: personality } = await supabase
      .from('personality_results')
      .select('summary')
      .eq('user_id', user.id)
      .single();

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, twin_name')
      .eq('id', user.id)
      .single();

    const twinName = profile?.twin_name || 'AltMe';

    // Generate AI reflection
    const reflection = await chatCompletion({
      messages: [
        {
          role: 'system',
          content: `あなたは${twinName}、${profile?.display_name || 'ユーザー'}さんのAI分身です。
日記に対する温かい振り返りコメントを書いてください。

ルール:
- 共感的で温かいトーン
- 100〜150文字程度
- 感情を認め、ポジティブな視点を添える
- 押し付けがましくない
${personality?.summary ? `\nユーザーの性格: ${personality.summary}` : ''}`,
        },
        {
          role: 'user',
          content: `日記の内容:\n${entry.content}${entry.mood ? `\n気分: ${entry.mood}` : ''}`,
        },
      ],
      temperature: 0.8,
      maxTokens: 300,
    });

    // Save reflection
    await supabase
      .from('journal_entries')
      .update({ ai_reflection: reflection })
      .eq('id', journalEntryId);

    return new Response(
      JSON.stringify({ reflection }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Journal reflect error:', error);
    return new Response(
      JSON.stringify({ error: 'internal_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
