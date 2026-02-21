import { supabase } from '@/src/services/supabase/client';
import { env } from '@/src/config/env';
import type { OGPData } from '@/src/shared/types/chat';

const URL_REGEX = /https?:\/\/[^\s<>"')\]]+/gi;

const ogpCache = new Map<string, OGPData>();

export function extractUrls(text: string): string[] {
  return text.match(URL_REGEX) ?? [];
}

export async function fetchOGP(url: string): Promise<OGPData | null> {
  const cached = ogpCache.get(url);
  if (cached) return cached;

  try {
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(`${env.supabaseUrl}/functions/v1/fetch-ogp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token ?? ''}`,
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) return null;

    const data = await response.json() as OGPData;
    ogpCache.set(url, data);
    return data;
  } catch {
    return null;
  }
}
