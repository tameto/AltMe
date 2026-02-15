import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, spacing, fontSize, borderRadius } from '@/src/config/theme';
import {
  useOnboardingStore,
  type ToneStyle,
} from '@/src/features/onboarding/stores/onboarding-store';

const TONE_OPTIONS: ToneStyle[] = [
  'polite',
  'casual',
  'intellectual',
  'mentor',
  'tsundere',
];

const TEAL = '#7DD3FC';
const GOLD = '#F59E0B';

export default function ChooseToneScreen() {
  const { t } = useTranslation();
  const toneStyle = useOnboardingStore((s) => s.toneStyle);
  const setToneStyle = useOnboardingStore((s) => s.setToneStyle);

  const handleNext = () => {
    if (!toneStyle) return;
    router.push('/(onboarding)/meet-twin');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>
              {'\u2190 '}{t('common.back')}
            </Text>
          </Pressable>
          <Text style={styles.step}>{t('onboarding.tone.step')}</Text>
        </View>

        <Text style={styles.title}>{t('onboarding.tone.title')}</Text>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {TONE_OPTIONS.map((tone) => {
            const isSelected = toneStyle === tone;
            return (
              <Pressable
                key={tone}
                style={[styles.toneCard, isSelected ? styles.toneCardSelected : null]}
                onPress={() => setToneStyle(tone)}
              >
                <Text
                  style={[styles.toneLabel, isSelected ? styles.toneLabelSelected : null]}
                >
                  {t(`onboarding.tone.styles.${tone}`)}
                </Text>
                <Text
                  style={[styles.toneSample, isSelected ? styles.toneSampleSelected : null]}
                >
                  {t(`onboarding.tone.samples.${tone}`)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.ctaButton, !toneStyle ? styles.ctaButtonDisabled : null]}
            onPress={handleNext}
            disabled={!toneStyle}
          >
            <Text style={styles.ctaButtonText}>{t('onboarding.tone.cta')}</Text>
          </Pressable>
        </View>
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
    marginBottom: spacing.lg,
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
  step: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  toneCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
  },
  toneCardSelected: {
    borderColor: `${TEAL}50`,
    backgroundColor: `${TEAL}15`,
  },
  toneLabel: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  toneLabelSelected: {
    color: TEAL,
  },
  toneSample: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  toneSampleSelected: {
    color: colors.text,
  },
  footer: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  ctaButton: {
    backgroundColor: GOLD,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  ctaButtonDisabled: {
    opacity: 0.4,
  },
  ctaButtonText: {
    color: colors.textInverse,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
});
