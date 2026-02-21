/**
 * SSE (Server-Sent Events) パーサ
 * Edge Function からのストリーミングレスポンスを解析する
 */

export type SSEEvent = {
  delta?: string;
  isComplete?: boolean;
};

/**
 * SSE テキストデータをイベントに変換する
 * data: {"delta":"Hello","isComplete":false}
 * data: [DONE]
 */
export function parseSSEChunk(rawText: string): { events: SSEEvent[]; remaining: string } {
  const events: SSEEvent[] = [];
  const lines = rawText.split('\n');
  let remaining = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Last line might be incomplete
    if (i === lines.length - 1 && !rawText.endsWith('\n')) {
      remaining = line;
      continue;
    }

    if (!line.startsWith('data: ')) continue;
    const data = line.slice(6);
    if (data === '[DONE]') continue;

    try {
      const parsed = JSON.parse(data) as SSEEvent;
      events.push(parsed);
    } catch {
      // Skip malformed chunks
    }
  }

  return { events, remaining };
}

/**
 * ReadableStream から SSE イベントを読み取り、コールバックに渡す
 */
export async function readSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  callbacks: {
    onDelta: (delta: string, accumulated: string) => void;
    onComplete: (fullContent: string) => void;
  },
): Promise<string> {
  const decoder = new TextDecoder();
  let accumulated = '';
  let fullResponse = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    accumulated += decoder.decode(value, { stream: true });
    const { events, remaining } = parseSSEChunk(accumulated);
    accumulated = remaining;

    for (const event of events) {
      if (event.delta) {
        fullResponse += event.delta;
        callbacks.onDelta(event.delta, fullResponse);
      }
      if (event.isComplete && fullResponse) {
        callbacks.onComplete(fullResponse);
      }
    }
  }

  return fullResponse;
}
