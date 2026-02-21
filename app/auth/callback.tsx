import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/src/services/supabase/client';
import { getCurrentProfile } from '@/src/services/supabase/auth';
import { useAuthStore } from '@/src/features/auth/stores/auth-store';
import { useUser } from '@/src/shared/hooks/use-user';
import { checkSubscriptionStatus } from '@/src/services/revenuecat/client';
import { useSubscription } from '@/src/shared/hooks/use-subscription';

type CallbackStatus = 'loading' | 'error';

/**
 * OAuth コールバック画面
 *
 * Web OAuth redirect フローで provider からリダイレクトされた後に表示される。
 * Supabase の detectSessionInUrl: true により、URL の code/token は
 * supabase.auth.getSession() 呼び出し時に自動的に処理される。
 *
 * フロー:
 * 1. URL の error パラメータ確認（provider がエラーを返した場合）
 * 2. Supabase セッション確立を待機
 * 3. プロフィール取得 → auth-store に反映
 * 4. onboarding_completed 判定 → 適切な画面へ遷移
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    error?: string;
    error_description?: string;
    error_code?: string;
  }>();

  const [status, setStatus] = useState<CallbackStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    const handleCallback = async () => {
      // 1. Provider からのエラーパラメータ確認
      if (params.error) {
        const description = params.error_description
          ? decodeURIComponent(params.error_description)
          : 'ログインに失敗しました';
        if (!cancelled) {
          setErrorMessage(description);
          setStatus('error');
        }
        return;
      }

      try {
        // 2. Supabase がURLからセッションを確立するまで待機
        // detectSessionInUrl: true により getSession() がハッシュ/クエリを処理する
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session?.user) {
          if (!cancelled) {
            setErrorMessage('セッションの確立に失敗しました');
            setStatus('error');
          }
          return;
        }

        const user = data.session.user;

        // 3. プロフィール取得
        const profile = await getCurrentProfile(user.id);
        if (!profile) {
          if (!cancelled) {
            setErrorMessage('プロフィールの取得に失敗しました');
            setStatus('error');
          }
          return;
        }

        if (cancelled) return;

        // 4. auth-store と user-store に反映
        useUser.getState().setUser(profile);

        const entitlement = await checkSubscriptionStatus();
        useSubscription.getState().setEntitlement(entitlement);
        useSubscription.getState().setLoading(false);

        // isAuthenticated を true にセット
        useAuthStore.setState({ isAuthenticated: true, isGuest: false, isLoading: false });

        if (cancelled) return;

        // 5. オンボーディング判定 → 遷移
        if (!profile.onboardingCompleted) {
          router.replace('/(onboarding)/welcome');
        } else {
          router.replace('/(tabs)');
        }
      } catch (err) {
        console.error('[AuthCallback] error:', err);
        if (!cancelled) {
          setErrorMessage('ログイン処理中にエラーが発生しました');
          setStatus('error');
        }
      }
    };

    handleCallback();

    return () => {
      cancelled = true;
    };
  }, [params.error, params.error_description, router]);

  const handleReturnToLogin = () => {
    router.replace('/(auth)/login');
  };

  if (status === 'error') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>ログインエラー</Text>
        <Text style={styles.errorMessage}>{errorMessage}</Text>
        <Text style={styles.returnLink} onPress={handleReturnToLogin}>
          ログイン画面に戻る
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#7DD5FC" />
      <Text style={styles.loadingText}>ログイン処理中...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A1A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 16,
    marginTop: 12,
  },
  errorTitle: {
    color: '#F87171',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorMessage: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  returnLink: {
    color: '#7DD5FC',
    fontSize: 15,
    textDecorationLine: 'underline',
    marginTop: 8,
  },
});
