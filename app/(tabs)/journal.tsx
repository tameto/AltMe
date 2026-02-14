import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';

import { colors, spacing, borderRadius, fontSize } from '@/src/config/theme';
import { useIsPro } from '@/src/shared/hooks/use-subscription';
import { useUser } from '@/src/shared/hooks/use-user';
import { supabase } from '@/src/services/supabase/client';
import { env } from '@/src/config/env';

type JournalEntry = {
  id: string;
  content: string;
  mood: string | null;
  aiReflection: string | null;
  createdAt: string;
};

type MoodOption = {
  emoji: string;
  label: string;
  value: string;
};

const MOOD_OPTIONS: MoodOption[] = [
  { emoji: '😊', label: '嬉しい', value: 'happy' },
  { emoji: '😐', label: '普通', value: 'neutral' },
  { emoji: '😢', label: '悲しい', value: 'sad' },
  { emoji: '😤', label: 'イライラ', value: 'angry' },
  { emoji: '😴', label: '疲れた', value: 'tired' },
];

const getMoodEmoji = (mood: string | null): string => {
  if (!mood) return '';
  const found = MOOD_OPTIONS.find((m) => m.value === mood);
  return found ? found.emoji : '';
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const weekday = weekdays[date.getDay()];
  return `${month}月${day}日（${weekday}）`;
};

const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const getDateKey = (dateStr: string): string => {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
};

type GroupedEntry = {
  type: 'header';
  dateKey: string;
  dateLabel: string;
} | {
  type: 'entry';
  entry: JournalEntry;
};

export default function JournalScreen() {
  const router = useRouter();
  const isPro = useIsPro();
  const user = useUser((s) => s.user);

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  // Composer state
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadEntries = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('id, content, mood, ai_reflection, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data) {
        setEntries(
          data.map((row) => ({
            id: row.id,
            content: row.content,
            mood: row.mood,
            aiReflection: row.ai_reflection,
            createdAt: row.created_at,
          })),
        );
      }
    } catch (error) {
      console.error('Failed to load journal entries:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await loadEntries();
      setIsLoading(false);
    };
    load();
  }, [loadEntries]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadEntries();
    setIsRefreshing(false);
  }, [loadEntries]);

  const handleSave = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed || !user?.id) return;

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          content: trimmed,
          mood: selectedMood,
        })
        .select('id, content, mood, ai_reflection, created_at')
        .single();

      if (error) throw error;
      if (!data) throw new Error('No data returned');

      const newEntry: JournalEntry = {
        id: data.id,
        content: data.content,
        mood: data.mood,
        aiReflection: data.ai_reflection,
        createdAt: data.created_at,
      };

      setEntries((prev) => [newEntry, ...prev]);
      setContent('');
      setSelectedMood(null);
      setShowComposer(false);

      // Request AI reflection in background
      requestAiReflection(data.id);
    } catch (error) {
      console.error('Failed to save journal entry:', error);
      Alert.alert('エラー', '日記の保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsSaving(false);
    }
  }, [content, selectedMood, user?.id]);

  const requestAiReflection = useCallback(async (journalEntryId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${env.supabaseUrl}/functions/v1/journal-reflect`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ journalEntryId }),
        },
      );

      if (!response.ok) return;

      const result = await response.json();
      if (result.reflection) {
        setEntries((prev) =>
          prev.map((entry) =>
            entry.id === journalEntryId
              ? { ...entry, aiReflection: result.reflection }
              : entry,
          ),
        );
      }
    } catch (error) {
      console.error('Failed to get AI reflection:', error);
    }
  }, []);

  const groupedData = useMemo((): GroupedEntry[] => {
    const result: GroupedEntry[] = [];
    let currentDateKey = '';

    for (const entry of entries) {
      const dateKey = getDateKey(entry.createdAt);
      if (dateKey !== currentDateKey) {
        currentDateKey = dateKey;
        result.push({
          type: 'header',
          dateKey,
          dateLabel: formatDate(entry.createdAt),
        });
      }
      result.push({ type: 'entry', entry });
    }

    return result;
  }, [entries]);

  const toggleExpand = useCallback((entryId: string) => {
    setExpandedEntryId((prev) => (prev === entryId ? null : entryId));
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: GroupedEntry }) => {
      if (item.type === 'header') {
        return (
          <View style={styles.dateHeader}>
            <Text style={styles.dateHeaderText}>{item.dateLabel}</Text>
          </View>
        );
      }

      const { entry } = item;
      const isExpanded = expandedEntryId === entry.id;
      const previewText =
        entry.content.length > 100 && !isExpanded
          ? entry.content.slice(0, 100) + '...'
          : entry.content;

      return (
        <TouchableOpacity
          style={styles.entryCard}
          onPress={() => toggleExpand(entry.id)}
          activeOpacity={0.7}
        >
          <View style={styles.entryHeader}>
            <View style={styles.entryMeta}>
              {entry.mood ? (
                <Text style={styles.entryMoodEmoji}>{getMoodEmoji(entry.mood)}</Text>
              ) : null}
              <Text style={styles.entryTime}>{formatTime(entry.createdAt)}</Text>
            </View>
            <FontAwesome
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={12}
              color={colors.textTertiary}
            />
          </View>
          <Text style={styles.entryContent}>{previewText}</Text>
          {isExpanded && entry.aiReflection ? (
            <View style={styles.reflectionContainer}>
              <View style={styles.reflectionHeader}>
                <FontAwesome name="magic" size={12} color={colors.primary} />
                <Text style={styles.reflectionLabel}>AIの振り返り</Text>
              </View>
              <Text style={styles.reflectionText}>{entry.aiReflection}</Text>
            </View>
          ) : null}
          {isExpanded && !entry.aiReflection ? (
            <View style={styles.reflectionContainer}>
              <View style={styles.reflectionLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.reflectionLoadingText}>AI振り返りを生成中...</Text>
              </View>
            </View>
          ) : null}
        </TouchableOpacity>
      );
    },
    [expandedEntryId, toggleExpand],
  );

  const getItemKey = useCallback((item: GroupedEntry, index: number): string => {
    if (item.type === 'header') return `header-${item.dateKey}`;
    return item.entry.id;
  }, []);

  // Pro gate
  if (!isPro) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.proGateContainer}>
          <FontAwesome name="book" size={48} color={colors.primaryLight} />
          <Text style={styles.proGateTitle}>日記機能</Text>
          <Text style={styles.proGateDescription}>
            毎日の気持ちを記録して、AIが振り返りを提供します。{'\n'}
            Pro会員になって日記機能を使い始めましょう。
          </Text>
          <TouchableOpacity
            style={styles.proGateButton}
            onPress={() => router.push('/(paywall)' as never)}
          >
            <Text style={styles.proGateButtonText}>Proにアップグレード</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>日記</Text>
        <TouchableOpacity
          style={styles.composeButton}
          onPress={() => setShowComposer(true)}
        >
          <FontAwesome name="pencil" size={16} color={colors.textInverse} />
          <Text style={styles.composeButtonText}>書く</Text>
        </TouchableOpacity>
      </View>

      {/* Entry List or Empty State */}
      {entries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="pencil-square-o" size={48} color={colors.primaryLight} />
          <Text style={styles.emptyTitle}>今日の気持ちを書いてみよう</Text>
          <Text style={styles.emptyDescription}>
            日記を書くと、AIがあなたの振り返りをサポートします
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setShowComposer(true)}
          >
            <Text style={styles.emptyButtonText}>最初の日記を書く</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={groupedData}
          renderItem={renderItem}
          keyExtractor={getItemKey}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {/* Composer Modal */}
      <Modal
        visible={showComposer}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowComposer(false)}
      >
        <SafeAreaView style={styles.composerContainer} edges={['top']}>
          <KeyboardAvoidingView
            style={styles.composerInner}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            {/* Composer Header */}
            <View style={styles.composerHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShowComposer(false);
                  setContent('');
                  setSelectedMood(null);
                }}
              >
                <Text style={styles.composerCancel}>キャンセル</Text>
              </TouchableOpacity>
              <Text style={styles.composerTitle}>新しい日記</Text>
              <TouchableOpacity
                onPress={handleSave}
                disabled={!content.trim() || isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text
                    style={[
                      styles.composerSave,
                      !content.trim() && styles.composerSaveDisabled,
                    ]}
                  >
                    保存
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Mood Selector */}
            <View style={styles.moodSelector}>
              <Text style={styles.moodLabel}>今の気分は？</Text>
              <View style={styles.moodOptions}>
                {MOOD_OPTIONS.map((mood) => (
                  <TouchableOpacity
                    key={mood.value}
                    style={[
                      styles.moodOption,
                      selectedMood === mood.value && styles.moodOptionSelected,
                    ]}
                    onPress={() =>
                      setSelectedMood((prev) =>
                        prev === mood.value ? null : mood.value,
                      )
                    }
                  >
                    <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                    <Text
                      style={[
                        styles.moodOptionLabel,
                        selectedMood === mood.value && styles.moodOptionLabelSelected,
                      ]}
                    >
                      {mood.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Text Input */}
            <TextInput
              style={styles.composerInput}
              value={content}
              onChangeText={setContent}
              placeholder="今日はどんな一日でしたか？思ったこと、感じたことを自由に書いてみましょう..."
              placeholderTextColor={colors.textTertiary}
              multiline
              textAlignVertical="top"
              autoFocus
            />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  composeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  composeButtonText: {
    color: colors.textInverse,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
  },
  emptyDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  emptyButtonText: {
    color: colors.textInverse,
    fontSize: fontSize.md,
    fontWeight: '600',
  },

  // List
  listContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  dateHeader: {
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  dateHeaderText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  entryCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  entryMoodEmoji: {
    fontSize: fontSize.lg,
  },
  entryTime: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  entryContent: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 24,
  },

  // AI Reflection
  reflectionContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  reflectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  reflectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.primary,
  },
  reflectionText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  reflectionLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reflectionLoadingText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },

  // Pro gate
  proGateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  proGateTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
  },
  proGateDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  proGateButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  proGateButtonText: {
    color: colors.textInverse,
    fontSize: fontSize.md,
    fontWeight: '600',
  },

  // Composer
  composerContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  composerInner: {
    flex: 1,
  },
  composerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  composerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  composerCancel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  composerSave: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
  },
  composerSaveDisabled: {
    color: colors.textTertiary,
  },
  moodSelector: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  moodLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  moodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodOption: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 60,
  },
  moodOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceSecondary,
  },
  moodEmoji: {
    fontSize: fontSize.xl,
  },
  moodOptionLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  moodOptionLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  composerInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 24,
  },
});
