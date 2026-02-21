import { StyleSheet, View, Text, ActivityIndicator, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Feather from '@expo/vector-icons/Feather';
import { CosmicBackground } from '@/src/shared/components/cosmic-background';
import { GlassCard } from '@/src/shared/components/glass-card';
import { GoldButton } from '@/src/shared/components/gold-button';
import { spacing, fontFamily, borderRadius, glassmorphism } from '@/src/config/theme';
import { useOnboardingStore } from '@/src/features/onboarding/stores/onboarding-store';
import type { PersonalityTraits } from '@/src/shared/types/user';

const TRAIT_ORDER: (keyof PersonalityTraits)[] = [
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
      <CosmicBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7DD3FC" />
            <Text style={styles.loadingText}>
              {t('onboarding.result.analyzing')}
            </Text>
            <Text style={styles.loadingSubtext}>
              {t('onboarding.result.pleaseWait')}
            </Text>
          </View>
        </SafeAreaView>
      </CosmicBackground>
    );
  }

  const traits = personalityResult.personalityTraits;

  return (
    <CosmicBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#F8FAFC" />
          </Pressable>
          <Text style={styles.headerTitle}>{t('onboarding.result.headerTitle')}</Text>
          <Text style={styles.headerStep}>3 / 6</Text>
        </View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          <Text style={styles.title}>
            {t('onboarding.result.title')}
          </Text>

          <GlassCard style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>
              {t('onboarding.result.summaryLabel')}
            </Text>
            <Text style={styles.summaryText}>{personalityResult.summary}</Text>
          </GlassCard>

          {traits ? (
            <GlassCard style={styles.traitsCard}>
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
            </GlassCard>
          ) : null}

          {personalityResult.communicationStyle ? (
            <GlassCard style={styles.commStyleCard}>
              <Text style={styles.commStyleLabel}>
                {t('onboarding.result.communicationStyle')}
              </Text>
              <Text style={styles.commStyleValue}>
                {personalityResult.communicationStyle.tone}
              </Text>
              <Text style={styles.commStyleDetail}>
                {personalityResult.communicationStyle.formality} · {personalityResult.communicationStyle.response_length}
              </Text>
            </GlassCard>
          ) : null}

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
            <GoldButton
              title={t('onboarding.result.cta')}
              onPress={handleMeetTwin}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </CosmicBackground>
  );
}

const traitStyles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: '#F8FAFC',
  },
  value: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: '#7DD3FC',
  },
  barBackground: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#7DD3FC',
    borderRadius: 9999,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
    width: 40,
    alignItems: 'flex-start',
  },
  headerTitle: {
    flex: 1,
    fontFamily: fontFamily.semiBold,
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  headerStep: {
    width: 40,
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.38)',
    textAlign: 'right',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 18,
    color: '#F8FAFC',
    marginTop: spacing.lg,
  },
  loadingSubtext: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: '#94A3B8',
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
    fontFamily: fontFamily.bold,
    fontSize: 22,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  summaryCard: {
    padding: spacing.xl,
    marginBottom: spacing.lg,
    gap: 8,
  },
  summaryLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    fontWeight: '600',
    color: '#7DD3FC',
  },
  summaryText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 22.4,
  },
  traitsCard: {
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  traitsTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 18,
    color: '#F8FAFC',
    marginBottom: spacing.lg,
  },
  commStyleCard: {
    padding: spacing.xl,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  commStyleLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: spacing.sm,
  },
  commStyleValue: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    color: '#7DD3FC',
    marginBottom: spacing.xs,
  },
  commStyleDetail: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: '#94A3B8',
  },
  blurredSection: {
    backgroundColor: glassmorphism.card.bg,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: glassmorphism.card.border,
    overflow: 'hidden',
  },
  blurredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  blurredTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    color: '#F8FAFC',
    flex: 1,
  },
  proBadge: {
    fontFamily: fontFamily.bold,
    fontSize: 11,
    color: '#0F172A',
    backgroundColor: '#7DD3FC',
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
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
  },
  ctaSection: {
    paddingTop: spacing.md,
  },
});
