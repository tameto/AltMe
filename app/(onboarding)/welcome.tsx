import { StyleSheet, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius } from '@/src/config/theme';
import { APP_NAME, APP_TAGLINE } from '@/src/config/constants';
import { useOnboardingStore } from '@/src/features/onboarding/stores/onboarding-store';

export default function WelcomeScreen() {
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
          <Text style={styles.tagline}>{APP_TAGLINE}</Text>
          <Text style={styles.headline}>
            {'もう一人の自分と出会おう'}
          </Text>
          <Text style={styles.description}>
            {'あなたの性格を分析して、'}{'\n'}
            {'世界に一つだけのAI分身を'}{'\n'}
            {'作ります'}
          </Text>
        </View>

        <View style={styles.footer}>
          <Pressable style={styles.ctaButton} onPress={handleStart}>
            <Text style={styles.ctaButtonText}>{'はじめる'}</Text>
          </Pressable>
          <Text style={styles.timeEstimate}>
            {'所要時間: 約3分'}
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
