export type ChatRole = 'user' | 'assistant' | 'system';
export type ChatMessageSource = 'edge_function' | 'openclaw';

export type ChatAttachment = {
  type: 'image' | 'video' | 'audio';
  url: string;
  thumbnailUrl?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  duration?: number;
  width?: number;
  height?: number;
};

export type OGPData = {
  url: string;
  title?: string;
  description?: string;
  image?: string;
};

export type TranslationData = {
  text: string;
  sourceLang: string;
  targetLang: string;
};

export type ChatMessageMetadata = {
  isJournalPrompt?: boolean;
  isJournalEntry?: boolean;
  isJournalReflection?: boolean;
  journalEntryId?: string;
  toolExecutionResult?: unknown;
  attachments?: ChatAttachment[];
  ogp?: OGPData[];
  translation?: TranslationData;
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
  topicId?: string;
  isRead?: boolean;
  readAt?: string;
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

export type ChatTopicKey = 'daily' | 'work' | 'reflection' | 'consultation';
