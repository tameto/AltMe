import { corsHeaders } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase.ts';
import { chatCompletion } from '../_shared/openai.ts';

type Answer = {
  questionId: string;
  answer: string;
};

type PersonalityTraits = {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
};

type AnalysisResult = {
  summary: string;
  detailedAnalysis: string;
  personalityTraits: PersonalityTraits;
  twinPersonality: string;
};

const SYSTEM_PROMPT = `あなたは性格分析の専門家です。ユーザーの回答をBig Five性格モデルに基づいて分析してください。

以下の5つの特性について0〜100のスコアで評価してください：
- Openness（開放性）: 新しい経験への好奇心、創造性
- Conscientiousness（誠実性）: 計画性、責任感、自制心
- Extraversion（外向性）: 社交性、活発さ、ポジティブな感情
- Agreeableness（協調性）: 思いやり、協力的、信頼
- Neuroticism（神経症的傾向）: 不安、ストレスへの敏感さ

質問の対応関係：
- q1「週末の理想的な過ごし方は？」→ Extraversion
- q2「仕事で問題が起きたらまず何をする？」→ Conscientiousness
- q3「SNSで話題の新しいことが出てきたら？」→ Openness
- q4「友人が落ち込んでいたら？」→ Agreeableness
- q5「大事なプレゼンの前日は？」→ Neuroticism

必ず以下のJSON形式で回答してください。分析はすべて日本語で記述してください。

{
  "summary": "2文程度の短い性格サマリー",
  "detailedAnalysis": "3〜4段落の詳しい性格分析。ユーザーの強み、特徴、仕事や人間関係での傾向などを含む",
  "personalityTraits": {
    "openness": 0-100の数値,
    "conscientiousness": 0-100の数値,
    "extraversion": 0-100の数値,
    "agreeableness": 0-100の数値,
    "neuroticism": 0-100の数値
  },
  "twinPersonality": "このユーザーのAI分身がどのような性格・口調・特徴を持つべきかの設定文。1〜2段落"
}

JSONのみを返してください。他のテキストは含めないでください。`;

const buildUserPrompt = (answers: Answer[]): string => {
  const answerLines = answers
    .map((a) => `${a.questionId}: ${a.answer}`)
    .join('\n');

  return `以下の性格診断の回答を分析してください：\n\n${answerLines}`;
};

const parseAnalysisResult = (content: string): AnalysisResult => {
  const cleaned = content
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  const parsed = JSON.parse(cleaned);

  const traits = parsed.personalityTraits;
  if (
    typeof traits.openness !== 'number' ||
    typeof traits.conscientiousness !== 'number' ||
    typeof traits.extraversion !== 'number' ||
    typeof traits.agreeableness !== 'number' ||
    typeof traits.neuroticism !== 'number'
  ) {
    throw new Error('Invalid personalityTraits format');
  }

  return {
    summary: String(parsed.summary),
    detailedAnalysis: String(parsed.detailedAnalysis),
    personalityTraits: {
      openness: Math.min(100, Math.max(0, Math.round(traits.openness))),
      conscientiousness: Math.min(100, Math.max(0, Math.round(traits.conscientiousness))),
      extraversion: Math.min(100, Math.max(0, Math.round(traits.extraversion))),
      agreeableness: Math.min(100, Math.max(0, Math.round(traits.agreeableness))),
      neuroticism: Math.min(100, Math.max(0, Math.round(traits.neuroticism))),
    },
    twinPersonality: String(parsed.twinPersonality),
  };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Auth check
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

    // 2. Validate request body
    const body = await req.json();
    const { answers } = body as { answers?: Answer[] };

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid answers' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // 3. Call OpenAI for personality analysis
    let analysisResult: AnalysisResult;
    try {
      const content = await chatCompletion({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(answers) },
        ],
        temperature: 0.7,
        maxTokens: 2048,
      });

      analysisResult = parseAnalysisResult(content);
    } catch (error) {
      console.error('OpenAI analysis failed:', error);
      return new Response(
        JSON.stringify({ error: 'Personality analysis failed' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // 4. Save to personality_results table (upsert on user_id)
    const { error: upsertError } = await supabase
      .from('personality_results')
      .upsert(
        {
          user_id: user.id,
          summary: analysisResult.summary,
          detailed_analysis: analysisResult.detailedAnalysis,
          personality_traits: analysisResult.personalityTraits,
          twin_personality: analysisResult.twinPersonality,
          answers,
        },
        { onConflict: 'user_id' },
      );

    if (upsertError) {
      console.error('Failed to save personality result:', upsertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save analysis result' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // 5. Update profiles.onboarding_completed = false
    //    (will be set to true after meet-twin screen)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ onboarding_completed: false })
      .eq('id', user.id);

    if (profileError) {
      console.error('Failed to update profile:', profileError);
      // Non-fatal: continue with response even if profile update fails
    }

    // 6. Return analysis result
    return new Response(
      JSON.stringify({
        summary: analysisResult.summary,
        detailedAnalysis: analysisResult.detailedAnalysis,
        personalityTraits: analysisResult.personalityTraits,
        twinPersonality: analysisResult.twinPersonality,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
