import { StyleSheet, View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, spacing, fontSize, borderRadius } from '@/src/config/theme';
import { useOnboardingStore } from '@/src/features/onboarding/stores/onboarding-store';
import type { PersonalityTraits } from '@/src/shared/types/user';

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
  const { t } = useTranslation();
  const { personalityResult, isAnalyzing } = useOnboardingStore();

  const handleMeetTwin = () => {
    router.push('/(onboarding)/choose-avatar');
  };

  if (isAnalyzing || !personalityResult) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            {t('onboarding.result.analyzing')}
          </Text>
          <Text style={styles.loadingSubtext}>
            {t('onboarding.result.pleaseWait')}
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
          {t('onboarding.result.title')}
        </Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>{personalityResult.summary}</Text>
        </View>

        {traits && (
          <View style={styles.traitsCard}>
            <Text style={styles.traitsTitle}>
              {t('onboarding.result.bigFiveTitle')}
            </Text>
            {TRAIT_ORDER.map((key) => (
              <TraitBar
                key={key}
                label={t(`onboarding.result.${key}`)}
                value={traits[key]}
              />
            ))}
          </View>
        )}

        <View style={styles.blurredSection}>
          <View style={styles.blurredHeader}>
            <Text style={styles.blurredTitle}>
              {t('onboarding.result.detailedAnalysis')}
            </Text>
            <Text style={styles.proBadge}>{t('onboarding.result.proBadge')}</Text>
          </View>
          <View style={styles.blurredContent}>
            <Text style={styles.blurredText}>
              {t('onboarding.result.detailedDescription')}
            </Text>
          </View>
        </View>

        <View style={styles.ctaSection}>
          <Pressable style={styles.ctaButton} onPress={handleMeetTwin}>
            <Text style={styles.ctaButtonText}>
              {t('onboarding.result.cta')}
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
