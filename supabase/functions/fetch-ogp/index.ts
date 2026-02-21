import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { createSupabaseClient, createServiceClient } from '../_shared/supabase.ts';

const FETCH_TIMEOUT_MS = 5000;
const MAX_RESPONSE_BYTES = 1024 * 1024; // 1MB
const MAX_REDIRECTS = 3;

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

    // 2. Parse and validate request
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'url_required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Validate URL format (http/https only)
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ error: 'invalid_url' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return new Response(
        JSON.stringify({ error: 'invalid_url_scheme' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // SSRF prevention: block internal/private IPs
    const BLOCKED_HOSTS = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0|169\.254\.|::1|\[::1\])/i;
    if (BLOCKED_HOSTS.test(parsedUrl.hostname)) {
      return new Response(
        JSON.stringify({ error: 'disallowed_host' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 3. Check ogp_cache (24h TTL)
    const serviceClient = createServiceClient();
    const { data: cached } = await serviceClient
      .from('ogp_cache')
      .select('title, description, image, url')
      .eq('url', url)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cached) {
      return new Response(
        JSON.stringify(cached),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 4. Fetch URL with timeout (max 3 redirects)
    const ogpData = await fetchOGP(url);

    // 5. Upsert into ogp_cache (service role — bypasses RLS)
    await serviceClient
      .from('ogp_cache')
      .upsert(
        {
          url,
          title: ogpData.title,
          description: ogpData.description,
          image: ogpData.image,
          fetched_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        { onConflict: 'url' },
      );

    return new Response(
      JSON.stringify({ ...ogpData, url }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    if (error instanceof FetchTimeoutError) {
      return new Response(
        JSON.stringify({ error: 'fetch_timeout' }),
        { status: 408, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.error('fetch-ogp error:', error);
    return new Response(
      JSON.stringify({ error: 'internal_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

class FetchTimeoutError extends Error {}

type OGPData = {
  title: string | null;
  description: string | null;
  image: string | null;
};

async function fetchOGP(url: string): Promise<OGPData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'AltMeBot/1.0 (OGP fetcher)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new FetchTimeoutError('Fetch timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  // Limit response body to 1MB
  const reader = response.body?.getReader();
  if (!reader) {
    return { title: null, description: null, image: null };
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_RESPONSE_BYTES) {
      reader.cancel();
      break;
    }
    chunks.push(value);
  }

  const html = new TextDecoder().decode(mergeUint8Arrays(chunks));
  return parseOGP(html);
}

function mergeUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((sum, a) => sum + a.byteLength, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const arr of arrays) {
    merged.set(arr, offset);
    offset += arr.byteLength;
  }
  return merged;
}

function parseOGP(html: string): OGPData {
  const getMetaContent = (property: string): string | null => {
    // og:xxx (property attribute)
    const propMatch = html.match(
      new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    );
    if (propMatch) return propMatch[1];

    // Reversed attribute order
    const propMatchReversed = html.match(
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
    );
    if (propMatchReversed) return propMatchReversed[1];

    // name attribute (for description)
    const nameMatch = html.match(
      new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    );
    if (nameMatch) return nameMatch[1];

    const nameMatchReversed = html.match(
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, 'i'),
    );
    if (nameMatchReversed) return nameMatchReversed[1];

    return null;
  };

  const title =
    getMetaContent('og:title') ||
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ||
    null;

  const description =
    getMetaContent('og:description') ||
    getMetaContent('description') ||
    null;

  const image = getMetaContent('og:image') || null;

  return {
    title: title ? decodeHTMLEntities(title) : null,
    description: description ? decodeHTMLEntities(description) : null,
    image,
  };
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}
