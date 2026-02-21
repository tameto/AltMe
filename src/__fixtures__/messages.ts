import type { ChatMessage } from '@/src/shared/types/chat';

export const mockUserMessage: ChatMessage = {
  id: 'msg-001',
  userId: 'user-free-001',
  role: 'user',
  content: 'こんにちは、今日はどんな一日でしたか？',
  source: 'edge_function',
  sessionId: 'session-001',
  metadata: null,
  tokensUsed: 15,
  createdAt: '2026-01-15T10:00:00Z',
};

export const mockAssistantMessage: ChatMessage = {
  id: 'msg-002',
  userId: 'user-free-001',
  role: 'assistant',
  content: 'こんにちは！今日は良い天気ですね。何か話したいことはありますか？',
  source: 'edge_function',
  sessionId: 'session-001',
  metadata: null,
  tokensUsed: 25,
  createdAt: '2026-01-15T10:00:05Z',
};

export const mockJournalMessage: ChatMessage = {
  ...mockAssistantMessage,
  id: 'msg-003',
  metadata: { isJournalPrompt: true },
};
