export type ChatRole = 'user' | 'assistant' | 'system';
export type ChatMessageSource = 'edge_function' | 'openclaw';

export type ChatMessageMetadata = {
  isJournalPrompt?: boolean;
  isJournalEntry?: boolean;
  isJournalReflection?: boolean;
  journalEntryId?: string;
  toolExecutionResult?: unknown;
};

export type ChatMessage = {
  id: string;
  userId: string;
  role: ChatRole;
  content: string;
  source: ChatMessageSource;
  sessionId: string | null;
  metadata: ChatMessageMetadata | null;
  tokensUsed: number | null;
  createdAt: string;
};

export type ChatMessageInput = {
  role: ChatRole;
  content: string;
};

export type ChatStreamChunk = {
  type: 'text_delta' | 'text_done' | 'usage';
  delta?: string;
  content?: string;
  remaining?: number;
};

export const FREE_DAILY_CHAT_LIMIT = 3;
