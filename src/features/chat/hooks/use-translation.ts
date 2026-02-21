import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/src/services/supabase/client';
import { env } from '@/src/config/env';
import type { TranslationData } from '@/src/shared/types/chat';

type TranslationState = {
  data: TranslationData | null;
  loading: boolean;
  error: string | null;
};

export type UseTranslationReturn = {
  translate: (messageId: string, content: string) => Promise<void>;
  translations: Map<string, TranslationState>;
};

const detectLanguage = (text: string): 'ja' | 'en' => {
  const japaneseRegex = /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/;
  return japaneseRegex.test(text) ? 'ja' : 'en';
};

const callTranslateEdgeFunction = async (
  messageId: string,
  text: string,
): Promise<TranslationData> => {
  const { data: { session } } = await supabase.auth.getSession();
  const targetLang = detectLanguage(text) === 'ja' ? 'en' : 'ja';

  const response = await fetch(`${env.supabaseUrl}/functions/v1/translate-message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token ?? ''}`,
    },
    body: JSON.stringify({ messageId, text, targetLang }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.error ?? 'translation_failed');
  }

  const result = await response.json();

  return {
    text: result.translatedText as string,
    sourceLang: result.sourceLang as string,
    targetLang: result.targetLang as string,
  };
};

export function useTranslation(): UseTranslationReturn {
  const [translations, setTranslations] = useState<Map<string, TranslationState>>(new Map());
  // 最新の Map を ref で保持し、translate が依存配列を持たなくて済むようにする
  const translationsRef = useRef(translations);
  translationsRef.current = translations;

  const translate = useCallback(async (messageId: string, content: string) => {
    const cached = translationsRef.current.get(messageId);

    // キャッシュ済みならスキップ
    if (cached?.data !== null && cached?.data !== undefined) return;

    // ロード中ならスキップ
    if (cached?.loading === true) return;

    setTranslations((prev) => {
      const next = new Map(prev);
      next.set(messageId, { data: null, loading: true, error: null });
      return next;
    });

    try {
      const data = await callTranslateEdgeFunction(messageId, content);

      setTranslations((prev) => {
        const next = new Map(prev);
        next.set(messageId, { data, loading: false, error: null });
        return next;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'translation_failed';

      setTranslations((prev) => {
        const next = new Map(prev);
        next.set(messageId, { data: null, loading: false, error: message });
        return next;
      });
    }
  }, []);

  return { translate, translations };
}
