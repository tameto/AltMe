import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, ActivityIndicator, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';

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

const STATUS_ICON_CONFIG: Record<OpenClawStatus, { labelKey: string; color: string; icon: React.ComponentProps<typeof FontAwesome>['name'] }> = {
  provisioning: { labelKey: 'settings.instance.statusProvisioning', color: colors.warning, icon: 'clock-o' },
  running: { labelKey: 'settings.instance.statusRunning', color: colors.success, icon: 'check-circle' },
  stopped: { labelKey: 'settings.instance.statusStopped', color: colors.textTertiary, icon: 'stop-circle' },
  error: { labelKey: 'settings.instance.statusError', color: colors.error, icon: 'exclamation-circle' },
  destroying: { labelKey: 'settings.instance.statusDestroying', color: colors.warning, icon: 'clock-o' },
};

const GUEST_FEATURE_KEYS = [
  { icon: 'comments' as const, key: 'guest.features.chat' },
  { icon: 'user' as const, key: 'guest.features.quiz' },
  { icon: 'book' as const, key: 'guest.features.journal' },
  { icon: 'line-chart' as const, key: 'guest.features.insights' },
];

function GuestSettingsScreen() {
  const { t } = useTranslation();
  const signInWithApple = useAuthStore((s) => s.signInWithApple);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const [isSigningIn, setIsSigningIn] = useState<'apple' | 'google' | null>(null);

  const handleAppleSignIn = async () => {
    try {
      setIsSigningIn('apple');
      await signInWithApple();
    } catch {
      Alert.alert(t('common.error'), t('settings.loginError.apple'));
    } finally {
      setIsSigningIn(null);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn('google');
      await signInWithGoogle();
    } catch {
      Alert.alert(t('common.error'), t('settings.loginError.google'));
    } finally {
      setIsSigningIn(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('settings.settingsTitle')}</Text>

        <View style={styles.guestLoginCard}>
          <Text style={styles.guestLoginTitle}>{t('guest.title')}</Text>
          <Text style={styles.guestLoginSubtitle}>{t('guest.subtitle')}</Text>

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
                    {'  '}{t('auth.signInWithApple')}
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
                  {'  '}{t('auth.signInWithGoogle')}
                </Text>
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.guestFeatureSection}>
          <Text style={styles.sectionTitle}>{t('settings.guestLogin.availableFeatures')}</Text>
          {GUEST_FEATURE_KEYS.map((feature) => (
            <View key={feature.key} style={styles.guestFeatureRow}>
              <FontAwesome name={feature.icon} size={18} color={colors.textTertiary} />
              <Text style={styles.guestFeatureLabel}>{t(feature.key)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.support.title')}</Text>
          <SettingRow icon="question-circle" label={t('settings.support.help')} onPress={() => Linking.openURL(HELP_URL)} />
          <SettingRow icon="file-text" label={t('settings.support.terms')} onPress={() => Linking.openURL(TERMS_URL)} />
          <SettingRow icon="lock" label={t('settings.support.privacy')} onPress={() => Linking.openURL(PRIVACY_URL)} />
        </View>

        <Text style={styles.version}>{APP_NAME} v{appVersion}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function SettingsScreen() {
  const { t } = useTranslation();
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
      t('settings.profile.editTitle'),
      t('settings.profile.editPrompt'),
      async (newName: string) => {
        const trimmed = newName.trim();
        if (!trimmed) {
          Alert.alert(t('common.error'), t('settings.profile.editEmpty'));
          return;
        }
        if (!user) return;
        try {
          await supabase
            .from('profiles')
            .update({ display_name: trimmed })
            .eq('id', user.id);
          updateUser({ displayName: trimmed });
          Alert.alert(t('common.done'), t('settings.profile.editSuccess'));
        } catch {
          Alert.alert(t('common.error'), t('settings.profile.editError'));
        }
      },
      'plain-text',
      user?.displayName ?? '',
    );
  };

  const handleEditTwinName = () => {
    Alert.prompt(
      t('settings.twinSettings.editNameTitle'),
      t('settings.twinSettings.editNamePrompt'),
      async (newName: string) => {
        const trimmed = newName.trim();
        if (!trimmed) {
          Alert.alert(t('common.error'), t('settings.twinSettings.editNameEmpty'));
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

          Alert.alert(t('common.done'), t('settings.twinSettings.editNameSuccess'));
        } catch {
          Alert.alert(t('common.error'), t('settings.twinSettings.editNameError'));
        }
      },
      'plain-text',
      user?.twinName ?? '',
    );
  };

  const handleRetakePersonalityQuiz = () => {
    Alert.alert(
      t('settings.twinSettings.retakeQuizTitle'),
      t('settings.twinSettings.retakeQuizMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.twinSettings.retakeQuizConfirm'),
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
    Alert.alert(t('settings.notifications.title'), t('settings.notifications.comingSoon'));
  };

  const handleRestartInstance = useCallback(async () => {
    Alert.alert(
      t('settings.instance.restartTitle'),
      t('settings.instance.restartMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.instance.restart'),
          onPress: async () => {
            setIsRestarting(true);
            try {
              const result = await restartInstance();
              if (result.success) {
                Alert.alert(t('settings.instance.restartStarted'), t('settings.instance.restartStartedMessage'));
              } else {
                Alert.alert(t('common.error'), result.error || t('settings.instance.restartError'));
              }
            } catch {
              Alert.alert(t('common.error'), t('settings.instance.restartError'));
            } finally {
              setIsRestarting(false);
            }
          },
        },
      ],
    );
  }, [t]);

  const handleSignOut = () => {
    Alert.alert(t('settings.account.logout'), t('settings.account.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.account.logout'),
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
        <Text style={styles.title}>{t('settings.settingsTitle')}</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <FontAwesome name="user" size={24} color={colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.displayName || t('settings.guest')}</Text>
            {user?.twinName ? (
              <Text style={styles.twinNameLabel}>{t('settings.twinLabel', { name: user.twinName })}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.subscriptionCard}>
          <View style={styles.subscriptionHeader}>
            <Text style={styles.subscriptionTitle}>{isPro ? t('settings.proPlan') : t('settings.freePlan')}</Text>
            {isPro && (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            )}
          </View>
          {isPro ? (
            <View style={styles.creditsRow}>
              <Text style={styles.creditsLabel}>{t('settings.planLabel')}</Text>
              <Text style={styles.creditsValue}>{entitlement.planType === 'annual' ? t('settings.planAnnual') : t('settings.planMonthly')}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => router.push('/(paywall)' as never)}>
              <Text style={styles.upgradeText}>{t('settings.upgradeToPro')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* OpenClaw Instance Status Card (Pro only) */}
        {isPro && (
          <View style={styles.instanceCard}>
            <View style={styles.instanceHeader}>
              <Text style={styles.instanceTitle}>{t('settings.instance.title')}</Text>
              {isLoadingInstance && (
                <ActivityIndicator size="small" color={colors.textSecondary} />
              )}
            </View>
            {instance ? (
              <>
                <View style={styles.instanceStatusRow}>
                  <FontAwesome
                    name={STATUS_ICON_CONFIG[instance.status].icon}
                    size={16}
                    color={STATUS_ICON_CONFIG[instance.status].color}
                  />
                  <Text style={[styles.instanceStatusText, { color: STATUS_ICON_CONFIG[instance.status].color }]}>
                    {t(STATUS_ICON_CONFIG[instance.status].labelKey)}
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
                      {isRestarting ? t('settings.instance.restarting') : t('settings.instance.restart')}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              !isLoadingInstance && (
                <Text style={styles.instanceNotFound}>{t('settings.instance.notFound')}</Text>
              )
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.account.title')}</Text>
          <SettingRow icon="user" label={t('settings.profile.edit')} onPress={handleEditProfile} />
          {isPro && (
            <SettingRow icon="credit-card" label={t('settings.subscription')} onPress={handleSubscriptionManage} />
          )}
          <SettingRow icon="bell" label={t('settings.notifications.title')} onPress={handleNotificationSettings} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.twinSettings.title')}</Text>
          <SettingRow icon="refresh" label={t('settings.twinSettings.retakeQuiz')} onPress={handleRetakePersonalityQuiz} />
          <SettingRow icon="edit" label={t('settings.twinSettings.editName')} onPress={handleEditTwinName} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.support.title')}</Text>
          <SettingRow icon="question-circle" label={t('settings.support.help')} onPress={handleOpenHelp} />
          <SettingRow icon="file-text" label={t('settings.support.terms')} onPress={handleOpenTerms} />
          <SettingRow icon="lock" label={t('settings.support.privacy')} onPress={handleOpenPrivacy} />
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>{t('settings.account.logout')}</Text>
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
