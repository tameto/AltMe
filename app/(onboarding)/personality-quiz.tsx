import { StyleSheet, View, Text, Pressable, Animated } from 'react-native';
import { useRef, useCallback } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius } from '@/src/config/theme';
import { ONBOARDING_QUESTION_COUNT } from '@/src/config/constants';
import {
  useOnboardingStore,
  PERSONALITY_QUESTIONS,
} from '@/src/features/onboarding/stores/onboarding-store';
import { supabase } from '@/src/services/supabase/client';

export default function PersonalityQuizScreen() {
  const {
    currentStep,
    answers,
    addAnswer,
    goNext,
    goPrev,
    setResult,
    setAnalyzing,
  } = useOnboardingStore();

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const currentQuestion = PERSONALITY_QUESTIONS[currentStep];
  const progress = (currentStep + 1) / ONBOARDING_QUESTION_COUNT;
  const isFirstQuestion = currentStep === 0;

  const animateTransition = useCallback(
    (callback: () => void) => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        callback();
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      });
    },
    [fadeAnim],
  );

  const analyzePersonality = async () => {
    setAnalyzing(true);
    try {
      const allAnswers = useOnboardingStore.getState().answers;
      const { data, error } = await supabase.functions.invoke('personality-analyze', {
        body: { answers: allAnswers },
      });

      if (error) {
        console.error('Personality analysis error:', error);
        setResult({
          id: '',
          userId: '',
          rawAnswers: allAnswers,
          summary: 'あなたの性格分析が完了しました。',
          communicationStyle: null,
          personalityTraits: {
            openness: 50,
            conscientiousness: 50,
            extraversion: 50,
            agreeableness: 50,
            neuroticism: 50,
          },
          createdAt: new Date().toISOString(),
        });
      } else {
        setResult({
          id: data.id ?? '',
          userId: data.userId ?? '',
          rawAnswers: allAnswers,
          summary: data.summary,
          communicationStyle: data.communicationStyle ?? null,
          personalityTraits: data.personalityTraits ?? {
            openness: 50,
            conscientiousness: 50,
            extraversion: 50,
            agreeableness: 50,
            neuroticism: 50,
          },
          createdAt: data.createdAt ?? new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Personality analysis failed:', err);
      const allAnswers = useOnboardingStore.getState().answers;
      setResult({
        id: '',
        userId: '',
        rawAnswers: allAnswers,
        summary: 'あなたの性格分析が完了しました。',
        communicationStyle: null,
        personalityTraits: {
          openness: 50,
          conscientiousness: 50,
          extraversion: 50,
          agreeableness: 50,
          neuroticism: 50,
        },
        createdAt: new Date().toISOString(),
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSelect = (value: string) => {
    addAnswer(currentQuestion.id, value);

    if (currentStep < PERSONALITY_QUESTIONS.length - 1) {
      animateTransition(() => {
        goNext();
      });
    } else {
      analyzePersonality();
      router.push('/(onboarding)/result');
    }
  };

  const handleBack = () => {
    if (!isFirstQuestion) {
      animateTransition(() => {
        goPrev();
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={handleBack}
            disabled={isFirstQuestion}
          >
            <Text
              style={[
                styles.backButtonText,
                isFirstQuestion && styles.backButtonDisabled,
              ]}
            >
              {'\u2190 戻る'}
            </Text>
          </Pressable>
          <Text style={styles.counter}>
            {currentStep + 1} / {ONBOARDING_QUESTION_COUNT}
          </Text>
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        <Animated.View style={[styles.questionContainer, { opacity: fadeAnim }]}>
          <Text style={styles.question}>{currentQuestion.question}</Text>

          <View style={styles.options}>
            {currentQuestion.options.map((option) => {
              const isSelected = answers.find(
                (a) => a.questionId === currentQuestion.id,
              )?.answer === option.value;

              return (
                <Pressable
                  key={option.value}
                  style={[
                    styles.optionButton,
                    isSelected && styles.optionButtonSelected,
                  ]}
                  onPress={() => handleSelect(option.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backButton: {
    paddingVertical: spacing.xs,
    paddingRight: spacing.md,
  },
  backButtonText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: '500',
  },
  backButtonDisabled: {
    opacity: 0.3,
  },
  counter: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    marginBottom: spacing.xxl,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  questionContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  question: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: 34,
  },
  options: {
    gap: spacing.md,
  },
  optionButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
  },
  optionButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '1A',
  },
  optionText: {
    fontSize: fontSize.md,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
});
