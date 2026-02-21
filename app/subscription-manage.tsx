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
            <Feather name="arrow-left" size={24} color={colors.text} />
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
            <Text style={styles.planSectionLabel}>{t('subscription.manage.currentPlan')}</Text>
            <View style={styles.planCardDivider} />
            <View style={styles.planHeader}>
              <View style={styles.crownCircle}>
                <Feather name="award" size={20} color="#7DD3FC" />
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planTitle}>{planLabel}</Text>
                {entitlement.expiresAt ? (
                  <Text style={styles.renewalDate}>
                    {t('subscription.manage.renewsOn', { date: new Date(entitlement.expiresAt).toLocaleDateString() })}
                  </Text>
                ) : null}
              </View>
              {entitlement.isPro ? (
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>{statusLabel}</Text>
                </View>
              ) : null}
            </View>
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
            <Pressable style={styles.actionItem} onPress={openSubscriptionSettings}>
              <Feather name="repeat" size={20} color="#7DD3FC" />
              <Text style={styles.actionLinkText}>{t('subscription.manage.changePlan')}</Text>
              <Feather name="chevron-right" size={16} color={colors.textSecondary} />
            </Pressable>
            <View style={styles.actionDivider} />
            <Pressable style={styles.actionItem} onPress={openSubscriptionSettings}>
              <Feather name="credit-card" size={20} color="#7DD3FC" />
              <Text style={styles.actionLinkText}>{t('subscription.manage.paymentMethod')}</Text>
              <Feather name="chevron-right" size={16} color={colors.textSecondary} />
            </Pressable>
            {entitlement.isPro && entitlement.status !== 'cancelled' ? (
              <>
                <View style={styles.actionDivider} />
                <Pressable style={styles.actionItem} onPress={handleCancelSubscription}>
                  <Feather name="x-circle" size={20} color="#EF4444" />
                  <Text style={styles.actionLinkTextDestructive}>{t('subscription.manage.cancelSubscription')}</Text>
                  <Feather name="chevron-right" size={16} color={colors.textSecondary} />
                </Pressable>
              </>
            ) : null}
          </View>

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
    fontSize: fontSize.md,
    fontFamily: fontFamily.semiBold,
    color: colors.text,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  planCard: {
    backgroundColor: '#FFFFFF08',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    borderRadius: 16,
    padding: 20,
    gap: spacing.sm,
  },
  planSectionLabel: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
    color: 'rgba(255,255,255,0.38)',
  },
  planCardDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  crownCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(125,211,252,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planInfo: {
    flex: 1,
  },
  planTitle: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bold,
    color: colors.text,
  },
  proBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 99,
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
  },
  proBadgeText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bold,
    color: '#22C55E',
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
    backgroundColor: '#FFFFFF08',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFFFFF20',
    overflow: 'hidden',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  actionLinkText: {
    flex: 1,
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: colors.text,
  },
  actionLinkTextDestructive: {
    flex: 1,
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: '#EF4444',
  },
  actionDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: spacing.md,
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
