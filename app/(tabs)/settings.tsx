import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, ActivityIndicator, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';

import { CosmicBackground } from '@/src/shared/components/cosmic-background';
import { colors, spacing, borderRadius, fontSize, fontFamily } from '@/src/config/theme';
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

const STATUS_ICON_CONFIG: Record<OpenClawStatus, { labelKey: string; color: string; icon: React.ComponentProps<typeof Feather>['name'] }> = {
  provisioning: { labelKey: 'settings.instance.statusProvisioning', color: colors.warning, icon: 'clock' },
  running: { labelKey: 'settings.instance.statusRunning', color: colors.success, icon: 'check-circle' },
  stopped: { labelKey: 'settings.instance.statusStopped', color: colors.textTertiary, icon: 'stop-circle' },
  error: { labelKey: 'settings.instance.statusError', color: colors.error, icon: 'alert-circle' },
  destroying: { labelKey: 'settings.instance.statusDestroying', color: colors.warning, icon: 'clock' },
};

const GUEST_FEATURE_KEYS = [
  { icon: 'message-circle' as const, key: 'guest.features.chat' },
  { icon: 'user' as const, key: 'guest.features.quiz' },
  { icon: 'book' as const, key: 'guest.features.journal' },
  { icon: 'bar-chart-2' as const, key: 'guest.features.insights' },
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
    <CosmicBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
        >
          <Text style={styles.title}>AltMe</Text>

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
                      <Feather name="smartphone" size={16} color="#FFFFFF" />
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
                    <Feather name="globe" size={16} color={colors.text} />
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
                <Feather name={feature.icon} size={18} color={colors.textTertiary} />
                <Text style={styles.guestFeatureLabel}>{t(feature.key)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.support.title')}</Text>
            <SettingRow icon="help-circle" label={t('settings.support.help')} onPress={() => Linking.openURL(HELP_URL)} />
            <SettingRow icon="file-text" label={t('settings.support.terms')} onPress={() => Linking.openURL(TERMS_URL)} />
            <SettingRow icon="shield" label={t('settings.support.privacy')} onPress={() => Linking.openURL(PRIVACY_URL)} />
          </View>

          <Text style={styles.version}>{APP_NAME} v{appVersion}</Text>
        </ScrollView>
      </SafeAreaView>
    </CosmicBackground>
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

  // OpenClaw instance state (must be before any conditional returns)
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

  if (!isAuthenticated) {
    return <GuestSettingsScreen />;
  }

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
    <CosmicBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
        >
          <Text style={styles.title}>AltMe</Text>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Feather name="user" size={28} color={colors.primary} />
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.profileNameRow}>
                <Text style={styles.profileName}>{user?.displayName || t('settings.guest')}</Text>
                {isPro && (
                  <View style={styles.proBadge}>
                    <Text style={styles.proBadgeText}>Pro</Text>
                  </View>
                )}
              </View>
              <Text style={styles.profileEmail}>{user?.email || ''}</Text>
            </View>
          </View>

          {/* Settings List */}
          <View style={styles.settingsList}>
            <SettingRow
              icon="bell"
              label={t('settings.notifications.title')}
              onPress={handleNotificationSettings}
            />
            <SettingRow
              icon="shield"
              label={t('settings.support.privacy')}
              onPress={handleOpenPrivacy}
            />
            <SettingRow
              icon="settings"
              label={t('settings.twinSettings.title')}
              subtitle={t('settings.twinSettings.subtitle')}
              onPress={handleEditTwinName}
            />
            <SettingRow
              icon="globe"
              label={t('settings.language')}
              onPress={() => Alert.alert(t('settings.language'), t('settings.languageComingSoon'))}
            />
            <SettingRow
              icon="help-circle"
              label={t('settings.support.help')}
              onPress={handleOpenHelp}
            />
          </View>

          {/* Logout Button */}
          <Pressable style={styles.logoutButton} onPress={handleSignOut}>
            <Text style={styles.logoutText}>{t('settings.account.logout')}</Text>
          </Pressable>

          {/* Delete Account Link */}
          <Pressable onPress={() => Alert.alert(t('settings.account.delete'), t('settings.account.deleteConfirm'))}>
            <Text style={styles.deleteAccountText}>
              {t('settings.account.deleteAccount')}
            </Text>
          </Pressable>

          <Text style={styles.version}>{APP_NAME} v{appVersion}</Text>
        </ScrollView>
      </SafeAreaView>
    </CosmicBackground>
  );
}

function SettingRow({
  icon,
  label,
  subtitle,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress}>
      <Feather name={icon} size={20} color={colors.text} />
      <View style={styles.settingRowContent}>
        <Text style={styles.settingLabel}>{label}</Text>
        {subtitle ? (
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
      <Feather name="chevron-right" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: 24,
    fontFamily: fontFamily.bold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  profileCard: {
    backgroundColor: '#FFFFFF08',
    borderRadius: 16,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  profileName: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bold,
    color: colors.text,
  },
  proBadge: {
    backgroundColor: colors.accent,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  proBadgeText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bold,
    color: colors.textInverse,
  },
  profileEmail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  settingsList: {
    marginBottom: spacing.xl,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#FFFFFF0A',
    gap: spacing.md,
  },
  settingRowContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.medium,
    color: colors.text,
  },
  settingSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    borderColor: colors.error,
    borderWidth: 1,
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoutText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semiBold,
    color: colors.error,
  },
  deleteAccountText: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  version: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textAlign: 'center',
  },

  // Guest settings styles
  guestLoginCard: {
    backgroundColor: '#FFFFFF08',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  guestLoginTitle: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
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
    backgroundColor: '#000000',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    height: 52,
    justifyContent: 'center',
  },
  guestAppleButtonText: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontFamily: fontFamily.semiBold,
  },
  guestGoogleButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#747775',
    height: 52,
    justifyContent: 'center',
  },
  guestGoogleButtonText: {
    color: '#1F1F1F',
    fontSize: fontSize.md,
    fontFamily: fontFamily.semiBold,
  },
  guestFeatureSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semiBold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  guestFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#FFFFFF0A',
    gap: spacing.md,
  },
  guestFeatureLabel: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textTertiary,
  },
  section: {
    marginBottom: spacing.lg,
  },
});
