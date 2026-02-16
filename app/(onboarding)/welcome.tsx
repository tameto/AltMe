import { StyleSheet, View, Text } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Feather from '@expo/vector-icons/Feather';
import { CosmicBackground } from '@/src/shared/components/cosmic-background';
import { GoldButton } from '@/src/shared/components/gold-button';
import { spacing, fontFamily } from '@/src/config/theme';
import { useOnboardingStore } from '@/src/features/onboarding/stores/onboarding-store';

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const reset = useOnboardingStore((s) => s.reset);

  const handleStart = () => {
    reset();
    router.push('/(onboarding)/personality-quiz');
  };

  return (
    <CosmicBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Feather name="cpu" size={72} color="#7DD3FC" />
            </View>
            <Text style={styles.headline}>
              {t('onboarding.welcome.headline')}
            </Text>
            <Text style={styles.description}>
              {t('onboarding.welcome.description')}
            </Text>
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
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xxl * 2,
  },
  iconContainer: {
    marginBottom: spacing.xxl,
  },
  headline: {
    fontFamily: fontFamily.bold,
    fontSize: 32,
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 42,
  },
  description: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 26,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
  },
  ctaButton: {
    alignSelf: 'stretch',
    marginBottom: spacing.md,
  },
  timeEstimate: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: '#64748B',
  },
});
