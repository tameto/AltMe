import { StyleSheet, View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius } from '@/src/config/theme';
import { useOnboardingStore } from '@/src/features/onboarding/stores/onboarding-store';
import type { PersonalityTraits } from '@/src/shared/types/user';

const TRAIT_LABELS: Record<keyof PersonalityTraits, string> = {
  openness: '開放性',
  conscientiousness: '誠実性',
  extraversion: '外向性',
  agreeableness: '協調性',
  neuroticism: '神経質傾向',
};

const TRAIT_ORDER: Array<keyof PersonalityTraits> = [
  'openness',
  'conscientiousness',
  'extraversion',
  'agreeableness',
  'neuroticism',
];

function TraitBar({ label, value }: { label: string; value: number }) {
  return (
    <View style={traitStyles.container}>
      <View style={traitStyles.labelRow}>
        <Text style={traitStyles.label}>{label}</Text>
        <Text style={traitStyles.value}>{value}</Text>
      </View>
      <View style={traitStyles.barBackground}>
        <View style={[traitStyles.barFill, { width: `${value}%` }]} />
      </View>
    </View>
  );
}

export default function ResultScreen() {
  const { personalityResult, isAnalyzing } = useOnboardingStore();

  const handleMeetTwin = () => {
    router.push('/(onboarding)/meet-twin');
  };

  if (isAnalyzing || !personalityResult) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            {'あなたの性格を分析中...'}
          </Text>
          <Text style={styles.loadingSubtext}>
            {'少々お待ちください'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const traits = personalityResult.personalityTraits;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          {'あなたの性格タイプ'}
        </Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>{personalityResult.summary}</Text>
        </View>

        {traits && (
          <View style={styles.traitsCard}>
            <Text style={styles.traitsTitle}>
              {'パーソナリティチャート'}
            </Text>
            {TRAIT_ORDER.map((key) => (
              <TraitBar
                key={key}
                label={TRAIT_LABELS[key]}
                value={traits[key]}
              />
            ))}
          </View>
        )}

        <View style={styles.blurredSection}>
          <View style={styles.blurredHeader}>
            <Text style={styles.blurredTitle}>
              {'詳細分析を見る'}
            </Text>
            <Text style={styles.proBadge}>{'Pro限定'}</Text>
          </View>
          <View style={styles.blurredContent}>
            <Text style={styles.blurredText}>
              {'コミュニケーションスタイル、強み・弱み、'}{'\n'}
              {'最適なAIツインの設定が含まれます'}
            </Text>
          </View>
        </View>

        <View style={styles.ctaSection}>
          <Pressable style={styles.ctaButton} onPress={handleMeetTwin}>
            <Text style={styles.ctaButtonText}>
              {'AIツインと会う'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const traitStyles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '500',
  },
  value: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  barBackground: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.lg,
  },
  loadingSubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryText: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 26,
  },
  traitsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  traitsTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  blurredSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  blurredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  blurredTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  proBadge: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textInverse,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  blurredContent: {
    opacity: 0.3,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  blurredText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  ctaSection: {
    paddingTop: spacing.md,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  ctaButtonText: {
    color: colors.textInverse,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
});
