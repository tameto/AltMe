import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Pressable,
  ActivityIndicator,
  Linking,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Feather from '@expo/vector-icons/Feather';

import { CosmicBackground } from '@/src/shared/components/cosmic-background';
import { colors, spacing, fontSize, fontFamily, borderRadius } from '@/src/config/theme';
import { supabase } from '@/src/services/supabase/client';
import { useUser } from '@/src/shared/hooks/use-user';
import { getNotificationPermissionStatus } from '@/src/services/notifications/client';

type NotificationSettings = {
  id: string;
  chat_enabled: boolean;
  journal_reminder_enabled: boolean;
  journal_reminder_time: string;
  community_enabled: boolean;
  marketing_enabled: boolean;
};

type ToggleKey = keyof Pick<
  NotificationSettings,
  'chat_enabled' | 'journal_reminder_enabled' | 'community_enabled' | 'marketing_enabled'
>;

const DEFAULT_SETTINGS: Omit<NotificationSettings, 'id'> = {
  chat_enabled: true,
  journal_reminder_enabled: true,
  journal_reminder_time: '21:00:00',
  community_enabled: true,
  marketing_enabled: false,
};

export default function NotificationSettingsModal() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useUser((s) => s.user);

  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSystemEnabled, setIsSystemEnabled] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadSettings = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setLoadError(false);

    try {
      const [permissionStatus, { data, error }] = await Promise.all([
        getNotificationPermissionStatus(),
        supabase
          .from('notification_settings')
          .select('*')
          .eq('user_id', user.id)
          .single(),
      ]);

      setIsSystemEnabled(permissionStatus);

      if (error && error.code === 'PGRST116') {
        // レコードなし → デフォルト値で作成
        const { data: inserted, error: insertError } = await supabase
          .from('notification_settings')
          .insert({ user_id: user.id, ...DEFAULT_SETTINGS })
          .select('*')
          .single();

        if (insertError) throw insertError;
        setSettings(inserted as NotificationSettings);
      } else if (error) {
        throw error;
      } else {
        setSettings(data as NotificationSettings);
      }
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleToggle = useCallback(
    async (key: ToggleKey, value: boolean) => {
      if (!settings || !user?.id) return;

      // 楽観的更新
      const previous = settings[key];
      setSettings((prev) => (prev ? { ...prev, [key]: value } : null));

      try {
        const { error } = await supabase
          .from('notification_settings')
          .update({ [key]: value })
          .eq('user_id', user.id);

        if (error) throw error;
      } catch {
        // ロールバック
        setSettings((prev) => (prev ? { ...prev, [key]: previous } : null));
        Alert.alert(t('common.error'), t('settings.notifications.updateError'));
      }
    },
    [settings, user?.id, t],
  );

  const handleOpenSettings = useCallback(() => {
    if (Platform.OS !== 'web') {
      Linking.openSettings();
    }
  }, []);

  return (
    <CosmicBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('settings.notifications.title')}</Text>
          <Pressable onPress={() => router.back()} style={styles.closeButton} hitSlop={8}>
            <Feather name="x" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
        >
          {/* Web: プッシュ通知は将来対応 */}
          {Platform.OS === 'web' ? (
            <View testID="web-notification-notice" style={styles.webNoticeBanner}>
              <Feather name="info" size={16} color={colors.primary} />
              <Text style={styles.webNoticeText}>
                {t('settings.notifications.webNotice')}
              </Text>
            </View>
          ) : null}

          {/* デバイス通知OFFバナー */}
          {!isSystemEnabled && Platform.OS !== 'web' ? (
            <Pressable style={styles.systemDisabledBanner} onPress={handleOpenSettings}>
              <Feather name="alert-triangle" size={16} color={colors.warning} />
              <Text style={styles.systemDisabledText}>
                {t('settings.notifications.systemDisabled')}
              </Text>
              <Text style={styles.openSettingsText}>
                {t('settings.notifications.openSettings')}
              </Text>
            </Pressable>
          ) : null}

          {/* ローディング */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : loadError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{t('settings.notifications.loadError')}</Text>
              <Pressable style={styles.retryButton} onPress={loadSettings}>
                <Text style={styles.retryText}>{t('common.retry')}</Text>
              </Pressable>
            </View>
          ) : settings !== null ? (
            <View style={styles.settingsList}>
              <NotificationRow
                icon="message-circle"
                label={t('settings.notifications.chat')}
                description={t('settings.notifications.chatDesc')}
                value={settings.chat_enabled}
                onValueChange={(val) => handleToggle('chat_enabled', val)}
              />
              <NotificationRow
                icon="book-open"
                label={t('settings.notifications.journalReminder')}
                description={t('settings.notifications.journalReminderDesc')}
                value={settings.journal_reminder_enabled}
                onValueChange={(val) => handleToggle('journal_reminder_enabled', val)}
              />
              <NotificationRow
                icon="users"
                label={t('settings.notifications.community')}
                description={t('settings.notifications.communityDesc')}
                value={settings.community_enabled}
                onValueChange={(val) => handleToggle('community_enabled', val)}
              />
              <NotificationRow
                icon="bell"
                label={t('settings.notifications.marketing')}
                description={t('settings.notifications.marketingDesc')}
                value={settings.marketing_enabled}
                onValueChange={(val) => handleToggle('marketing_enabled', val)}
                isLast
              />
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </CosmicBackground>
  );
}

type NotificationRowProps = {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
};

function NotificationRow({
  icon,
  label,
  description,
  value,
  onValueChange,
  isLast = false,
}: NotificationRowProps) {
  return (
    <View style={[styles.row, isLast ? styles.rowLast : null]}>
      <View style={styles.rowIcon}>
        <Feather name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#334155', true: colors.primary }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#334155"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    position: 'relative',
  },
  headerTitle: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semiBold,
    color: colors.text,
  },
  closeButton: {
    position: 'absolute',
    right: spacing.md,
    padding: spacing.xs,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  systemDisabledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B1A',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#F59E0B40',
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  systemDisabledText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.warning,
    fontFamily: fontFamily.medium,
  },
  openSettingsText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontFamily: fontFamily.semiBold,
  },
  loadingContainer: {
    paddingTop: spacing.xxl,
    alignItems: 'center',
  },
  errorContainer: {
    paddingTop: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  errorText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  retryText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontFamily: fontFamily.semiBold,
  },
  settingsList: {
    backgroundColor: '#FFFFFF08',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#FFFFFF0A',
    gap: spacing.md,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: '#7DD3FC14',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.medium,
    color: colors.text,
  },
  rowDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  webNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7DD3FC14',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#7DD3FC30',
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  webNoticeText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.primary,
    fontFamily: fontFamily.medium,
  },
});
