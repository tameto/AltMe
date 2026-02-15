import { useState } from 'react';
import { StyleSheet, View, Text, Pressable, ActivityIndicator, Alert, Platform, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import { CosmicBackground } from '@/src/shared/components/cosmic-background';
import { GlassCard } from '@/src/shared/components/glass-card';
import { GoldButton } from '@/src/shared/components/gold-button';
import { fontFamily, spacing, fontSize } from '@/src/config/theme';
import { APP_NAME } from '@/src/config/constants';
import { useAuthStore } from '@/src/features/auth/stores/auth-store';

/** Google brand colors per V4 Dark Premium design */
const GOOGLE_BUTTON = {
  background: '#FFFFFF',
  border: '#7DD3FC80',
  text: '#1F1F1F',
  height: 54,
} as const;

type AuthView = 'landing' | 'login';

export default function LoginScreen() {
  const { signInWithApple, signInWithGoogle, devLogin } = useAuthStore();
  const { t } = useTranslation();
  const [currentView, setCurrentView] = useState<AuthView>('landing');
  const [isSigningIn, setIsSigningIn] = useState<'apple' | 'google' | null>(null);

  const handleAppleSignIn = async () => {
    try {
      setIsSigningIn('apple');
      await signInWithApple();
    } catch {
      Alert.alert(t('auth.errorTitle'), t('auth.loginError'));
    } finally {
      setIsSigningIn(null);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn('google');
      await signInWithGoogle();
    } catch {
      Alert.alert(t('auth.errorTitle'), t('auth.loginError'));
    } finally {
      setIsSigningIn(null);
    }
  };

  const navigateToLogin = () => {
    setCurrentView('login');
  };

  const navigateToLanding = () => {
    setCurrentView('landing');
  };

  return (
    <CosmicBackground>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {currentView === 'landing' ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.landingContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Logo */}
            <View style={styles.landingHeader}>
              <Text style={styles.landingLogo}>{APP_NAME}</Text>
              <Text style={styles.landingTagline}>{t('auth.loginSubtitle')}</Text>
            </View>

            {/* Feature Cards */}
            <View style={styles.featuresContainer}>
              <GlassCard variant="card" style={styles.featureCard}>
                <Feather name="cpu" size={28} color="#7DD3FC" />
                <Text style={styles.featureTitle}>{t('guest.features.quiz')}</Text>
                <Text style={styles.featureDescription}>
                  あなたの性格を分析し、世界に一つだけのAI分身を作成
                </Text>
              </GlassCard>

              <GlassCard variant="card" style={styles.featureCard}>
                <Feather name="message-circle" size={28} color="#7DD3FC" />
                <Text style={styles.featureTitle}>{t('guest.features.chat')}</Text>
                <Text style={styles.featureDescription}>
                  もう一人の自分と24時間いつでも会話できる
                </Text>
              </GlassCard>

              <GlassCard variant="card" style={styles.featureCard}>
                <Feather name="trending-up" size={28} color="#7DD3FC" />
                <Text style={styles.featureTitle}>{t('guest.features.insights')}</Text>
                <Text style={styles.featureDescription}>
                  自己理解を深め、より良い意思決定をサポート
                </Text>
              </GlassCard>
            </View>

            {/* CTA Button */}
            <View style={styles.ctaContainer}>
              <GoldButton
                title={t('common.start')}
                onPress={navigateToLogin}
              />

              {/* Guest Link - Hidden for now as per requirements */}
              {/* <Pressable onPress={() => {}}>
                <Text style={styles.guestLink}>ゲストとして続ける</Text>
              </Pressable> */}
            </View>

            {/* Legal */}
            <View style={styles.legalContainer}>
              <Text style={styles.legalText}>
                {t('auth.termsOfService')} | {t('auth.privacyPolicy')}
              </Text>
            </View>
          </ScrollView>
        ) : (
          <View style={styles.loginContent}>
            {/* Back Button */}
            <Pressable
              style={styles.backButton}
              onPress={navigateToLanding}
            >
              <Feather name="arrow-left" size={24} color="#94A3B8" />
            </Pressable>

            {/* Logo */}
            <View style={styles.loginHeader}>
              <Text style={styles.loginLogo}>{APP_NAME}</Text>
              <Text style={styles.loginTagline}>{t('auth.loginSubtitle')}</Text>
            </View>

            {/* Sign In Buttons */}
            <View style={styles.buttons}>
              {Platform.OS === 'ios' ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.appleButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={handleAppleSignIn}
                  disabled={isSigningIn !== null}
                >
                  {isSigningIn === 'apple' ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <View style={styles.buttonContent}>
                      <FontAwesome name="apple" size={20} color="#FFFFFF" />
                      <Text style={styles.appleButtonText}>
                        {t('auth.signInWithApple')}
                      </Text>
                    </View>
                  )}
                </Pressable>
              ) : null}

              <Pressable
                style={({ pressed }) => [
                  styles.googleButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleGoogleSignIn}
                disabled={isSigningIn !== null}
              >
                {isSigningIn === 'google' ? (
                  <ActivityIndicator color={GOOGLE_BUTTON.text} />
                ) : (
                  <View style={styles.buttonContent}>
                    <Image
                      source={require('@/assets/images/google-g-icon.png')}
                      style={styles.googleIcon}
                    />
                    <Text style={styles.googleButtonText}>
                      {t('auth.signInWithGoogle')}
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>

            {/* Spacer */}
            <View style={styles.spacer} />

            {/* Legal */}
            <View style={styles.loginLegalContainer}>
              <Text style={styles.legalText}>
                {t('auth.termsOfService')} | {t('auth.privacyPolicy')}
              </Text>
            </View>

            {/* Dev Buttons */}
            {__DEV__ ? (
              <View style={styles.devButtons}>
                <Pressable
                  style={styles.devButton}
                  onPress={() => devLogin(false)}
                >
                  <Text style={styles.devButtonText}>Dev Login (Onboarding)</Text>
                </Pressable>
                <Pressable
                  style={styles.devButton}
                  onPress={() => devLogin(true)}
                >
                  <Text style={styles.devButtonText}>Dev Login (Home)</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        )}
      </SafeAreaView>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  // ========== LANDING STATE ==========
  landingContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  landingHeader: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    marginTop: spacing.xl,
  },
  landingLogo: {
    fontFamily: fontFamily.regular,
    fontSize: 52,
    fontWeight: '200',
    color: '#F8FAFC',
    marginBottom: spacing.sm,
  },
  landingTagline: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: '#94A3B8',
  },
  featuresContainer: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  featureCard: {
    padding: 20,
    gap: 12,
  },
  featureTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    color: '#F8FAFC',
  },
  featureDescription: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
  ctaContainer: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  guestLink: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  legalContainer: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  legalText: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  // ========== LOGIN STATE ==========
  loginContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: spacing.sm,
    marginBottom: spacing.lg,
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    marginTop: spacing.xl,
  },
  loginLogo: {
    fontFamily: fontFamily.regular,
    fontSize: 52,
    fontWeight: '200',
    color: '#F8FAFC',
    marginBottom: spacing.sm,
  },
  loginTagline: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: '#94A3B8',
  },
  buttons: {
    gap: spacing.md,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appleButton: {
    backgroundColor: '#000000',
    borderRadius: 14,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appleButtonText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  googleButton: {
    backgroundColor: GOOGLE_BUTTON.background,
    borderRadius: 14,
    height: GOOGLE_BUTTON.height,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GOOGLE_BUTTON.border,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    color: GOOGLE_BUTTON.text,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  spacer: {
    flex: 1,
  },
  loginLegalContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  // ========== DEV BUTTONS ==========
  devButtons: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  devButton: {
    backgroundColor: '#334155',
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  devButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: '#F8FAFC',
  },
});
