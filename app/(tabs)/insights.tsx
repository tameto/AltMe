import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';

import { colors, spacing, borderRadius, fontSize } from '@/src/config/theme';
import { useIsPro } from '@/src/shared/hooks/use-subscription';
import { useUser } from '@/src/shared/hooks/use-user';
import { supabase } from '@/src/services/supabase/client';

type MoodOption = {
  emoji: string;
  label: string;
  value: string;
};

type MoodRecord = {
  id: string;
  mood: string;
  note: string | null;
  recordedAt: string;
};

const MOOD_OPTIONS: MoodOption[] = [
  { emoji: '\u{1F60A}', label: 'とても良い', value: 'great' },
  { emoji: '\u{1F642}', label: '良い', value: 'good' },
  { emoji: '\u{1F610}', label: '普通', value: 'neutral' },
  { emoji: '\u{1F622}', label: '悲しい', value: 'sad' },
  { emoji: '\u{1F624}', label: 'イライラ', value: 'angry' },
  { emoji: '\u{1F634}', label: '疲れた', value: 'tired' },
];

const getMoodEmoji = (mood: string): string => {
  const found = MOOD_OPTIONS.find((m) => m.value === mood);
  return found ? found.emoji : '';
};

const getMoodLabel = (mood: string): string => {
  const found = MOOD_OPTIONS.find((m) => m.value === mood);
  return found ? found.label : mood;
};

const getTodayDateStr = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
};

const formatRecordedDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['\u65E5', '\u6708', '\u706B', '\u6C34', '\u6728', '\u91D1', '\u571F'];
  const weekday = weekdays[date.getDay()];
  return `${month}/${day}(${weekday})`;
};

const isToday = (dateStr: string): boolean => {
  return dateStr === getTodayDateStr();
};

export default function InsightsScreen() {
  const router = useRouter();
  const isPro = useIsPro();
  const user = useUser((s) => s.user);

  const [todayMood, setTodayMood] = useState<MoodRecord | null>(null);
  const [recentMoods, setRecentMoods] = useState<MoodRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadMoodData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const today = getTodayDateStr();

      // Load recent 7 days of mood records
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const sevenDaysAgoStr = `${sevenDaysAgo.getFullYear()}-${(sevenDaysAgo.getMonth() + 1).toString().padStart(2, '0')}-${sevenDaysAgo.getDate().toString().padStart(2, '0')}`;

      const { data, error } = await supabase
        .from('mood_records')
        .select('id, mood, note, recorded_at')
        .eq('user_id', user.id)
        .gte('recorded_at', sevenDaysAgoStr)
        .order('recorded_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mapped = data.map((row) => ({
          id: row.id,
          mood: row.mood,
          note: row.note,
          recordedAt: row.recorded_at,
        }));

        const todayRecord = mapped.find((r) => isToday(r.recordedAt));
        setTodayMood(todayRecord ?? null);
        setRecentMoods(mapped);
      }
    } catch (error) {
      console.error('Failed to load mood data:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await loadMoodData();
      setIsLoading(false);
    };
    load();
  }, [loadMoodData]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadMoodData();
    setIsRefreshing(false);
  }, [loadMoodData]);

  const handleRecordMood = useCallback(
    async (moodValue: string) => {
      if (!user?.id || isSaving) return;

      setIsSaving(true);
      try {
        const today = getTodayDateStr();

        if (todayMood) {
          // Update existing record
          const { data, error } = await supabase
            .from('mood_records')
            .update({ mood: moodValue })
            .eq('id', todayMood.id)
            .select('id, mood, note, recorded_at')
            .single();

          if (error) throw error;
          if (data) {
            const updated: MoodRecord = {
              id: data.id,
              mood: data.mood,
              note: data.note,
              recordedAt: data.recorded_at,
            };
            setTodayMood(updated);
            setRecentMoods((prev) =>
              prev.map((r) => (r.id === updated.id ? updated : r)),
            );
          }
        } else {
          // Insert new record
          const { data, error } = await supabase
            .from('mood_records')
            .insert({
              user_id: user.id,
              mood: moodValue,
              recorded_at: today,
            })
            .select('id, mood, note, recorded_at')
            .single();

          if (error) throw error;
          if (data) {
            const newRecord: MoodRecord = {
              id: data.id,
              mood: data.mood,
              note: data.note,
              recordedAt: data.recorded_at,
            };
            setTodayMood(newRecord);
            setRecentMoods((prev) => [newRecord, ...prev]);
          }
        }
      } catch (error) {
        console.error('Failed to record mood:', error);
      } finally {
        setIsSaving(false);
      }
    },
    [user?.id, isSaving, todayMood],
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>洞察</Text>
          <Text style={styles.headerSubtitle}>
            気分を記録して、自分のパターンを発見しよう
          </Text>
        </View>

        {/* Today's Mood Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>今日の気分</Text>
          {todayMood ? (
            <View style={styles.todayMoodRecorded}>
              <Text style={styles.todayMoodEmoji}>{getMoodEmoji(todayMood.mood)}</Text>
              <Text style={styles.todayMoodLabel}>{getMoodLabel(todayMood.mood)}</Text>
              <Text style={styles.todayMoodHint}>
                タップして変更できます
              </Text>
            </View>
          ) : null}

          <View style={styles.moodGrid}>
            {MOOD_OPTIONS.map((mood) => {
              const isSelected = todayMood?.mood === mood.value;
              return (
                <TouchableOpacity
                  key={mood.value}
                  style={[
                    styles.moodCard,
                    isSelected && styles.moodCardSelected,
                  ]}
                  onPress={() => handleRecordMood(mood.value)}
                  disabled={isSaving}
                  activeOpacity={0.7}
                >
                  <Text style={styles.moodCardEmoji}>{mood.emoji}</Text>
                  <Text
                    style={[
                      styles.moodCardLabel,
                      isSelected && styles.moodCardLabelSelected,
                    ]}
                  >
                    {mood.label}
                  </Text>
                  {isSelected ? (
                    <View style={styles.moodCheckmark}>
                      <FontAwesome name="check" size={10} color={colors.textInverse} />
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>

          {isSaving ? (
            <View style={styles.savingIndicator}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.savingText}>保存中...</Text>
            </View>
          ) : null}
        </View>

        {/* Recent 7 Days History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>直近7日間</Text>
          {recentMoods.length === 0 ? (
            <View style={styles.emptyHistory}>
              <FontAwesome name="calendar-o" size={32} color={colors.textTertiary} />
              <Text style={styles.emptyHistoryText}>
                まだ記録がありません{'\n'}
                今日の気分を記録してみましょう
              </Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {recentMoods.map((record) => (
                <View key={record.id} style={styles.historyRow}>
                  <Text
                    style={[
                      styles.historyDate,
                      isToday(record.recordedAt) && styles.historyDateToday,
                    ]}
                  >
                    {isToday(record.recordedAt)
                      ? '\u4ECA\u65E5'
                      : formatRecordedDate(record.recordedAt)}
                  </Text>
                  <Text style={styles.historyEmoji}>{getMoodEmoji(record.mood)}</Text>
                  <Text style={styles.historyLabel}>{getMoodLabel(record.mood)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Pro Upsell */}
        {!isPro ? (
          <View style={styles.proUpsell}>
            <FontAwesome name="bar-chart" size={24} color={colors.primary} />
            <Text style={styles.proUpsellTitle}>もっと詳しい分析を見る</Text>
            <Text style={styles.proUpsellDescription}>
              Pro会員になると、気分の傾向分析やAIによるアドバイスなど、{'\n'}
              より深い洞察を得ることができます。
            </Text>
            <TouchableOpacity
              style={styles.proUpsellButton}
              onPress={() => router.push('/(paywall)' as never)}
            >
              <Text style={styles.proUpsellButtonText}>Proにアップグレード</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.proAnalyticsPlaceholder}>
            <FontAwesome name="line-chart" size={32} color={colors.primaryLight} />
            <Text style={styles.proAnalyticsText}>
              詳細な分析機能は近日公開予定です
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },

  // Header
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // Section
  section: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },

  // Today's mood
  todayMoodRecorded: {
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  todayMoodEmoji: {
    fontSize: fontSize.hero,
  },
  todayMoodLabel: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.xs,
  },
  todayMoodHint: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },

  // Mood grid
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  moodCard: {
    width: '30%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  moodCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  moodCardEmoji: {
    fontSize: fontSize.xxl,
  },
  moodCardLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  moodCardLabelSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  moodCheckmark: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Saving indicator
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  savingText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },

  // History
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyHistoryText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  historyList: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  historyDate: {
    width: 70,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  historyDateToday: {
    color: colors.primary,
    fontWeight: '700',
  },
  historyEmoji: {
    fontSize: fontSize.lg,
    marginRight: spacing.sm,
  },
  historyLabel: {
    fontSize: fontSize.sm,
    color: colors.text,
    flex: 1,
  },

  // Pro upsell
  proUpsell: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  proUpsellTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.sm,
  },
  proUpsellDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  proUpsellButton: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  proUpsellButtonText: {
    color: colors.textInverse,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },

  // Pro analytics placeholder
  proAnalyticsPlaceholder: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xl,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
  },
  proAnalyticsText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
