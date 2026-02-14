export type ChatRole = 'user' | 'assistant' | 'system';

export type ChatMessageSource = 'edge_function' | 'openclaw';

export type ChatMessage = {
  id: string;
  userId: string;
  role: ChatRole;
  content: string;
  tokensUsed: number | null;
  source: ChatMessageSource;
  sessionId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type ChatMessageInput = {
  role: ChatRole;
  content: string;
};

export type ChatStreamChunk = {
  delta: string;
  isComplete: boolean;
  messageId?: string;
  tokensUsed?: number;
};

export const FREE_DAILY_CHAT_LIMIT = 3;
