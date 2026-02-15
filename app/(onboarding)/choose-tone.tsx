import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { useTranslation } from 'react-i18next';
import { CosmicBackground } from '@/src/shared/components/cosmic-background';
import { GoldButton } from '@/src/shared/components/gold-button';
import { colors, spacing, fontFamily, borderRadius, glassmorphism } from '@/src/config/theme';
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

export default function ChooseToneScreen() {
  const { t } = useTranslation();
  const toneStyle = useOnboardingStore((s) => s.toneStyle);
  const setToneStyle = useOnboardingStore((s) => s.setToneStyle);

  const handleNext = () => {
    if (!toneStyle) return;
    router.push('/(onboarding)/meet-twin');
  };

  return (
    <CosmicBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Feather name="arrow-left" size={24} color="#F8FAFC" />
            </Pressable>
            <Text style={styles.step}>5/6</Text>
          </View>

          <Text style={styles.title}>{t('onboarding.tone.title')}</Text>

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
            <GoldButton
              title={t('onboarding.tone.cta')}
              onPress={handleNext}
              disabled={!toneStyle}
              style={styles.ctaButton}
            />
          </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  backButton: {
    padding: spacing.xs,
  },
  step: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: '#94A3B8',
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    color: '#F8FAFC',
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
    backgroundColor: glassmorphism.card.bg,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: glassmorphism.card.border,
  },
  toneCardSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  toneLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 18,
    color: '#F8FAFC',
    marginBottom: spacing.sm,
  },
  toneLabelSelected: {
    color: '#0F172A',
  },
  toneSample: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 22,
  },
  toneSampleSelected: {
    color: '#334155',
  },
  footer: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  ctaButton: {
    alignSelf: 'stretch',
  },
});
