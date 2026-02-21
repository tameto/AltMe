import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase.ts';
import { chatCompletionStream } from '../_shared/openai.ts';

const FREE_DAILY_CHAT_LIMIT = 3;
const MAX_MESSAGE_LENGTH = 1000;
const CONTEXT_MESSAGE_COUNT = 20;
const RATE_LIMIT_PER_MINUTE = 5;

Deno.serve(async (req: Request) => {
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  try {
    const supabase = createSupabaseClient(req);

    // 1. Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 2. Parse request
    const { message } = await req.json();
    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'message_required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return new Response(
        JSON.stringify({ error: 'message_too_long', maxLength: MAX_MESSAGE_LENGTH }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 3. Rate limit check (simple: count messages in last minute)
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { count: recentCount } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('role', 'user')
      .gte('created_at', oneMinuteAgo);

    if ((recentCount ?? 0) >= RATE_LIMIT_PER_MINUTE) {
      return new Response(
        JSON.stringify({ error: 'rate_limited' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 4. Entitlement check (daily limit for free users)
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .single();

    const isPro = subscription?.status === 'active' || subscription?.status === 'trial';

    if (!isPro) {
      // Get user timezone
      const { data: profile } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('id', user.id)
        .single();

      const tz = profile?.timezone || 'Asia/Tokyo';
      const now = new Date();
      // Calculate start of today in user's timezone
      const todayStr = now.toLocaleDateString('en-CA', { timeZone: tz }); // YYYY-MM-DD
      const todayStart = new Date(`${todayStr}T00:00:00`);
      // Adjust for timezone offset
      const tzOffset = getTimezoneOffset(tz);
      const todayStartUtc = new Date(todayStart.getTime() - tzOffset);

      const { count: todayCount } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('role', 'user')
        .gte('created_at', todayStartUtc.toISOString());

      if ((todayCount ?? 0) >= FREE_DAILY_CHAT_LIMIT) {
        return new Response(
          JSON.stringify({ error: 'chat_limit_reached', limit: FREE_DAILY_CHAT_LIMIT }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    }

    // 5. Save user message
    await supabase.from('chat_messages').insert({
      user_id: user.id,
      role: 'user',
      content: message,
    });

    // 6. Get personality profile
    const { data: personality } = await supabase
      .from('personality_results')
      .select('summary, personality_traits')
      .eq('user_id', user.id)
      .single();

    // 7. Get user profile
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('display_name, age_range, twin_name, timezone')
      .eq('id', user.id)
      .single();

    // 8. Get recent messages for context
    const { data: recentMessages } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(CONTEXT_MESSAGE_COUNT);

    const contextMessages = (recentMessages || []).reverse();

    // 9. Build system prompt
    const twinName = userProfile?.twin_name || 'AltMe';
    const displayName = userProfile?.display_name || 'ユーザー';

    const systemPrompt = buildSystemPrompt(
      twinName,
      displayName,
      userProfile?.age_range,
      personality?.summary,
      personality?.personality_traits,
      userProfile?.timezone || 'Asia/Tokyo',
    );

    // 10. Build messages array for OpenAI
    const openaiMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...contextMessages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    // 11. Call OpenAI with streaming
    const stream = await chatCompletionStream({
      messages: openaiMessages,
      temperature: 0.8,
      maxTokens: 500,
    });

    // 12. Stream response to client
    let fullResponse = '';
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const responseStream = new ReadableStream({
      async start(controller) {
        const reader = stream.getReader();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter((line: string) => line.startsWith('data: '));

            for (const line of lines) {
              const data = line.slice(6); // Remove 'data: '
              if (data === '[DONE]') {
                // Send completion event
                const completeEvent = `data: ${JSON.stringify({ delta: '', isComplete: true })}\n\n`;
                controller.enqueue(encoder.encode(completeEvent));
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content || '';
                if (delta) {
                  fullResponse += delta;
                  const event = `data: ${JSON.stringify({ delta, isComplete: false })}\n\n`;
                  controller.enqueue(encoder.encode(event));
                }
              } catch {
                // Skip malformed chunks
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error);
        } finally {
          // Save AI response to DB
          if (fullResponse) {
            await supabase.from('chat_messages').insert({
              user_id: user.id,
              role: 'assistant',
              content: fullResponse,
            });
          }

          controller.close();
          reader.releaseLock();
        }
      },
    });

    return new Response(responseStream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({ error: 'ai_error', message: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

function buildSystemPrompt(
  twinName: string,
  displayName: string,
  ageRange: string | null | undefined,
  personalitySummary: string | null | undefined,
  personalityTraits: Record<string, number> | null | undefined,
  timezone: string,
): string {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('ja-JP', { timeZone: timezone, hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('ja-JP', { timeZone: timezone, weekday: 'long', month: 'long', day: 'numeric' });

  let prompt = `あなたは「${twinName}」。${displayName}さんのAI分身です。

## あなたの性格
`;

  if (personalitySummary) {
    prompt += personalitySummary + '\n';
  }

  if (personalityTraits) {
    prompt += `
性格特性スコア:
- 開放性: ${personalityTraits.openness}/100
- 誠実性: ${personalityTraits.conscientiousness}/100
- 外向性: ${personalityTraits.extraversion}/100
- 協調性: ${personalityTraits.agreeableness}/100
- 神経症傾向: ${personalityTraits.neuroticism}/100
`;
  }

  prompt += `
## 振る舞いのルール
1. ${displayName}さんの「もう一人の自分」として話す。他人ではなく分身
2. 共感と理解を最優先。アドバイスは求められた時だけ
3. 過去の会話を覚えていて、それを踏まえて話す
4. 1回のレスポンスは100〜200文字程度。短く温かく
5. 質問を投げかけて会話を続ける
6. 感情に名前をつけてあげる（「それは悔しかったね」等）
7. ユーザーの成長や変化に気づいたらポジティブに伝える

## やってはいけないこと
- 医療・法律・金融のアドバイス
- 自殺・自傷に関する相談への直接対応（適切な相談窓口を案内）
- ネガティブな評価や批判
- 過度に長い返答

## 現在の日時
${dateStr} ${timeStr}
`;

  if (ageRange) {
    prompt += `\nユーザーの年齢層: ${ageRange}\n`;
  }

  return prompt;
}

function getTimezoneOffset(tz: string): number {
  const now = new Date();
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(now.toLocaleString('en-US', { timeZone: tz }));
  return tzDate.getTime() - utcDate.getTime();
}
