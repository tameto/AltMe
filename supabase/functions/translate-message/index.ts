import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { createSupabaseClient, createServiceClient } from '../_shared/supabase.ts';
import { chatCompletion } from '../_shared/openai.ts';

type TargetLang = 'ja' | 'en';

const LANG_LABELS: Record<TargetLang, string> = {
  ja: '日本語',
  en: 'English',
};

Deno.serve(async (req: Request) => {
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  try {
    // 1. Auth check
    const supabase = createSupabaseClient(req);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 2. Parse and validate inputs
    const body = await req.json();
    const { messageId, text, targetLang } = body;

    if (!messageId || typeof messageId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'message_id_required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'text_required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!targetLang || !['ja', 'en'].includes(targetLang)) {
      return new Response(
        JSON.stringify({ error: 'invalid_target_lang', allowed: ['ja', 'en'] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 3. Verify message belongs to authenticated user (via RLS)
    const { data: message, error: msgError } = await supabase
      .from('chat_messages')
      .select('id, user_id, metadata')
      .eq('id', messageId)
      .single();

    if (msgError || !message) {
      return new Response(
        JSON.stringify({ error: 'message_not_found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (message.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 4. Call OpenAI GPT-4o mini for translation + source language detection
    const targetLangLabel = LANG_LABELS[targetLang as TargetLang];
    const systemPrompt = `You are a professional translator. Translate the following text to ${targetLangLabel}. Detect the source language automatically. Return a JSON object with exactly two fields: "translatedText" (the translation) and "sourceLang" (the detected ISO 639-1 language code, e.g. "ja" or "en"). Return only valid JSON, no explanation.`;

    const rawResult = await chatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      temperature: 0.1,
      maxTokens: 1024,
    });

    let translatedText: string;
    let sourceLang: string;

    try {
      const parsed = JSON.parse(rawResult);
      translatedText = parsed.translatedText;
      sourceLang = parsed.sourceLang || 'unknown';
    } catch {
      // Fallback: treat raw result as translated text
      translatedText = rawResult.trim();
      sourceLang = 'unknown';
    }

    // 5. Save translation to chat_messages.metadata.translation (service role for write)
    const serviceClient = createServiceClient();
    const existingMetadata = (message.metadata as Record<string, unknown>) || {};
    await serviceClient
      .from('chat_messages')
      .update({
        metadata: {
          ...existingMetadata,
          translation: {
            translatedText,
            sourceLang,
            targetLang,
            translatedAt: new Date().toISOString(),
          },
        },
      })
      .eq('id', messageId);

    // 6. Return result
    return new Response(
      JSON.stringify({ translatedText, sourceLang, targetLang }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('translate-message error:', error);
    return new Response(
      JSON.stringify({ error: 'translation_failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
