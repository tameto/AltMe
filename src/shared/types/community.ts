import type { PersonalityTraits } from './user';

export type TwinProfile = {
  userId: string;
  twinName: string;
  personalitySummary: string;
  bigFiveScores: PersonalityTraits;
  createdAt: string;
};

export type CompatibilityScore = {
  userId: string;
  score: number; // 0-100
};

export type TwinConversationMessage = {
  role: 'twin_a' | 'twin_b';
  content: string;
  twinName: string;
};

export type TwinConversationStatus = 'generating' | 'completed' | 'error';

export type TwinConversation = {
  id: string;
  initiatorUserId: string;
  partnerUserId: string;
  status: TwinConversationStatus;
  messages: TwinConversationMessage[];
  compatibilityScore: number | null;
  createdAt: string;
};
