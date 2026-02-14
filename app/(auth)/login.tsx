import { useState } from 'react';
import { StyleSheet, View, Text, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { colors, spacing, fontSize, borderRadius } from '@/src/config/theme';
import { APP_NAME, APP_SUBTITLE } from '@/src/config/constants';
import { useAuthStore } from '@/src/features/auth/stores/auth-store';

export default function LoginScreen() {
  const { signInWithApple, signInWithGoogle, devLogin } = useAuthStore();
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
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>{APP_NAME}</Text>
          <Text style={styles.tagline}>{APP_SUBTITLE}</Text>
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

        <Text style={styles.legal}>
          続行することで、利用規約とプライバシーポリシーに同意します
        </Text>

        {__DEV__ && (
          <View style={styles.devButtons}>
            <Pressable
              style={styles.devButton}
              onPress={() => devLogin(false)}>
              <Text style={styles.devButtonText}>Dev Login (オンボーディングから)</Text>
            </Pressable>
            <Pressable
              style={styles.devButton}
              onPress={() => devLogin(true)}>
              <Text style={styles.devButtonText}>Dev Login (ホームへ直接)</Text>
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
