const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';
const OPENAI_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-4o-mini';

type ChatCompletionMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type ChatCompletionOptions = {
  messages: ChatCompletionMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
};

/**
 * Call OpenAI Chat Completion API
 */
export const chatCompletion = async (
  options: ChatCompletionOptions,
): Promise<string> => {
  const { messages, model = DEFAULT_MODEL, temperature = 0.7, maxTokens = 1024 } = options;

  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

/**
 * Call OpenAI Chat Completion API with streaming
 */
export const chatCompletionStream = async (
  options: ChatCompletionOptions,
): Promise<ReadableStream> => {
  const { messages, model = DEFAULT_MODEL, temperature = 0.7, maxTokens = 1024 } = options;

  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${error}`);
  }

  return response.body!;
};
