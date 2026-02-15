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

import { colors, spacing, fontSize, borderRadius } from '@/src/config/theme';
import { useAuthStore } from '@/src/features/auth/stores/auth-store';

const FEATURES = [
  { icon: 'comments' as const, label: 'AIチャット' },
  { icon: 'user' as const, label: '性格診断' },
  { icon: 'book' as const, label: '日記+AI振り返り' },
  { icon: 'line-chart' as const, label: '感情トラッキング' },
];

export function GuestPromptOverlay() {
  const signInWithApple = useAuthStore((s) => s.signInWithApple);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const [isSigningIn, setIsSigningIn] = useState<'apple' | 'google' | null>(null);

  const handleAppleSignIn = async () => {
    try {
      setIsSigningIn('apple');
      await signInWithApple();
    } catch {
      Alert.alert('エラー', 'Apple でのログインに失敗しました。もう一度お試しください。');
    } finally {
      setIsSigningIn(null);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn('google');
      await signInWithGoogle();
    } catch {
      Alert.alert('エラー', 'Google でのログインに失敗しました。もう一度お試しください。');
    } finally {
      setIsSigningIn(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>ログインして始めよう</Text>
          <Text style={styles.subtitle}>AIツインがあなたを待っています</Text>
        </View>

        <View style={styles.featureList}>
          {FEATURES.map((feature) => (
            <View key={feature.label} style={styles.featureRow}>
              <FontAwesome
                name={feature.icon}
                size={16}
                color={colors.textTertiary}
              />
              <Text style={styles.featureLabel}>{feature.label}</Text>
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
                  {'  Appleでサインイン'}
                </Text>
              )}
            </Pressable>
          )}

          <Pressable
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            disabled={isSigningIn !== null}>
            {isSigningIn === 'google' ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.googleButtonText}>
                <FontAwesome name="google" size={16} color={colors.text} />
                {'  Googleでサインイン'}
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
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  featureList: {
    width: '100%',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
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
    color: colors.textTertiary,
  },
  buttons: {
    width: '100%',
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
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    height: 52,
    justifyContent: 'center',
  },
  googleButtonText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
