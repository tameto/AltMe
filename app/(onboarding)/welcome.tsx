import { StyleSheet, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, spacing, fontSize, borderRadius } from '@/src/config/theme';
import { APP_NAME } from '@/src/config/constants';
import { useOnboardingStore } from '@/src/features/onboarding/stores/onboarding-store';

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const reset = useOnboardingStore((s) => s.reset);

  const handleStart = () => {
    reset();
    router.push('/(onboarding)/personality-quiz');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>{APP_NAME}</Text>
          </View>
          <Text style={styles.tagline}>{t('auth.loginSubtitle')}</Text>
          <Text style={styles.headline}>
            {t('onboarding.welcome.headline')}
          </Text>
          <Text style={styles.description}>
            {t('onboarding.welcome.description')}
          </Text>
        </View>

        <View style={styles.footer}>
          <Pressable style={styles.ctaButton} onPress={handleStart}>
            <Text style={styles.ctaButtonText}>{t('onboarding.welcome.cta')}</Text>
          </Pressable>
          <Text style={styles.timeEstimate}>
            {t('onboarding.welcome.timeEstimate')}
          </Text>
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
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xxl * 2,
  },
  logoContainer: {
    marginBottom: spacing.lg,
  },
  logo: {
    fontSize: fontSize.hero,
    fontWeight: '800',
    color: colors.primary,
  },
  tagline: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
  },
  headline: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 42,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl * 2,
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: spacing.md,
  },
  ctaButtonText: {
    color: colors.textInverse,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  timeEstimate: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
});
