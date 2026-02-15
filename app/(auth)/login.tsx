import { useState } from 'react';
import { StyleSheet, View, Text, Pressable, ActivityIndicator, Alert, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import { colors, spacing, fontSize, borderRadius } from '@/src/config/theme';
import { APP_NAME } from '@/src/config/constants';
import { useAuthStore } from '@/src/features/auth/stores/auth-store';

/** Google brand colors per guidelines */
const GOOGLE_BUTTON = {
  background: '#FFFFFF',
  border: '#747775',
  text: '#1F1F1F',
  height: 50,
} as const;

export default function LoginScreen() {
  const { signInWithApple, signInWithGoogle, devLogin } = useAuthStore();
  const { t } = useTranslation();
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>{APP_NAME}</Text>
          <Text style={styles.tagline}>{t('auth.loginSubtitle')}</Text>
        </View>

        <View style={styles.buttons}>
          {Platform.OS === 'ios' && (
            <Pressable
              style={styles.appleButton}
              onPress={handleAppleSignIn}
              disabled={isSigningIn !== null}>
              {isSigningIn === 'apple' ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.appleButtonText}>
                  <FontAwesome name="apple" size={16} color="#FFFFFF" />
                  {'  '}{t('auth.signInWithApple')}
                </Text>
              )}
            </Pressable>
          )}

          <Pressable
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            disabled={isSigningIn !== null}>
            {isSigningIn === 'google' ? (
              <ActivityIndicator color={GOOGLE_BUTTON.text} />
            ) : (
              <View style={styles.googleButtonContent}>
                <Image
                  source={require('@/assets/images/google-g-icon.png')}
                  style={styles.googleIcon}
                />
                <Text style={styles.googleButtonText}>{t('auth.signInWithGoogle')}</Text>
              </View>
            )}
          </Pressable>
        </View>

        <Text style={styles.legal}>
          {t('auth.legalText')}
        </Text>

        {__DEV__ && (
          <View style={styles.devButtons}>
            <Pressable
              style={styles.devButton}
              onPress={() => devLogin(false)}>
              <Text style={styles.devButtonText}>Dev Login (Onboarding)</Text>
            </Pressable>
            <Pressable
              style={styles.devButton}
              onPress={() => devLogin(true)}>
              <Text style={styles.devButtonText}>Dev Login (Home)</Text>
            </Pressable>
          </View>
        )}
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
    paddingTop: 100,
  },
  logo: {
    fontSize: fontSize.hero,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  tagline: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
  },
  buttons: {
    gap: spacing.md,
  },
  appleButton: {
    backgroundColor: colors.text,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    height: 52,
    justifyContent: 'center',
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: GOOGLE_BUTTON.background,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GOOGLE_BUTTON.border,
    height: GOOGLE_BUTTON.height,
    justifyContent: 'center',
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  googleIcon: {
    width: 18,
    height: 18,
  },
  googleButtonText: {
    color: GOOGLE_BUTTON.text,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: Platform.select({ ios: undefined, default: 'Roboto' }),
  },
  legal: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingBottom: spacing.lg,
  },
  devButtons: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  devButton: {
    backgroundColor: colors.textTertiary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  devButtonText: {
    color: '#FFFFFF',
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
});
