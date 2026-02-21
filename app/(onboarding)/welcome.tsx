import { StyleSheet, View, Text, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Feather from '@expo/vector-icons/Feather';
import { CosmicBackground } from '@/src/shared/components/cosmic-background';
import { GoldButton } from '@/src/shared/components/gold-button';
import { GlassCard } from '@/src/shared/components/glass-card';
import { OnboardingProgressBar } from '@/src/shared/components/onboarding-progress-bar';
import { colors, fontFamily } from '@/src/config/theme';
import { useOnboardingStore } from '@/src/features/onboarding/stores/onboarding-store';
import { useResponsive } from '@/src/shared/hooks/use-responsive';

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const reset = useOnboardingStore((s) => s.reset);
  const { isMobile } = useResponsive();

  const handleStart = () => {
    reset();
    router.push('/(onboarding)/personality-quiz');
  };

  const Wrapper = Platform.OS === 'web' ? View : SafeAreaView;

  return (
    <CosmicBackground>
      <Wrapper style={styles.container}>
        <View style={[styles.content, !isMobile && styles.contentDesktop]}>
          <OnboardingProgressBar currentStep={1} style={{ marginBottom: 24 }} />
          <View style={styles.header}>
            <Text style={styles.appName}>AltMe</Text>
            <Text style={styles.appTagline}>Your AI Twin That Knows You</Text>
            <View style={styles.avatarContainer}>
              <Feather name="cpu" size={56} color="#7DD3FC" />
            </View>
            <Text style={styles.headline}>
              {t('onboarding.welcome.headline')}
            </Text>
            <Text style={styles.description}>
              {t('onboarding.welcome.description')}
            </Text>
          </View>

          <View style={styles.featureCards}>
            <GlassCard style={styles.featureCard}>
              <View style={styles.featureContent}>
                <Feather name="message-circle" size={20} color="#7DD3FC" />
                <Text style={styles.featureText}>{t('onboarding.welcome.featureChat')}</Text>
              </View>
            </GlassCard>
            <GlassCard style={styles.featureCard}>
              <View style={styles.featureContent}>
                <Feather name="book-open" size={20} color="#7DD3FC" />
                <Text style={styles.featureText}>{t('onboarding.welcome.featureJournal')}</Text>
              </View>
            </GlassCard>
            <GlassCard style={styles.featureCard}>
              <View style={styles.featureContent}>
                <Feather name="heart" size={20} color="#7DD3FC" />
                <Text style={styles.featureText}>{t('onboarding.welcome.featureInsights')}</Text>
              </View>
            </GlassCard>
          </View>

          <View style={styles.footer}>
            <GoldButton
              title={t('onboarding.welcome.cta')}
              onPress={handleStart}
              style={styles.ctaButton}
            />
            <Text style={styles.timeEstimate}>
              {t('onboarding.welcome.timeEstimate')}
            </Text>
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
    paddingTop: 100,
    paddingHorizontal: 32,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 16,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    gap: 16,
  },
  appName: {
    fontFamily: fontFamily.regular,
    fontSize: 48,
    fontWeight: '200',
    letterSpacing: 4,
    color: '#F8FAFC',
  },
  appTagline: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(125,211,252,0.08)',
    borderWidth: 2,
    borderColor: 'rgba(125,211,252,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headline: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  description: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22.4,
  },
  footer: {
    alignItems: 'center',
    width: '100%',
    gap: 16,
  },
  ctaButton: {
    alignSelf: 'stretch',
  },
  contentDesktop: {
    maxWidth: 480,
    alignSelf: 'center' as const,
  },
  timeEstimate: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.31)',
  },
  featureCards: {
    gap: 12,
    width: '100%',
    marginBottom: 24,
  },
  featureCard: {
    borderRadius: 12,
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  featureText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
  },
});
