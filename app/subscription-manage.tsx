import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Feather from '@expo/vector-icons/Feather';

import { colors, spacing, borderRadius, fontSize, fontFamily, glassmorphism } from '@/src/config/theme';
import { CosmicBackground } from '@/src/shared/components/cosmic-background';
import { useSubscription } from '@/src/shared/hooks/use-subscription';
import { useUser } from '@/src/shared/hooks/use-user';
import { supabase } from '@/src/services/supabase/client';

type UsageStats = {
  totalMessages: number;
  totalJournals: number;
  totalMoods: number;
  daysActive: number;
};

export default function SubscriptionManageScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { entitlement } = useSubscription();
  const user = useUser((s) => s.user);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!user?.id) return;
      try {
        const [messagesRes, journalsRes, moodsRes] = await Promise.all([
          supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id),
          supabase
            .from('journal_entries')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id),
          supabase
            .from('mood_records')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id),
        ]);

        // Calculate days active
        const createdAt = new Date(user.createdAt);
        const now = new Date();
        const daysActive = Math.max(1, Math.ceil((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));

        setStats({
          totalMessages: messagesRes.count ?? 0,
          totalJournals: journalsRes.count ?? 0,
          totalMoods: moodsRes.count ?? 0,
          daysActive,
        });
      } catch (error) {
        console.error('Failed to load usage stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadStats();
  }, [user?.id, user?.createdAt]);

  const handleCancelSubscription = () => {
    const twinName = user?.twinName || 'AI Twin';
    Alert.alert(
      t('subscription.manage.cancelConfirmTitle'),
      t('subscription.manage.cancelConfirmMessage', { twinName, days: stats?.daysActive ?? 0 }),
      [
        { text: t('subscription.manage.cancelConfirmCancel'), style: 'cancel' },
        {
          text: t('subscription.manage.cancelConfirmProceed'),
          style: 'destructive',
          onPress: openSubscriptionSettings,
        },
      ],
    );
  };

  const openSubscriptionSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('https://apps.apple.com/account/subscriptions');
    } else {
      Linking.openURL('https://play.google.com/store/account/subscriptions');
    }
  };

  const planLabel = (() => {
    switch (entitlement.planType) {
      case 'monthly': return t('subscription.manage.planMonthly');
      case 'annual': return t('subscription.manage.planYearly');
      case 'annual_intro': return t('subscription.manage.planIntroYearly');
      default: return t('subscription.manage.proPlan');
    }
  })();

  const statusLabel = (() => {
    switch (entitlement.status) {
      case 'active': return t('subscription.manage.statusActive');
      case 'trial': return t('subscription.manage.statusTrial', { days: entitlement.trialDaysRemaining ?? 0 });
      case 'cancelled': return t('subscription.manage.statusCancelled');
      case 'grace_period': return t('subscription.manage.statusGracePeriod');
      case 'expired': return t('subscription.manage.statusExpired');
      default: return t('subscription.manage.statusFree');
    }
  })();

  return (
    <CosmicBackground overlayOpacity={0.9}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Feather name="x" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('subscription.manage.title')}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
        >
          {/* Current plan card */}
          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planTitle}>{planLabel}</Text>
              {entitlement.isPro ? (
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>Pro</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.statusLabel}>{statusLabel}</Text>
            {entitlement.expiresAt ? (
              <Text style={styles.renewalDate}>
                {t('subscription.manage.renewsOn', { date: new Date(entitlement.expiresAt).toLocaleDateString() })}
              </Text>
            ) : null}
          </View>

          {/* Usage stats - churn prevention */}
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : stats ? (
            <View style={styles.statsSection}>
              <Text style={styles.statsTitle}>{t('subscription.manage.statsTitle')}</Text>
              <View style={styles.statsGrid}>
                <StatCard icon="message-circle" value={stats.totalMessages} label={t('subscription.manage.statChat')} />
                <StatCard icon="book" value={stats.totalJournals} label={t('subscription.manage.statJournal')} />
                <StatCard icon="heart" value={stats.totalMoods} label={t('subscription.manage.statMood')} />
                <StatCard icon="calendar" value={stats.daysActive} label={t('subscription.manage.statDays')} />
              </View>
              {stats.totalMessages > 0 ? (
                <Text style={styles.statsMessage}>
                  {t('subscription.manage.statsMessage', { twinName: user?.twinName || 'AI Twin', count: stats.totalMessages })}
                </Text>
              ) : null}
            </View>
          ) : null}

          {/* Action links */}
          <View style={styles.actionsSection}>
            <Pressable style={styles.actionLink} onPress={openSubscriptionSettings}>
              <Text style={styles.actionLinkText}>{t('subscription.manage.changePlan')}</Text>
              <Feather name="chevron-right" size={20} color={colors.primary} />
            </Pressable>
            <Pressable style={styles.actionLink} onPress={openSubscriptionSettings}>
              <Text style={styles.actionLinkText}>{t('subscription.manage.paymentMethod')}</Text>
              <Feather name="chevron-right" size={20} color={colors.primary} />
            </Pressable>
          </View>

          {/* Cancel subscription */}
          {entitlement.isPro && entitlement.status !== 'cancelled' ? (
            <Pressable style={styles.cancelButton} onPress={handleCancelSubscription}>
              <Text style={styles.cancelText}>{t('subscription.manage.cancelSubscription')}</Text>
            </Pressable>
          ) : null}

          {entitlement.status === 'cancelled' ? (
            <View style={styles.resubscribeSection}>
              <Text style={styles.resubscribeText}>
                {t('subscription.manage.resubscribeMessage')}
              </Text>
              <Pressable style={styles.resubscribeButton} onPress={openSubscriptionSettings}>
                <Text style={styles.resubscribeButtonText}>{t('subscription.manage.openStore')}</Text>
              </Pressable>
            </View>
          ) : null}

          {!entitlement.isPro ? (
            <Pressable
              style={styles.upgradeButton}
              onPress={() => router.push('/(paywall)')}>
              <Text style={styles.upgradeText}>{t('subscription.manage.upgradeButton')}</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </CosmicBackground>
  );
}

function StatCard({ icon, value, label }: {
  icon: React.ComponentProps<typeof Feather>['name'];
  value: number;
  label: string;
}) {
  return (
    <View style={styles.statCard}>
      <Feather name={icon} size={20} color={colors.primary} />
      <Text style={styles.statValue}>{value.toLocaleString()}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: fontFamily.bold,
    color: colors.text,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  planCard: {
    backgroundColor: glassmorphism.card.bg,
    borderWidth: 1,
    borderColor: glassmorphism.card.border,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planTitle: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.semiBold,
    color: colors.text,
  },
  proBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.accent,
  },
  proBadgeText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bold,
    color: colors.textInverse,
  },
  statusLabel: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
  },
  renewalDate: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
  },
  loader: {
    marginVertical: spacing.xl,
  },
  statsSection: {
    gap: spacing.md,
  },
  statsTitle: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bold,
    color: colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: glassmorphism.card.bg,
    borderWidth: 1,
    borderColor: glassmorphism.card.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statsMessage: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  actionsSection: {
    gap: spacing.xs,
  },
  actionLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  actionLinkText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: colors.primary,
  },
  cancelButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
  cancelText: {
    fontSize: fontSize.md,
    color: colors.error,
    fontFamily: fontFamily.semiBold,
  },
  resubscribeSection: {
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  resubscribeText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  resubscribeButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
  },
  resubscribeButtonText: {
    color: colors.textInverse,
    fontSize: fontSize.md,
    fontFamily: fontFamily.semiBold,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  upgradeText: {
    color: colors.textInverse,
    fontSize: fontSize.md,
    fontFamily: fontFamily.bold,
  },
});
