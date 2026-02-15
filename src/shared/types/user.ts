export type AgeRange = '18-24' | '25-34' | '35-44' | '45+';

export type PersonalityTraits = {
  openness: number; // 0-100
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
};

export type CommunicationStyle = {
  tone: string;
  formality: string;
  emoji_usage: string;
  response_length: string;
};

export type PersonalityResult = {
  id: string;
  userId: string;
  rawAnswers: Array<{ questionId: string; answer: string }>;
  personalityTraits: PersonalityTraits;
  summary: string;
  communicationStyle: CommunicationStyle | null;
  createdAt: string;
};

export type AvatarIcon = 'default' | 'geometric' | 'cosmic' | 'organic' | 'tech' | 'zen';
export type SpeechTone = 'polite' | 'friendly' | 'intellectual' | 'mentor' | 'tsundere';

export type UserProfile = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  email: string | null;
  ageRange: AgeRange | null;
  locale: string;
  timezone: string;
  onboardingCompleted: boolean;
  twinName: string | null;
  avatarIcon: AvatarIcon;
  speechTone: SpeechTone;
  mbtiType: string | null;
  createdAt: string;
  updatedAt: string;
};
