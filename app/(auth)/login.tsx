import { useState } from 'react';
import { StyleSheet, View, Text, Pressable, ActivityIndicator, Alert, Platform, Image, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import { CosmicBackground } from '@/src/shared/components/cosmic-background';
import { GlassCard } from '@/src/shared/components/glass-card';
import { GoldButton } from '@/src/shared/components/gold-button';
import { fontFamily, spacing } from '@/src/config/theme';
import { APP_NAME } from '@/src/config/constants';
import { useAuthStore } from '@/src/features/auth/stores/auth-store';

type AuthView = 'landing' | 'login';

export default function LoginScreen() {
  const { signInWithApple, signInWithGoogle, devLogin, enterGuestMode } = useAuthStore();
  const { t } = useTranslation();
  const router = useRouter();
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

  const handleGuestMode = () => {
    enterGuestMode();
    router.replace('/(tabs)');
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
            {/* Title Area */}
            <View style={styles.landingHeader}>
              <Text style={styles.landingLogo}>{APP_NAME}</Text>
              <Text style={styles.landingTagline}>{t('auth.loginSubtitle')}</Text>
              <Text style={styles.landingTaglineSub}>{t('auth.taglineSub')}</Text>
            </View>

            {/* Feature Cards */}
            <View style={styles.featuresContainer}>
              <GlassCard variant="card" style={styles.featureCard}>
                <Text style={styles.featureTitle}>{'💬  マイエージェントとチャット'}</Text>
                <Text style={styles.featureDescription}>
                  {'もう一人の自分と24時間いつでも会話できる'}
                </Text>
              </GlassCard>

              <GlassCard variant="card" style={styles.featureCard}>
                <Text style={styles.featureTitle}>{'🤝  コミュニティ'}</Text>
                <Text style={styles.featureDescription}>
                  {'他のユーザーのAIツインとつながろう'}
                </Text>
              </GlassCard>

              <GlassCard variant="card" style={styles.featureCard}>
                <Text style={styles.featureTitle}>{'📊  自己分析 & インサイト'}</Text>
                <Text style={styles.featureDescription}>
                  {'自己理解を深め、より良い意思決定をサポート'}
                </Text>
              </GlassCard>
            </View>

            {/* CTA Button */}
            <View style={styles.ctaContainer}>
              <GoldButton
                title={t('auth.loginCta')}
                onPress={navigateToLogin}
              />

              <Pressable onPress={handleGuestMode}>
                <Text style={styles.guestLink}>{'ゲストとして見てみる →'}</Text>
              </Pressable>
            </View>

            {/* Legal */}
            <View style={styles.legalContainer}>
              <Text style={styles.legalText}>{t('auth.legalFull')}</Text>
            </View>
          </ScrollView>
        ) : (
          <View style={styles.loginContent}>
            {/* Back Button */}
            <Pressable
              style={styles.backButton}
              onPress={navigateToLanding}
            >
              <FontAwesome name="chevron-left" size={18} color="#94A3B8" />
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
                  <ActivityIndicator color="#1A1A1A" />
                ) : (
                  <View style={styles.buttonContent}>
                    <View style={styles.googleIconWrapper}>
                      <Image
                        source={require('@/assets/images/google-g-icon.png')}
                        style={styles.googleIcon}
                      />
                    </View>
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
              <Text style={styles.legalText}>{t('auth.legalFull')}</Text>
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
    letterSpacing: 4,
    marginBottom: spacing.sm,
  },
  landingTagline: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: '#FFFFFFCC',
    marginBottom: 6,
  },
  landingTaglineSub: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: '#FFFFFF80',
  },
  featuresContainer: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  featureCard: {
    padding: 16,
    paddingHorizontal: 20,
    gap: 6,
  },
  featureTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    color: '#F8FAFC',
  },
  featureDescription: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: '#FFFFFF80',
    lineHeight: 18,
  },
  ctaContainer: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  guestLink: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.67)',
    textAlign: 'center',
  },
  legalContainer: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  legalText: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.31)',
    textAlign: 'center',
  },
  // ========== LOGIN STATE ==========
  loginContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: Math.min(300, Dimensions.get('window').height * 0.3),
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
    letterSpacing: 4,
    marginBottom: spacing.sm,
  },
  loginTagline: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: '#FFFFFFCC',
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
    borderRadius: 999,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.19)',
  },
  appleButtonText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 17,
    color: '#FFFFFF',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(125,211,252,0.5)',
  },
  googleIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 17,
    color: '#1A1A1A',
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
