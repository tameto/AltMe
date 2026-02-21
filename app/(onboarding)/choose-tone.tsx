import { StyleSheet, View, Text, Pressable, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useResponsive } from '@/src/shared/hooks/use-responsive';
import Feather from '@expo/vector-icons/Feather';
import { useTranslation } from 'react-i18next';
import { CosmicBackground } from '@/src/shared/components/cosmic-background';
import { GoldButton } from '@/src/shared/components/gold-button';
import { spacing, fontFamily, borderRadius, glassmorphism } from '@/src/config/theme';
import {
  useOnboardingStore,
  type ToneStyle,
} from '@/src/features/onboarding/stores/onboarding-store';
import { OnboardingProgressBar } from '@/src/shared/components/onboarding-progress-bar';

const TONE_OPTIONS: ToneStyle[] = [
  'polite',
  'casual',
  'intellectual',
  'mentor',
  'tsundere',
];

export default function ChooseToneScreen() {
  const { t } = useTranslation();
  const { isMobile } = useResponsive();
  const toneStyle = useOnboardingStore((s) => s.toneStyle);
  const setToneStyle = useOnboardingStore((s) => s.setToneStyle);

  const handleNext = () => {
    if (!toneStyle) return;
    router.push('/(onboarding)/meet-twin');
  };

  const Wrapper = Platform.OS === 'web' ? View : SafeAreaView;

  return (
    <CosmicBackground>
      <Wrapper style={styles.container}>
        <View style={[styles.content, !isMobile && styles.contentDesktop]}>
          <OnboardingProgressBar currentStep={5} style={{ marginBottom: 16 }} />
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Feather name="arrow-left" size={24} color="#F8FAFC" />
            </Pressable>
            <Text style={styles.headerTitle}>{t('onboarding.tone.title')}</Text>
            <Text style={styles.step}>5 / 6</Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            contentInsetAdjustmentBehavior="automatic"
          >
            {TONE_OPTIONS.map((tone) => {
              const isSelected = toneStyle === tone;
              return (
                <Pressable
                  key={tone}
                  style={[styles.toneCard, isSelected ? styles.toneCardSelected : null]}
                  onPress={() => setToneStyle(tone)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={t(`onboarding.tone.styles.${tone}`)}
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
                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <Feather name="check-circle" size={20} color="#7DD3FC" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <GoldButton
              title={t('onboarding.tone.cta')}
              onPress={handleNext}
              disabled={!toneStyle}
              style={styles.ctaButton}
            />
          </View>
        </View>
      </Wrapper>
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
  contentDesktop: {
    maxWidth: 600,
    alignSelf: 'center' as const,
    width: '100%' as unknown as number,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    flex: 1,
    textAlign: 'center',
  },
  step: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.38)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  toneCard: {
    backgroundColor: glassmorphism.card.bg,
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: glassmorphism.card.border,
    gap: 8,
  },
  toneCardSelected: {
    backgroundColor: 'rgba(125,211,252,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(125,211,252,0.31)',
  },
  checkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 1,
  },
  toneLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  toneLabelSelected: {
    color: '#7DD3FC',
  },
  toneSample: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 20,
  },
  toneSampleSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  footer: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  ctaButton: {
    alignSelf: 'stretch',
  },
});
