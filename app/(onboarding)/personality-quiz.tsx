import { StyleSheet, View, Text, Pressable, Animated } from 'react-native';
import { useRef, useCallback } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { CosmicBackground } from '@/src/shared/components/cosmic-background';
import { spacing, fontFamily } from '@/src/config/theme';
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
    <CosmicBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={handleBack}
              disabled={isFirstQuestion}
            >
              <Feather
                name="arrow-left"
                size={24}
                color={isFirstQuestion ? '#64748B' : '#F8FAFC'}
              />
            </Pressable>
            <Text style={styles.counterTitle}>性格診断</Text>
            <Text style={styles.counterStep}>
              {currentStep + 1} / {ONBOARDING_QUESTION_COUNT}
            </Text>
          </View>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>

          <Animated.View style={[styles.questionContainer, { opacity: fadeAnim }]}>
            <Text style={styles.questionNumber}>Q{currentStep + 1}</Text>
            <Text style={styles.question}>{currentQuestion.question}</Text>

            <View style={styles.options}>
              {currentQuestion.options.map((option, index) => {
                const isSelected = answers.find(
                  (a) => a.questionId === currentQuestion.id,
                )?.answer === option.value;

                const optionLabel = String.fromCharCode(65 + index); // A, B, C, D

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
                        styles.optionPrefix,
                        isSelected ? styles.optionPrefixSelected : styles.optionPrefixInactive,
                      ]}
                    >
                      {optionLabel}.
                    </Text>
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
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  backButton: {
    padding: spacing.xs,
    width: 40,
    alignItems: 'flex-start',
  },
  counterTitle: {
    flex: 1,
    fontFamily: fontFamily.semiBold,
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  counterStep: {
    width: 40,
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.38)',
    textAlign: 'right',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 9999,
    marginBottom: spacing.xxl,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7DD3FC',
    borderRadius: 9999,
  },
  questionContainer: {
    flex: 1,
    paddingTop: spacing.xl,
    gap: 20,
  },
  questionNumber: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    fontWeight: '700',
    color: '#7DD3FC',
  },
  question: {
    fontFamily: fontFamily.semiBold,
    fontSize: 22,
    fontWeight: '600',
    color: '#F8FAFC',
    lineHeight: 30.8,
  },
  options: {
    gap: 14,
  },
  optionButton: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionButtonSelected: {
    backgroundColor: 'rgba(125,211,252,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(125,211,252,0.31)',
  },
  optionPrefix: {
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    fontSize: 16,
  },
  optionPrefixInactive: {
    color: 'rgba(255,255,255,0.38)',
  },
  optionText: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 22,
    flex: 1,
  },
  optionTextSelected: {
    color: '#F8FAFC',
  },
  optionPrefixSelected: {
    color: '#7DD3FC',
  },
});
