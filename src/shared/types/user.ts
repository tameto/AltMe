export type AgeRange = '18-24' | '25-34' | '35-44' | '45+';

export type PersonalityTraits = {
  openness: number; // 0-100
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
};

export type PersonalityResult = {
  id: string;
  userId: string;
  answers: Array<{ questionId: string; answer: string }>;
  summary: string;
  detailedAnalysis: string | null;
  personalityTraits: PersonalityTraits | null;
  createdAt: string;
};

export type UserProfile = {
  id: string;
  displayName: string;
  ageRange: AgeRange | null;
  locale: string;
  timezone: string;
  onboardingCompleted: boolean;
  twinName: string | null;
  createdAt: string;
  updatedAt: string;
};
