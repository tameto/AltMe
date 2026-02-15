import { create } from 'zustand';
import type { PersonalityResult } from '@/src/shared/types/user';

export type QuestionOption = {
  label: string;
  value: string;
};

export type Question = {
  id: string;
  question: string;
  trait: 'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'neuroticism';
  options: QuestionOption[];
};

export const PERSONALITY_QUESTIONS: Question[] = [
  {
    id: 'q1',
    question: '新しいことを試すのが好きですか？',
    trait: 'openness',
    options: [
      { label: 'とてもそう思う', value: 'strongly_agree' },
      { label: 'ややそう思う', value: 'agree' },
      { label: 'あまりそう思わない', value: 'disagree' },
      { label: '全くそう思わない', value: 'strongly_disagree' },
    ],
  },
  {
    id: 'q2',
    question: '計画を立ててから行動しますか？',
    trait: 'conscientiousness',
    options: [
      { label: 'とてもそう思う', value: 'strongly_agree' },
      { label: 'ややそう思う', value: 'agree' },
      { label: 'あまりそう思わない', value: 'disagree' },
      { label: '全くそう思わない', value: 'strongly_disagree' },
    ],
  },
  {
    id: 'q3',
    question: '大人数の集まりでエネルギーをもらいますか？',
    trait: 'extraversion',
    options: [
      { label: 'とてもそう思う', value: 'strongly_agree' },
      { label: 'ややそう思う', value: 'agree' },
      { label: 'あまりそう思わない', value: 'disagree' },
      { label: '全くそう思わない', value: 'strongly_disagree' },
    ],
  },
  {
    id: 'q4',
    question: '他人の気持ちに敏感ですか？',
    trait: 'agreeableness',
    options: [
      { label: 'とてもそう思う', value: 'strongly_agree' },
      { label: 'ややそう思う', value: 'agree' },
      { label: 'あまりそう思わない', value: 'disagree' },
      { label: '全くそう思わない', value: 'strongly_disagree' },
    ],
  },
  {
    id: 'q5',
    question: 'ストレスを感じやすい方ですか？',
    trait: 'neuroticism',
    options: [
      { label: 'とてもそう思う', value: 'strongly_agree' },
      { label: 'ややそう思う', value: 'agree' },
      { label: 'あまりそう思わない', value: 'disagree' },
      { label: '全くそう思わない', value: 'strongly_disagree' },
    ],
  },
];

type Answer = {
  questionId: string;
  answer: string;
};

export type AvatarStyle = 'geometric' | 'cosmic' | 'organic' | 'techno' | 'zen';
export type ToneStyle = 'polite' | 'casual' | 'intellectual' | 'mentor' | 'tsundere';

type OnboardingStore = {
  currentStep: number;
  answers: Answer[];
  personalityResult: PersonalityResult | null;
  isAnalyzing: boolean;
  avatarStyle: AvatarStyle | null;
  toneStyle: ToneStyle | null;

  // Actions
  addAnswer: (questionId: string, answer: string) => void;
  setResult: (result: PersonalityResult) => void;
  setAnalyzing: (analyzing: boolean) => void;
  setAvatarStyle: (style: AvatarStyle) => void;
  setToneStyle: (style: ToneStyle) => void;
  goNext: () => void;
  goPrev: () => void;
  reset: () => void;
};

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  currentStep: 0,
  answers: [],
  personalityResult: null,
  isAnalyzing: false,
  avatarStyle: null,
  toneStyle: null,

  addAnswer: (questionId, answer) =>
    set((state) => {
      const existing = state.answers.filter((a) => a.questionId !== questionId);
      return { answers: [...existing, { questionId, answer }] };
    }),

  setResult: (result) => set({ personalityResult: result }),

  setAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),

  setAvatarStyle: (style) => set({ avatarStyle: style }),

  setToneStyle: (style) => set({ toneStyle: style }),

  goNext: () =>
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, PERSONALITY_QUESTIONS.length - 1),
    })),

  goPrev: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 0),
    })),

  reset: () =>
    set({
      currentStep: 0,
      answers: [],
      personalityResult: null,
      isAnalyzing: false,
      avatarStyle: null,
      toneStyle: null,
    }),
}));
