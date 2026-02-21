import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase.ts';
import { chatCompletion } from '../_shared/openai.ts';

/** 月次レポート生成に必要なクレジット数 */
const MONTHLY_REPORT_CREDIT_COST = 20;

/** 気分の種類 */
type MoodType = 'great' | 'good' | 'neutral' | 'bad' | 'terrible';

/** レスポンスの統計情報 */
type ReportStats = {
  totalChats: number;
  totalJournals: number;
  totalMoods: number;
  dominantMood: MoodType | null;
  creditsUsed: number;
};

/** レスポンス型 */
type MonthlyReportResponse = {
  report: string;
  stats: ReportStats;
};

/**
 * 気分配列から最も多い気分を返す
 */
const getDominantMood = (moods: { mood: string }[]): MoodType | null => {
  if (moods.length === 0) return null;

  const counts: Record<string, number> = {};
  for (const { mood } of moods) {
    counts[mood] = (counts[mood] ?? 0) + 1;
  }

  let dominant: string | null = null;
  let maxCount = 0;
  for (const [mood, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      dominant = mood;
    }
  }

  return dominant as MoodType;
};

Deno.serve(async (req: Request) => {
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  /**
   * JSON レスポンスを生成するヘルパー
   */
  const jsonResponse = (body: Record<string, unknown>, status: number) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const supabase = createSupabaseClient(req);

    // ---- 1. JWT認証 ----
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonResponse({ error: 'unauthorized' }, 401);
    }

    // ---- 2. Pro限定チェック ----
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .single();

    const isPro =
      subscription?.status === 'active' || subscription?.status === 'trial';

    if (!isPro) {
      return jsonResponse({ error: 'pro_required' }, 403);
    }

    // ---- 3. クレジット残高チェック ----
    const { data: creditData } = await supabase
      .from('credits')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    const currentBalance = creditData?.balance ?? 0;

    if (currentBalance < MONTHLY_REPORT_CREDIT_COST) {
      return jsonResponse({ error: 'insufficient_credits' }, 403);
    }

    // ---- 4. 過去1ヶ月のデータ集計 ----
    const oneMonthAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    // チャットメッセージの取得
    const { data: chatMessages } = await supabase
      .from('chat_messages')
      .select('role, content, created_at')
      .eq('user_id', user.id)
      .gte('created_at', oneMonthAgo)
      .order('created_at', { ascending: true });

    const userMessages = (chatMessages || []).filter(
      (m: { role: string }) => m.role === 'user',
    );
    const aiMessages = (chatMessages || []).filter(
      (m: { role: string }) => m.role === 'assistant',
    );

    // 日記エントリの取得
    const { data: journalEntries } = await supabase
      .from('journal_entries')
      .select('content, mood, created_at')
      .eq('user_id', user.id)
      .gte('created_at', oneMonthAgo)
      .order('created_at', { ascending: true });

    // 気分記録の取得
    const oneMonthAgoDate = oneMonthAgo.split('T')[0];
    const { data: moodRecords } = await supabase
      .from('mood_records')
      .select('mood, note, recorded_at')
      .eq('user_id', user.id)
      .gte('recorded_at', oneMonthAgoDate)
      .order('recorded_at', { ascending: true });

    // ---- 5. 統計情報の計算 ----
    const totalChats = userMessages.length + aiMessages.length;
    const totalJournals = journalEntries?.length ?? 0;
    const totalMoods = moodRecords?.length ?? 0;
    const dominantMood = getDominantMood(moodRecords || []);

    // ---- 6. OpenAI でレポート生成 ----
    // ユーザープロフィール・性格情報の取得
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, twin_name')
      .eq('id', user.id)
      .single();

    const { data: personality } = await supabase
      .from('personality_results')
      .select('summary')
      .eq('user_id', user.id)
      .single();

    const twinName = profile?.twin_name || 'AltMe';
    const displayName = profile?.display_name || 'ユーザー';

    // プロンプト用のサマリーを構築
    const chatSummary = userMessages
      .map((m: { content: string }) => m.content)
      .join('\n');

    const journalSummary = (journalEntries || [])
      .map(
        (j: { content: string; mood: string | null; created_at: string }) =>
          `[${j.created_at.split('T')[0]}] ${j.mood ? `(${j.mood}) ` : ''}${j.content}`,
      )
      .join('\n');

    const moodSummary = (moodRecords || [])
      .map(
        (m: { mood: string; note: string | null; recorded_at: string }) =>
          `${m.recorded_at}: ${m.mood}${m.note ? ` - ${m.note}` : ''}`,
      )
      .join('\n');

    const report = await chatCompletion({
      messages: [
        {
          role: 'system',
          content: `あなたは${twinName}、${displayName}さんのパーソナルAI分身です。
過去1ヶ月間のデータをもとに、月次レポートを生成してください。

${personality?.summary ? `ユーザーの性格: ${personality.summary}` : ''}

レポートに含めるセクション:
1. **今月の活動パターン** — チャットの頻度・話題の傾向
2. **感情の推移と傾向** — 気分記録の変化パターン、安定度
3. **成長のポイント** — 日記やチャットから見える前向きな変化
4. **来月へのアドバイス** — 具体的で実行可能な提案

ルール:
- 温かく共感的なトーンで、${displayName}さんに語りかけるように書く
- 各セクションは200〜300文字程度
- データが少ない場合でも、あるデータから最大限の洞察を抽出する
- マークダウン形式で構造化する`,
        },
        {
          role: 'user',
          content: `過去1ヶ月のデータをもとにレポートを生成してください。

## 統計
- ユーザー発言数: ${userMessages.length}
- AI返答数: ${aiMessages.length}
- 日記数: ${totalJournals}
- 気分記録数: ${totalMoods}
- 最も多い気分: ${dominantMood || '(記録なし)'}

## チャット内容（ユーザーの発言）
${chatSummary || '(データなし)'}

## 日記
${journalSummary || '(データなし)'}

## 気分の推移
${moodSummary || '(データなし)'}`,
        },
      ],
      temperature: 0.7,
      maxTokens: 2000,
    });

    // ---- 7. クレジット消費 ----
    // balance を減算
    const { error: creditUpdateError } = await supabase
      .from('credits')
      .update({ balance: currentBalance - MONTHLY_REPORT_CREDIT_COST })
      .eq('user_id', user.id);

    if (creditUpdateError) {
      console.error('クレジット更新エラー:', creditUpdateError);
      return jsonResponse({ error: 'internal_error' }, 500);
    }

    // credit_transactions にレコード追加
    const { error: txError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        amount: -MONTHLY_REPORT_CREDIT_COST,
        type: 'consume',
        description: '月次レポート生成',
      });

    if (txError) {
      console.error('クレジットトランザクション記録エラー:', txError);
      // レポートは生成済みなので、エラーログだけ残して続行
    }

    // ---- 8. レスポンス ----
    const responseBody: MonthlyReportResponse = {
      report,
      stats: {
        totalChats,
        totalJournals,
        totalMoods,
        dominantMood,
        creditsUsed: MONTHLY_REPORT_CREDIT_COST,
      },
    };

    return jsonResponse(responseBody, 200);
  } catch (error) {
    console.error('月次レポート生成エラー:', error);
    return jsonResponse({ error: 'internal_error' }, 500);
  }
});
