import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/features/auth/stores/auth-store';
import { useSubscription } from '@/src/shared/hooks/use-subscription';

const REDIRECT_DELAY_MS = 3000;

/**
 * Stripe Checkout 成功後のページ
 *
 * フロー:
 * 1. サブスクリプション状態を Supabase DB から再取得して更新
 * 2. 3秒後にメインタブへリダイレクト
 */
export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const verifyAndRedirect = async () => {
      try {
        // サブスクリプション状態を Supabase DB から最新化
        if (isAuthenticated) {
          await useSubscription.getState().refreshStatus();
        }
      } catch (err) {
        console.warn('[PaymentSuccess] subscription refresh failed:', err);
      } finally {
        setIsVerifying(false);
        // 3秒後にメインタブへ遷移
        timer = setTimeout(() => {
          router.replace('/(tabs)');
        }, REDIRECT_DELAY_MS);
      }
    };

    verifyAndRedirect();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isAuthenticated, router]);

  const handleGoNow = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container} testID="payment-success-screen">
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{'✓'}</Text>
      </View>

      <Text style={styles.title}>{'ご購入ありがとうございます！'}</Text>
      <Text style={styles.subtitle}>{'AltMe Proへようこそ'}</Text>
      <Text style={styles.description}>
        {'あなただけのAI分身が間もなく起動します。\nすべての機能が解放されました。'}
      </Text>

      {isVerifying ? (
        <View style={styles.verifyingContainer}>
          <ActivityIndicator size="small" color="#7DD5FC" />
          <Text style={styles.verifyingText}>{'サブスクリプションを確認中...'}</Text>
        </View>
      ) : (
        <Text style={styles.redirectText}>{'3秒後に自動でホームへ移動します'}</Text>
      )}

      <Text
        style={styles.skipLink}
        onPress={handleGoNow}
        testID="go-to-home-link"
      >
        {'今すぐホームへ →'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A1A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(125,213,252,0.15)',
    borderWidth: 2,
    borderColor: '#7DD5FC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 36,
    color: '#7DD5FC',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#7DD5FC',
    textAlign: 'center',
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 4,
  },
  verifyingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  verifyingText: {
    fontSize: 13,
    color: '#64748B',
  },
  redirectText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },
  skipLink: {
    fontSize: 15,
    color: '#7DD5FC',
    textDecorationLine: 'underline',
    marginTop: 8,
  },
});
