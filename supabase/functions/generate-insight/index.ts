import { corsHeaders } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase.ts';
import { chatCompletion } from '../_shared/openai.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

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

    // Check entitlement
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

    const { type = 'daily', days = 7 } = await req.json().catch(() => ({}));

    // Get recent chat messages
    const daysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data: messages } = await supabase
      .from('chat_messages')
      .select('role, content, created_at')
      .eq('user_id', user.id)
      .gte('created_at', daysAgo)
      .order('created_at', { ascending: true })
      .limit(100);

    // Get mood records
    const { data: moods } = await supabase
      .from('mood_records')
      .select('mood, note, recorded_at')
      .eq('user_id', user.id)
      .gte('recorded_at', daysAgo.split('T')[0])
      .order('recorded_at', { ascending: true });

    // Get journal entries
    const { data: journals } = await supabase
      .from('journal_entries')
      .select('content, mood, created_at')
      .eq('user_id', user.id)
      .gte('created_at', daysAgo)
      .order('created_at', { ascending: true });

    // Get personality
    const { data: personality } = await supabase
      .from('personality_results')
      .select('summary')
      .eq('user_id', user.id)
      .single();

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, twin_name')
      .eq('id', user.id)
      .single();

    // Build analysis prompt
    const chatSummary = (messages || [])
      .filter((m: { role: string }) => m.role === 'user')
      .map((m: { content: string }) => m.content)
      .join('\n');

    const moodSummary = (moods || [])
      .map((m: { mood: string; recorded_at: string }) => `${m.recorded_at}: ${m.mood}`)
      .join('\n');

    const journalSummary = (journals || [])
      .map((j: { content: string; mood: string | null }) => j.content)
      .join('\n');

    const insightPrompt = type === 'daily'
      ? `直近${days}日間のデータを元に、今日の洞察を1つ生成してください。`
      : `直近${days}日間のデータを元に、包括的なレポートを生成してください。`;

    const insight = await chatCompletion({
      messages: [
        {
          role: 'system',
          content: `あなたは${profile?.twin_name || 'AltMe'}、パーソナルAI分析アシスタントです。
ユーザーのチャット履歴、気分記録、日記から洞察を抽出してください。

${personality?.summary ? `ユーザーの性格: ${personality.summary}` : ''}

ルール:
- ポジティブで建設的なトーン
- 具体的な行動提案を含める
- 200〜400文字程度
- パターンや傾向を見つけて伝える`,
        },
        {
          role: 'user',
          content: `${insightPrompt}

## チャット内容（ユーザーの発言）
${chatSummary || '(データなし)'}

## 気分記録
${moodSummary || '(データなし)'}

## 日記
${journalSummary || '(データなし)'}`,
        },
      ],
      temperature: 0.7,
      maxTokens: 800,
    });

    return new Response(
      JSON.stringify({
        insight,
        period: { days, type },
        dataPoints: {
          messages: messages?.length ?? 0,
          moods: moods?.length ?? 0,
          journals: journals?.length ?? 0,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Generate insight error:', error);
    return new Response(
      JSON.stringify({ error: 'internal_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
