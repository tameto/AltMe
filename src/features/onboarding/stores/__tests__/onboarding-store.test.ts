import {
  useOnboardingStore,
  PERSONALITY_QUESTIONS,
} from '../onboarding-store';
import type { PersonalityResult } from '@/src/shared/types/user';

describe('useOnboardingStore', () => {
  beforeEach(() => {
    useOnboardingStore.getState().reset();
  });

  it('starts with initial state', () => {
    const state = useOnboardingStore.getState();
    expect(state.currentStep).toBe(0);
    expect(state.answers).toEqual([]);
    expect(state.personalityResult).toBeNull();
    expect(state.isAnalyzing).toBe(false);
  });

  it('has 5 personality questions', () => {
    expect(PERSONALITY_QUESTIONS).toHaveLength(5);
    const traits = PERSONALITY_QUESTIONS.map((q) => q.trait);
    expect(traits).toContain('openness');
    expect(traits).toContain('conscientiousness');
    expect(traits).toContain('extraversion');
    expect(traits).toContain('agreeableness');
    expect(traits).toContain('neuroticism');
  });

  it('addAnswer adds a new answer', () => {
    useOnboardingStore.getState().addAnswer('q1', 'agree');
    const state = useOnboardingStore.getState();

    expect(state.answers).toHaveLength(1);
    expect(state.answers[0]).toEqual({ questionId: 'q1', answer: 'agree' });
  });

  it('addAnswer replaces existing answer for same question', () => {
    useOnboardingStore.getState().addAnswer('q1', 'agree');
    useOnboardingStore.getState().addAnswer('q1', 'strongly_agree');

    const state = useOnboardingStore.getState();
    expect(state.answers).toHaveLength(1);
    expect(state.answers[0].answer).toBe('strongly_agree');
  });

  it('goNext increments currentStep', () => {
    useOnboardingStore.getState().goNext();
    expect(useOnboardingStore.getState().currentStep).toBe(1);

    useOnboardingStore.getState().goNext();
    expect(useOnboardingStore.getState().currentStep).toBe(2);
  });

  it('goNext caps at last question', () => {
    for (let i = 0; i < 10; i++) {
      useOnboardingStore.getState().goNext();
    }
    expect(useOnboardingStore.getState().currentStep).toBe(
      PERSONALITY_QUESTIONS.length - 1,
    );
  });

  it('goPrev decrements currentStep', () => {
    useOnboardingStore.getState().goNext();
    useOnboardingStore.getState().goNext();
    useOnboardingStore.getState().goPrev();

    expect(useOnboardingStore.getState().currentStep).toBe(1);
  });

  it('goPrev does not go below 0', () => {
    useOnboardingStore.getState().goPrev();
    expect(useOnboardingStore.getState().currentStep).toBe(0);
  });

  it('setResult stores personality result', () => {
    const mockResult: PersonalityResult = {
      id: 'result-1',
      userId: 'user-1',
      rawAnswers: [{ questionId: 'q1', answer: 'agree' }],
      summary: 'テストサマリー',
      communicationStyle: null,
      personalityTraits: {
        openness: 80,
        conscientiousness: 60,
        extraversion: 40,
        agreeableness: 70,
        neuroticism: 30,
      },
      createdAt: '2026-01-01T00:00:00Z',
    };

    useOnboardingStore.getState().setResult(mockResult);
    expect(useOnboardingStore.getState().personalityResult).toEqual(mockResult);
  });

  it('setAnalyzing updates analyzing state', () => {
    useOnboardingStore.getState().setAnalyzing(true);
    expect(useOnboardingStore.getState().isAnalyzing).toBe(true);

    useOnboardingStore.getState().setAnalyzing(false);
    expect(useOnboardingStore.getState().isAnalyzing).toBe(false);
  });

  it('reset returns to initial state', () => {
    useOnboardingStore.getState().addAnswer('q1', 'agree');
    useOnboardingStore.getState().goNext();
    useOnboardingStore.getState().setAnalyzing(true);

    useOnboardingStore.getState().reset();

    const state = useOnboardingStore.getState();
    expect(state.currentStep).toBe(0);
    expect(state.answers).toEqual([]);
    expect(state.personalityResult).toBeNull();
    expect(state.isAnalyzing).toBe(false);
  });
});
