import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, ActivityIndicator, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';

import { colors, spacing, borderRadius, fontSize } from '@/src/config/theme';
import { useSubscription, useIsPro } from '@/src/shared/hooks/use-subscription';
import { useUser } from '@/src/shared/hooks/use-user';
import { useAuthStore } from '@/src/features/auth/stores/auth-store';
import { supabase } from '@/src/services/supabase/client';
import { APP_NAME } from '@/src/config/constants';
import {
  getMyInstance,
  restartInstance,
  updateSoulMd,
  subscribeToInstanceChanges,
} from '@/src/services/openclaw/client';
import type { OpenClawInstance, OpenClawStatus } from '@/src/shared/types/openclaw';

const HELP_URL = 'https://altme.app/help';
const TERMS_URL = 'https://altme.app/terms';
const PRIVACY_URL = 'https://altme.app/privacy';

const STATUS_CONFIG: Record<OpenClawStatus, { label: string; color: string; icon: React.ComponentProps<typeof FontAwesome>['name'] }> = {
  provisioning: { label: 'セットアップ中...', color: colors.warning, icon: 'clock-o' },
  running: { label: '稼働中', color: colors.success, icon: 'check-circle' },
  stopped: { label: '停止中', color: colors.textTertiary, icon: 'stop-circle' },
  error: { label: 'エラー', color: colors.error, icon: 'exclamation-circle' },
  destroying: { label: '削除中...', color: colors.warning, icon: 'clock-o' },
};

const GUEST_FEATURES = [
  { icon: 'comments' as const, label: 'AIチャット' },
  { icon: 'user' as const, label: '性格診断' },
  { icon: 'book' as const, label: '日記+AI振り返り' },
  { icon: 'line-chart' as const, label: '感情トラッキング' },
];

function GuestSettingsScreen() {
  const signInWithApple = useAuthStore((s) => s.signInWithApple);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>設定</Text>

        <View style={styles.guestLoginCard}>
          <Text style={styles.guestLoginTitle}>ログインして始めよう</Text>
          <Text style={styles.guestLoginSubtitle}>AIツインがあなたを待っています</Text>

          <View style={styles.guestButtons}>
            {Platform.OS === 'ios' && (
              <Pressable
                style={styles.guestAppleButton}
                onPress={handleAppleSignIn}
                disabled={isSigningIn !== null}>
                {isSigningIn === 'apple' ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.guestAppleButtonText}>
                    <FontAwesome name="apple" size={16} color="#FFFFFF" />
                    {'  Appleでサインイン'}
                  </Text>
                )}
              </Pressable>
            )}

            <Pressable
              style={styles.guestGoogleButton}
              onPress={handleGoogleSignIn}
              disabled={isSigningIn !== null}>
              {isSigningIn === 'google' ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Text style={styles.guestGoogleButtonText}>
                  <FontAwesome name="google" size={16} color={colors.text} />
                  {'  Googleでサインイン'}
                </Text>
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.guestFeatureSection}>
          <Text style={styles.sectionTitle}>ログインで利用可能</Text>
          {GUEST_FEATURES.map((feature) => (
            <View key={feature.label} style={styles.guestFeatureRow}>
              <FontAwesome name={feature.icon} size={18} color={colors.textTertiary} />
              <Text style={styles.guestFeatureLabel}>{feature.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>サポート</Text>
          <SettingRow icon="question-circle" label="ヘルプ・FAQ" onPress={() => Linking.openURL('https://altme.app/help')} />
          <SettingRow icon="file-text" label="利用規約" onPress={() => Linking.openURL('https://altme.app/terms')} />
          <SettingRow icon="lock" label="プライバシーポリシー" onPress={() => Linking.openURL('https://altme.app/privacy')} />
        </View>

        <Text style={styles.version}>{APP_NAME} v{appVersion}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const isPro = useIsPro();
  const user = useUser((s) => s.user);
  const updateUser = useUser((s) => s.updateUser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const signOut = useAuthStore((s) => s.signOut);
  const entitlement = useSubscription((s) => s.entitlement);

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  if (!isAuthenticated) {
    return <GuestSettingsScreen />;
  }

  // OpenClaw instance state
  const [instance, setInstance] = useState<OpenClawInstance | null>(null);
  const [isLoadingInstance, setIsLoadingInstance] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

  // Load OpenClaw instance for Pro users
  useEffect(() => {
    if (!isPro || !user?.id) return;

    let unsubscribe: (() => void) | null = null;

    const loadInstance = async () => {
      setIsLoadingInstance(true);
      try {
        const data = await getMyInstance();
        setInstance(data);
      } catch (error) {
        console.error('Failed to load OpenClaw instance:', error);
      } finally {
        setIsLoadingInstance(false);
      }
    };

    loadInstance();

    // Subscribe to real-time updates
    unsubscribe = subscribeToInstanceChanges(user.id, (updated) => {
      setInstance(updated);
    });

    return () => {
      unsubscribe?.();
    };
  }, [isPro, user?.id]);

  const handleEditProfile = () => {
    Alert.prompt(
      'プロフィール編集',
      '新しい表示名を入力してください',
      async (newName: string) => {
        const trimmed = newName.trim();
        if (!trimmed) {
          Alert.alert('エラー', '表示名を入力してください');
          return;
        }
        if (!user) return;
        try {
          await supabase
            .from('profiles')
            .update({ display_name: trimmed })
            .eq('id', user.id);
          updateUser({ displayName: trimmed });
          Alert.alert('完了', '表示名を更新しました');
        } catch {
          Alert.alert('エラー', '更新に失敗しました。もう一度お試しください。');
        }
      },
      'plain-text',
      user?.displayName ?? '',
    );
  };

  const handleEditTwinName = () => {
    Alert.prompt(
      'ツインの名前を変更',
      'AIツインの新しい名前を入力してください',
      async (newName: string) => {
        const trimmed = newName.trim();
        if (!trimmed) {
          Alert.alert('エラー', '名前を入力してください');
          return;
        }
        if (!user) return;
        try {
          await supabase
            .from('profiles')
            .update({ twin_name: trimmed })
            .eq('id', user.id);
          updateUser({ twinName: trimmed });

          // Update SOUL.md if instance is running
          if (instance?.status === 'running') {
            updateSoulMd().catch((err) =>
              console.error('Failed to update SOUL.md:', err),
            );
          }

          Alert.alert('完了', 'ツインの名前を更新しました');
        } catch {
          Alert.alert('エラー', '更新に失敗しました。もう一度お試しください。');
        }
      },
      'plain-text',
      user?.twinName ?? '',
    );
  };

  const handleRetakePersonalityQuiz = () => {
    Alert.alert(
      '性格診断をやり直す',
      '現在の診断結果はリセットされます。よろしいですか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'やり直す',
          style: 'destructive',
          onPress: () => {
            router.push('/(onboarding)/personality-quiz');
          },
        },
      ],
    );
  };

  const handleSubscriptionManage = () => {
    router.push('/subscription-manage' as never);
  };

  const handleNotificationSettings = () => {
    Alert.alert('通知設定', '現在準備中です。今後のアップデートをお待ちください。');
  };

  const handleRestartInstance = useCallback(async () => {
    Alert.alert(
      'インスタンスを再起動',
      'AIツインのサーバーを再起動しますか？再起動中はチャットが一時的に利用できなくなります。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '再起動',
          onPress: async () => {
            setIsRestarting(true);
            try {
              const result = await restartInstance();
              if (result.success) {
                Alert.alert('再起動開始', 'インスタンスの再起動を開始しました。しばらくお待ちください。');
              } else {
                Alert.alert('エラー', result.error || '再起動に失敗しました。');
              }
            } catch {
              Alert.alert('エラー', '再起動に失敗しました。もう一度お試しください。');
            } finally {
              setIsRestarting(false);
            }
          },
        },
      ],
    );
  }, []);

  const handleSignOut = () => {
    Alert.alert('ログアウト', '本当にログアウトしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'ログアウト',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login' as never);
        },
      },
    ]);
  };

  const handleOpenHelp = () => {
    Linking.openURL(HELP_URL);
  };

  const handleOpenTerms = () => {
    Linking.openURL(TERMS_URL);
  };

  const handleOpenPrivacy = () => {
    Linking.openURL(PRIVACY_URL);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>設定</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <FontAwesome name="user" size={24} color={colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.displayName || 'ゲスト'}</Text>
            {user?.twinName && (
              <Text style={styles.twinNameLabel}>ツイン: {user.twinName}</Text>
            )}
          </View>
        </View>

        <View style={styles.subscriptionCard}>
          <View style={styles.subscriptionHeader}>
            <Text style={styles.subscriptionTitle}>{isPro ? 'Pro プラン' : 'Free プラン'}</Text>
            {isPro && (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            )}
          </View>
          {isPro ? (
            <View style={styles.creditsRow}>
              <Text style={styles.creditsLabel}>プラン：</Text>
              <Text style={styles.creditsValue}>{entitlement.planType === 'annual' ? '年額' : '月額'}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => router.push('/(paywall)' as never)}>
              <Text style={styles.upgradeText}>Pro にアップグレード</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* OpenClaw Instance Status Card (Pro only) */}
        {isPro && (
          <View style={styles.instanceCard}>
            <View style={styles.instanceHeader}>
              <Text style={styles.instanceTitle}>AIツインサーバー</Text>
              {isLoadingInstance && (
                <ActivityIndicator size="small" color={colors.textSecondary} />
              )}
            </View>
            {instance ? (
              <>
                <View style={styles.instanceStatusRow}>
                  <FontAwesome
                    name={STATUS_CONFIG[instance.status].icon}
                    size={16}
                    color={STATUS_CONFIG[instance.status].color}
                  />
                  <Text style={[styles.instanceStatusText, { color: STATUS_CONFIG[instance.status].color }]}>
                    {STATUS_CONFIG[instance.status].label}
                  </Text>
                  {instance.status === 'provisioning' && (
                    <ActivityIndicator size="small" color={colors.warning} style={{ marginLeft: spacing.xs }} />
                  )}
                </View>
                {instance.status === 'error' && instance.errorMessage && (
                  <Text style={styles.instanceErrorText}>{instance.errorMessage}</Text>
                )}
                {(instance.status === 'error' || instance.status === 'running') && (
                  <TouchableOpacity
                    style={[styles.restartButton, isRestarting && styles.restartButtonDisabled]}
                    onPress={handleRestartInstance}
                    disabled={isRestarting}>
                    <FontAwesome name="refresh" size={14} color={colors.textInverse} />
                    <Text style={styles.restartButtonText}>
                      {isRestarting ? '再起動中...' : '再起動'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              !isLoadingInstance && (
                <Text style={styles.instanceNotFound}>インスタンスが見つかりません</Text>
              )
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アカウント</Text>
          <SettingRow icon="user" label="プロフィール編集" onPress={handleEditProfile} />
          {isPro && (
            <SettingRow icon="credit-card" label="サブスクリプション管理" onPress={handleSubscriptionManage} />
          )}
          <SettingRow icon="bell" label="通知設定" onPress={handleNotificationSettings} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AIツイン</Text>
          <SettingRow icon="refresh" label="性格診断をやり直す" onPress={handleRetakePersonalityQuiz} />
          <SettingRow icon="edit" label="ツインの名前を変更" onPress={handleEditTwinName} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>サポート</Text>
          <SettingRow icon="question-circle" label="ヘルプ・FAQ" onPress={handleOpenHelp} />
          <SettingRow icon="file-text" label="利用規約" onPress={handleOpenTerms} />
          <SettingRow icon="lock" label="プライバシーポリシー" onPress={handleOpenPrivacy} />
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>ログアウト</Text>
        </TouchableOpacity>

        <Text style={styles.version}>{APP_NAME} v{appVersion}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress}>
      <FontAwesome name={icon} size={18} color={colors.textSecondary} />
      <Text style={styles.settingLabel}>{label}</Text>
      <FontAwesome name="chevron-right" size={12} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  title: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.text, marginBottom: spacing.lg },
  profileCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceSecondary, borderRadius: borderRadius.lg,
    padding: spacing.md, marginBottom: spacing.md,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.primaryLight + '30',
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.md,
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  twinNameLabel: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  subscriptionCard: {
    backgroundColor: colors.surfaceSecondary, borderRadius: borderRadius.lg,
    padding: spacing.md, marginBottom: spacing.md,
  },
  subscriptionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  subscriptionTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  proBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  proBadgeText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textInverse },
  creditsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  creditsLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  creditsValue: { fontSize: fontSize.md, fontWeight: '700', color: colors.primary },
  upgradeButton: {
    backgroundColor: colors.primary, paddingVertical: spacing.sm,
    borderRadius: borderRadius.md, alignItems: 'center',
  },
  upgradeText: { color: colors.textInverse, fontSize: fontSize.md, fontWeight: '600' },

  // OpenClaw Instance Card
  instanceCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  instanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  instanceTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  instanceStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  instanceStatusText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  instanceErrorText: {
    fontSize: fontSize.xs,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  instanceNotFound: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
  },
  restartButtonDisabled: {
    opacity: 0.6,
  },
  restartButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textInverse,
  },

  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.md, borderBottomWidth: 1,
    borderBottomColor: colors.borderLight, gap: spacing.md,
  },
  settingLabel: { flex: 1, fontSize: fontSize.md, color: colors.text },
  signOutButton: { paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.md },
  signOutText: { fontSize: fontSize.md, color: colors.error, fontWeight: '600' },
  version: { fontSize: fontSize.xs, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.md },

  // Guest settings styles
  guestLoginCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  guestLoginTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  guestLoginSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  guestButtons: {
    width: '100%',
    gap: spacing.md,
  },
  guestAppleButton: {
    backgroundColor: colors.text,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    height: 52,
    justifyContent: 'center',
  },
  guestAppleButtonText: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  guestGoogleButton: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    height: 52,
    justifyContent: 'center',
  },
  guestGoogleButtonText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  guestFeatureSection: {
    marginBottom: spacing.lg,
  },
  guestFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.md,
  },
  guestFeatureLabel: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textTertiary,
  },
});
