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
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { colors, spacing, borderRadius, fontSize } from '@/src/config/theme';
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
    Alert.alert(
      '本当に解約しますか？',
      `${user?.twinName || 'AIツイン'}との${stats?.daysActive ?? 0}日間の思い出が失われます。\n\n解約後も現在の期間終了まではPro機能をご利用いただけます。`,
      [
        { text: 'やっぱりやめる', style: 'cancel' },
        {
          text: '解約手続きへ',
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
      case 'monthly': return '月額プラン';
      case 'annual': return '年額プラン';
      case 'intro_annual': return '年額プラン（初回特別）';
      default: return 'Pro プラン';
    }
  })();

  const statusLabel = (() => {
    switch (entitlement.status) {
      case 'active': return 'アクティブ';
      case 'trial': return `トライアル中（残り${entitlement.trialDaysRemaining ?? 0}日）`;
      case 'cancelled': return '解約済み（期間終了まで利用可）';
      case 'grace_period': return '猶予期間（お支払い更新が必要）';
      case 'expired': return '期限切れ';
      default: return 'Free';
    }
  })();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <FontAwesome name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>サブスクリプション管理</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Current plan */}
        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <Text style={styles.planTitle}>{planLabel}</Text>
            <View style={[styles.statusBadge, entitlement.isPro && styles.statusBadgeActive]}>
              <Text style={[styles.statusText, entitlement.isPro && styles.statusTextActive]}>
                {statusLabel}
              </Text>
            </View>
          </View>
          {entitlement.credits > 0 && (
            <Text style={styles.credits}>残りクレジット: {entitlement.credits}</Text>
          )}
        </View>

        {/* Usage stats - churn prevention */}
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : stats && (
          <View style={styles.statsSection}>
            <Text style={styles.statsTitle}>あなたとAIツインの記録</Text>
            <View style={styles.statsGrid}>
              <StatCard icon="comments" value={stats.totalMessages} label="チャット" />
              <StatCard icon="book" value={stats.totalJournals} label="日記" />
              <StatCard icon="heart" value={stats.totalMoods} label="気分記録" />
              <StatCard icon="calendar" value={stats.daysActive} label="日間" />
            </View>
            {stats.totalMessages > 0 && (
              <Text style={styles.statsMessage}>
                {user?.twinName || 'AIツイン'}はあなたのことを{stats.totalMessages}回の会話から学んでいます。
                解約するとこのデータは保持されますが、新しい会話や分析は利用できなくなります。
              </Text>
            )}
          </View>
        )}

        {/* Actions */}
        {entitlement.isPro && entitlement.status !== 'cancelled' && (
          <Pressable style={styles.cancelButton} onPress={handleCancelSubscription}>
            <Text style={styles.cancelText}>サブスクリプションを解約</Text>
          </Pressable>
        )}

        {entitlement.status === 'cancelled' && (
          <View style={styles.resubscribeSection}>
            <Text style={styles.resubscribeText}>
              再度Pro機能をご利用いただくには、ストアからサブスクリプションを再開してください。
            </Text>
            <Pressable style={styles.resubscribeButton} onPress={openSubscriptionSettings}>
              <Text style={styles.resubscribeButtonText}>ストアを開く</Text>
            </Pressable>
          </View>
        )}

        {!entitlement.isPro && (
          <Pressable
            style={styles.upgradeButton}
            onPress={() => router.push('/(paywall)' as never)}>
            <Text style={styles.upgradeText}>Pro にアップグレード</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, value, label }: {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  value: number;
  label: string;
}) {
  return (
    <View style={styles.statCard}>
      <FontAwesome name={icon} size={20} color={colors.primary} />
      <Text style={styles.statValue}>{value.toLocaleString()}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  planCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusBadgeActive: {
    backgroundColor: colors.success + '20',
    borderColor: colors.success,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statusTextActive: {
    color: colors.success,
  },
  credits: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  loader: {
    marginVertical: spacing.xl,
  },
  statsSection: {
    marginBottom: spacing.lg,
  },
  statsTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  statsMessage: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  cancelButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: borderRadius.md,
  },
  cancelText: {
    fontSize: fontSize.md,
    color: colors.error,
    fontWeight: '600',
  },
  resubscribeSection: {
    alignItems: 'center',
    gap: spacing.md,
  },
  resubscribeText: {
    fontSize: fontSize.sm,
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
    fontWeight: '600',
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  upgradeText: {
    color: colors.textInverse,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});
