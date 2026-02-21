import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

/**
 * Stripe Checkout キャンセル後のページ
 *
 * フロー:
 * - キャンセルメッセージを表示
 * - ペイウォール（paywall）画面へ戻るボタン
 * - ホームへ戻るリンク
 */
export default function PaymentCancelScreen() {
  const router = useRouter();

  const handleReturnToPaywall = () => {
    router.replace('/(paywall)');
  };

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container} testID="payment-cancel-screen">
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{'×'}</Text>
      </View>

      <Text style={styles.title}>{'お支払いがキャンセルされました'}</Text>
      <Text style={styles.description}>
        {'いつでもご購入いただけます。\nAltMe Pro でAI分身を起動してみませんか？'}
      </Text>

      <Pressable
        style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        onPress={handleReturnToPaywall}
        testID="return-to-paywall-button"
      >
        <Text style={styles.primaryButtonText}>{'プランを見る'}</Text>
      </Pressable>

      <Text
        style={styles.secondaryLink}
        onPress={handleGoHome}
        testID="go-home-link"
      >
        {'ホームに戻る'}
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
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(248,113,113,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 36,
    color: '#F87171',
    fontWeight: '300',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#7DD5FC',
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 16,
  },
  pressed: {
    opacity: 0.8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A0A1A',
    textAlign: 'center',
  },
  secondaryLink: {
    fontSize: 14,
    color: '#64748B',
    textDecorationLine: 'underline',
    marginTop: 4,
  },
});
