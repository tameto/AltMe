/**
 * M106: Onboarding Store Web compatibility tests
 *
 * Verifies that onboarding store works correctly in jsdom (Web) environment:
 * - Full onboarding flow: answer all questions -> set result -> choose avatar -> choose tone
 * - Reset clears all state mid-flow
 * - Resume from partial progress (answers persist in memory during session)
 */
import {
  useOnboardingStore,
  PERSONALITY_QUESTIONS,
} from '../onboarding-store';
import type { PersonalityResult } from '@/src/shared/types/user';

const mockPersonalityResult: PersonalityResult = {
  id: 'result-web-1',
  userId: 'user-web-1',
  rawAnswers: PERSONALITY_QUESTIONS.map((q) => ({
    questionId: q.id,
    answer: 'agree',
  })),
  personalityTraits: {
    openness: 75,
    conscientiousness: 65,
    extraversion: 55,
    agreeableness: 80,
    neuroticism: 35,
  },
  summary: 'Web テスト用パーソナリティサマリー',
  communicationStyle: {
    tone: 'friendly',
    formality: 'casual',
    emoji_usage: 'moderate',
    response_length: 'medium',
  },
  createdAt: '2026-02-21T00:00:00Z',
};

describe('M106: Onboarding Store Web compatibility', () => {
  beforeEach(() => {
    useOnboardingStore.getState().reset();
  });

  it('completes full onboarding flow in Web environment', () => {
    const store = useOnboardingStore;

    // Step 1: Answer all personality questions
    for (const question of PERSONALITY_QUESTIONS) {
      store.getState().addAnswer(question.id, 'agree');
      store.getState().goNext();
    }

    expect(store.getState().answers).toHaveLength(PERSONALITY_QUESTIONS.length);
    expect(store.getState().currentStep).toBe(PERSONALITY_QUESTIONS.length - 1);

    // Step 2: Set personality result
    store.getState().setAnalyzing(true);
    expect(store.getState().isAnalyzing).toBe(true);

    store.getState().setResult(mockPersonalityResult);
    store.getState().setAnalyzing(false);

    expect(store.getState().personalityResult).toEqual(mockPersonalityResult);
    expect(store.getState().isAnalyzing).toBe(false);

    // Step 3: Choose avatar
    store.getState().setAvatarIcon('cat');
    expect(store.getState().avatarIcon).toBe('cat');

    // Step 4: Choose tone style
    store.getState().setToneStyle('casual');
    expect(store.getState().toneStyle).toBe('casual');

    // Verify complete state
    const finalState = store.getState();
    expect(finalState.answers).toHaveLength(5);
    expect(finalState.personalityResult).not.toBeNull();
    expect(finalState.avatarIcon).toBe('cat');
    expect(finalState.toneStyle).toBe('casual');
  });

  it('reset clears all state mid-flow', () => {
    const store = useOnboardingStore;

    // Partially complete onboarding
    store.getState().addAnswer('q1', 'strongly_agree');
    store.getState().addAnswer('q2', 'agree');
    store.getState().goNext();
    store.getState().goNext();
    store.getState().setAvatarIcon('robot');
    store.getState().setToneStyle('intellectual');
    store.getState().setResult(mockPersonalityResult);

    // Verify state is populated
    expect(store.getState().answers).toHaveLength(2);
    expect(store.getState().currentStep).toBe(2);
    expect(store.getState().avatarIcon).toBe('robot');
    expect(store.getState().toneStyle).toBe('intellectual');
    expect(store.getState().personalityResult).not.toBeNull();

    // Reset
    store.getState().reset();

    // Verify all state is cleared
    const state = store.getState();
    expect(state.currentStep).toBe(0);
    expect(state.answers).toEqual([]);
    expect(state.personalityResult).toBeNull();
    expect(state.isAnalyzing).toBe(false);
    expect(state.avatarIcon).toBeNull();
    expect(state.toneStyle).toBeNull();
  });

  it('resumes from partial progress within same session', () => {
    const store = useOnboardingStore;

    // Answer first 2 questions
    store.getState().addAnswer('q1', 'strongly_agree');
    store.getState().goNext();
    store.getState().addAnswer('q2', 'disagree');
    store.getState().goNext();

    // Simulate "navigating away and coming back" within same session
    // (store is in-memory, no persist, so state survives within session)
    const resumedState = store.getState();
    expect(resumedState.currentStep).toBe(2);
    expect(resumedState.answers).toHaveLength(2);
    expect(resumedState.answers).toEqual([
      { questionId: 'q1', answer: 'strongly_agree' },
      { questionId: 'q2', answer: 'disagree' },
    ]);

    // Continue answering remaining questions
    store.getState().addAnswer('q3', 'agree');
    store.getState().goNext();
    store.getState().addAnswer('q4', 'strongly_agree');
    store.getState().goNext();
    store.getState().addAnswer('q5', 'agree');

    expect(store.getState().answers).toHaveLength(5);
    expect(store.getState().currentStep).toBe(PERSONALITY_QUESTIONS.length - 1);
  });

  it('handles answer updates without duplicating entries', () => {
    const store = useOnboardingStore;

    // Answer q1 multiple times (user changes mind)
    store.getState().addAnswer('q1', 'agree');
    store.getState().addAnswer('q1', 'strongly_disagree');
    store.getState().addAnswer('q1', 'strongly_agree');

    // Should only have 1 entry for q1, with latest answer
    const answers = store.getState().answers;
    expect(answers).toHaveLength(1);
    expect(answers[0]).toEqual({ questionId: 'q1', answer: 'strongly_agree' });
  });

  it('zustand store is accessible via getState/setState in Web', () => {
    // Verify Zustand store API works in jsdom environment
    expect(typeof useOnboardingStore.getState).toBe('function');
    expect(typeof useOnboardingStore.setState).toBe('function');
    expect(typeof useOnboardingStore.subscribe).toBe('function');

    // Test setState directly
    useOnboardingStore.setState({ currentStep: 3 });
    expect(useOnboardingStore.getState().currentStep).toBe(3);

    // Test subscribe
    const listener = jest.fn();
    const unsubscribe = useOnboardingStore.subscribe(listener);

    useOnboardingStore.getState().goNext();
    expect(listener).toHaveBeenCalled();

    unsubscribe();
  });
});
