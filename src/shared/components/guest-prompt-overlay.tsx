import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Feather from '@expo/vector-icons/Feather';
import { useTranslation } from 'react-i18next';

import { colors, spacing, fontSize, borderRadius, fontFamily } from '@/src/config/theme';
import { useAuthStore } from '@/src/features/auth/stores/auth-store';

const FEATURE_KEYS = [
  { icon: 'message-circle' as const, key: 'guest.features.chat' },
  { icon: 'user' as const, key: 'guest.features.quiz' },
  { icon: 'book-open' as const, key: 'guest.features.journal' },
  { icon: 'trending-up' as const, key: 'guest.features.insights' },
];

export function GuestPromptOverlay() {
  const { t } = useTranslation();
  const signInWithApple = useAuthStore((s) => s.signInWithApple);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
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
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('guest.title')}</Text>
          <Text style={styles.subtitle}>{t('guest.subtitle')}</Text>
        </View>

        <View style={styles.featureList}>
          {FEATURE_KEYS.map((feature) => (
            <View key={feature.key} style={styles.featureRow}>
              <Feather
                name={feature.icon}
                size={16}
                color={colors.primary}
              />
              <Text style={styles.featureLabel}>{t(feature.key)}</Text>
            </View>
          ))}
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
              <ActivityIndicator color="#1F1F1F" />
            ) : (
              <Text style={styles.googleButtonText}>
                <FontAwesome name="google" size={16} color="#1F1F1F" />
                {'  '}{t('auth.signInWithGoogle')}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
  },
  featureList: {
    width: '100%',
    backgroundColor: '#FFFFFF08',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#FFFFFF15',
    padding: spacing.md,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureLabel: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: '#94A3B8',
  },
  buttons: {
    width: '100%',
    gap: spacing.md,
  },
  appleButton: {
    backgroundColor: '#000000',
    borderRadius: 14,
    alignItems: 'center',
    height: 54,
    justifyContent: 'center',
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontFamily: fontFamily.semiBold,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7DD3FC80',
    height: 54,
    justifyContent: 'center',
  },
  googleButtonText: {
    color: '#1F1F1F',
    fontSize: fontSize.md,
    fontFamily: fontFamily.semiBold,
  },
});
