import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, ActivityIndicator, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';

import { LinearGradient } from 'expo-linear-gradient';

import { CosmicBackground } from '@/src/shared/components/cosmic-background';
import { colors, spacing, borderRadius, fontSize, fontFamily } from '@/src/config/theme';
import { useIsPro } from '@/src/shared/hooks/use-subscription';
import { useUser } from '@/src/shared/hooks/use-user';
import { useAuthStore } from '@/src/features/auth/stores/auth-store';
import { usePageTitle } from '@/src/shared/hooks/use-page-title';
import { supabase } from '@/src/services/supabase/client';
import {
  getMyInstance,
  updateSoulMd,
  subscribeToInstanceChanges,
} from '@/src/services/openclaw/client';
import type { OpenClawInstance } from '@/src/shared/types/openclaw';

const HELP_URL = 'https://altme.app/help';
const TERMS_URL = 'https://altme.app/terms';
const PRIVACY_URL = 'https://altme.app/privacy';

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
  const buildNumber = Constants.expoConfig?.ios?.buildNumber ?? Constants.expoConfig?.android?.versionCode?.toString() ?? '1';
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
          testID="guest-settings-screen"
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
        >
          <Text style={styles.title}>AltMe</Text>

          <View style={styles.guestLoginCard}>
            <Text testID="guest-login-title" style={styles.guestLoginTitle}>{t('guest.title')}</Text>
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
            <SettingRow icon="info" label={t('settings.support.help')} onPress={() => Linking.openURL(HELP_URL)} />
            <SettingRow icon="file-text" label={t('settings.support.terms')} onPress={() => Linking.openURL(TERMS_URL)} />
            <SettingRow icon="shield" label={t('settings.support.privacy')} onPress={() => Linking.openURL(PRIVACY_URL)} />
          </View>

          <Text style={styles.version}>v{appVersion} (Build {buildNumber})</Text>
        </ScrollView>
      </SafeAreaView>
    </CosmicBackground>
  );
}

export default function SettingsScreen() {
  const { t } = useTranslation();
  usePageTitle(t('tabs.settings'));
  const router = useRouter();
  const isPro = useIsPro();
  const user = useUser((s) => s.user);
  const updateUser = useUser((s) => s.updateUser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const signOut = useAuthStore((s) => s.signOut);

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const buildNumber = Constants.expoConfig?.ios?.buildNumber ?? Constants.expoConfig?.android?.versionCode?.toString() ?? '1';

  // OpenClaw instance state (must be before any conditional returns)
  const [instance, setInstance] = useState<OpenClawInstance | null>(null);

  // Load OpenClaw instance for Pro users
  useEffect(() => {
    if (!isPro || !user?.id) return;

    let unsubscribe: (() => void) | null = null;

    const loadInstance = async () => {
      try {
        const data = await getMyInstance();
        setInstance(data);
      } catch (error) {
        console.error('Failed to load OpenClaw instance:', error);
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

  const twinSettingsSubtitle = useMemo(() => {
    const parts: string[] = [];

    if (user?.mbtiType) {
      parts.push(t('settings.twinSettingsSub.mbtiLabel', { type: user.mbtiType }));
    } else {
      parts.push(t('settings.twinSettingsSub.mbtiNotSet'));
    }

    if (isPro && instance) {
      if (instance.runtimeState === 'healthy') {
        parts.push(t('settings.twinSettingsSub.openclawConnected'));
      } else if (instance.runtimeState === 'waking') {
        parts.push(t('settings.twinSettingsSub.openclawWaking'));
      } else if (instance.runtimeState === 'error') {
        parts.push(t('settings.twinSettingsSub.openclawError'));
      } else {
        parts.push(t('settings.twinSettingsSub.openclawDisconnected'));
      }
    }

    return parts.join(', ');
  }, [user?.mbtiType, isPro, instance, t]);

  const twinSettingsSubtitleColors = useMemo(() => {
    const colorList: string[] = [];
    // MBTI color
    colorList.push('#7DD3FC');
    // OpenClaw status color
    if (isPro && instance) {
      if (instance.runtimeState === 'healthy') {
        colorList.push('#22C55E');
      } else if (instance.runtimeState === 'error') {
        colorList.push('#EF4444');
      } else {
        colorList.push('#94A3B8');
      }
    }
    return colorList;
  }, [isPro, instance]);

  if (!isAuthenticated) {
    return <GuestSettingsScreen />;
  }

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

          // Update SOUL.md if instance is active
          if (instance?.desiredState === 'active') {
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

  const handleRetakeQuiz = useCallback(() => {
    Alert.alert(
      t('settings.retakeQuizConfirmTitle'),
      t('settings.retakeQuizConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.retakeQuizConfirmButton'),
          onPress: () => router.push('/(onboarding)/personality-quiz'),
        },
      ],
    );
  }, [t, router]);

  const handleSignOut = () => {
    Alert.alert(t('settings.account.logout'), t('settings.account.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.account.logout'),
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
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
          <View testID="profile-card" style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Feather name="user" size={28} color={colors.primary} />
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.profileNameRow}>
                <Text style={styles.profileName}>{user?.displayName || t('settings.guest')}</Text>
                {isPro ? (
                  <View testID="pro-badge" style={styles.proBadge}>
                    <Text style={styles.proBadgeText}>Pro</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.profileEmail}>{user?.email || ''}</Text>
            </View>
            {!isPro ? (
              <Pressable
                testID="upgrade-to-pro-button"
                style={styles.upgradeButton}
                onPress={() => router.push('/(paywall)')}
              >
                <LinearGradient
                  colors={['#E8C567', '#C9A033', '#A07B1A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.upgradeButtonGradient}
                >
                  <Text style={styles.upgradeButtonText}>{t('settings.upgradeToPro')}</Text>
                </LinearGradient>
              </Pressable>
            ) : null}
          </View>

          {/* Settings List */}
          <View style={styles.settingsList}>
            <SettingRow
              testID="setting-row-subscription"
              icon="credit-card"
              label={t('settings.subscriptionManage')}
              onPress={() => router.push('/subscription-manage')}
              accent
            />
            <SettingRow
              testID="setting-row-notifications"
              icon="bell"
              label={t('settings.notifications.title')}
              onPress={() => router.push('/notification-settings')}
            />
            <SettingRow
              testID="setting-row-privacy"
              icon="shield"
              label={t('settings.support.privacy')}
              onPress={() => Linking.openURL(PRIVACY_URL)}
            />
            <SettingRow
              testID="setting-row-twin-settings"
              subtitleTestID="twin-settings-mbti-subtitle"
              icon="settings"
              label={t('settings.twinSettingsWithInfo')}
              subtitle={twinSettingsSubtitle}
              subtitleColors={twinSettingsSubtitleColors}
              onPress={handleEditTwinName}
              accent
            />
            <SettingRow
              testID="setting-row-personality-retake"
              icon="refresh-cw"
              label={t('settings.retakeQuiz')}
              onPress={handleRetakeQuiz}
            />
            <SettingRow
              testID="setting-row-language"
              icon="globe"
              label={t('settings.language')}
              onPress={() => Alert.alert(t('settings.language'), t('settings.languageComingSoon'))}
            />
            <SettingRow
              testID="setting-row-help"
              icon="info"
              label={t('settings.support.help')}
              onPress={() => Linking.openURL(HELP_URL)}
            />
            <SettingRow
              testID="setting-row-terms"
              icon="file-text"
              label={t('settings.termsAndPrivacy')}
              onPress={() => Linking.openURL(TERMS_URL)}
            />
          </View>

          {/* Delete Account Button */}
          <Pressable
            testID="delete-account-link"
            style={styles.deleteAccountButton}
            onPress={() => router.push('/account-delete-confirm')}
          >
            <Text style={styles.deleteAccountText}>
              {t('settings.account.deleteAccount')}
            </Text>
          </Pressable>

          {/* Logout Button */}
          <Pressable testID="logout-button" style={styles.logoutButton} onPress={handleSignOut}>
            <Text style={styles.logoutText}>{t('settings.account.logout')}</Text>
          </Pressable>

          <Text style={styles.version}>v{appVersion} (Build {buildNumber})</Text>
        </ScrollView>
      </SafeAreaView>
    </CosmicBackground>
  );
}

function SettingRow({
  icon,
  label,
  subtitle,
  subtitleColors,
  onPress,
  testID,
  subtitleTestID,
  accent,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  subtitle?: string;
  subtitleColors?: string[];
  onPress: () => void;
  testID?: string;
  subtitleTestID?: string;
  accent?: boolean;
}) {
  const subtitleParts = subtitle ? subtitle.split(', ') : [];

  return (
    <TouchableOpacity
      testID={testID}
      style={[styles.settingRow, accent ? styles.settingRowAccent : styles.settingRowDefault]}
      onPress={onPress}
    >
      <Feather name={icon} size={24} color="#7DD3FC" />
      <View style={styles.settingRowContent}>
        <Text style={styles.settingLabel}>{label}</Text>
        {subtitle ? (
          <Text testID={subtitleTestID} style={styles.settingSubtitle}>
            {subtitleParts.map((part, index) => (
              <Text
                key={index}
                style={{ color: subtitleColors?.[index] ?? '#94A3B8' }}
              >
                {index > 0 ? ', ' : ''}{part}
              </Text>
            ))}
          </Text>
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
    paddingVertical: spacing.md,
    paddingHorizontal: 20,
    paddingBottom: spacing.xxl,
    gap: 14,
  },
  title: {
    fontSize: 20,
    fontFamily: fontFamily.bold,
    color: colors.text,
    textAlign: 'center',
  },
  profileCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(125,211,252,0.25)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
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
    fontSize: 18,
    fontFamily: fontFamily.semiBold,
    color: colors.text,
  },
  proBadge: {
    backgroundColor: 'rgba(212,168,83,0.19)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(212,168,83,0.38)',
  },
  proBadgeText: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    color: '#D4A853',
  },
  profileEmail: {
    fontSize: 13,
    color: '#94A3B8',
  },
  upgradeButton: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D4A853',
  },
  upgradeButtonGradient: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: '#1A1A2E',
  },
  settingsList: {
    gap: spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#FFFFFF08',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 14,
  },
  settingRowDefault: {
    borderWidth: 1,
    borderColor: '#FFFFFF15',
  },
  settingRowAccent: {
    borderWidth: 1,
    borderColor: '#7DD3FC40',
  },
  settingRowContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: fontFamily.medium,
    color: colors.text,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  deleteAccountButton: {
    backgroundColor: '#EF444408',
    borderWidth: 1,
    borderColor: '#EF444440',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteAccountText: {
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
    color: colors.error,
  },
  logoutButton: {
    backgroundColor: '#EF444410',
    borderColor: '#EF444460',
    borderWidth: 1,
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
    color: colors.error,
  },
  version: {
    fontSize: 12,
    color: '#64748B',
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
