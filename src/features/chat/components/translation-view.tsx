import { useRef, useEffect } from 'react';
import { Animated, ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { fontFamily } from '@/src/config/theme';
import type { TranslationData } from '@/src/shared/types/chat';

type TranslationViewProps = {
  translation: TranslationData | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onToggle: () => void;
  isExpanded: boolean;
};

const LANG_LABEL: Record<string, string> = {
  ja: '日本語',
  en: 'English',
  unknown: '不明',
};

const getLangLabel = (code: string): string => LANG_LABEL[code] ?? code.toUpperCase();

export function TranslationView({
  translation,
  isLoading,
  error,
  onRetry,
  onToggle,
  isExpanded,
}: TranslationViewProps) {
  const expandAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isExpanded, expandAnim]);

  const renderBody = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#7DD3FC" />
          <Text style={styles.loadingText}>翻訳中...</Text>
        </View>
      );
    }

    if (error !== null) {
      return (
        <View style={styles.errorRow}>
          <Text style={styles.errorText}>翻訳に失敗しました</Text>
          <Pressable
            style={styles.retryButton}
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="翻訳をリトライ"
          >
            <Text style={styles.retryText}>リトライ</Text>
          </Pressable>
        </View>
      );
    }

    if (translation !== null) {
      return (
        <View style={styles.translationBody}>
          <View style={styles.langRow}>
            <Feather name="globe" size={11} color="#94A3B8" />
            <Text style={styles.langLabel}>
              {getLangLabel(translation.sourceLang)} → {getLangLabel(translation.targetLang)}
            </Text>
          </View>
          <Text style={styles.translationText}>{translation.text}</Text>
        </View>
      );
    }

    return null;
  };

  const showExpanded = isExpanded || isLoading || error !== null;
  const maxHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  return (
    <View style={styles.container}>
      {/* 折りたたみラベル */}
      <Pressable
        style={styles.toggleRow}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={isExpanded ? '翻訳を閉じる' : '翻訳を表示'}
      >
        <Feather name="globe" size={11} color="#D4A853" />
        <Text style={styles.toggleLabel}>翻訳済み</Text>
        <Feather
          name={showExpanded ? 'chevron-up' : 'chevron-down'}
          size={11}
          color="#D4A853"
        />
      </Pressable>

      {/* 展開コンテンツ */}
      <Animated.View style={[styles.expandedContainer, { maxHeight }]}>
        {showExpanded ? (
          <View style={styles.expandedContent}>{renderBody()}</View>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
    marginLeft: 40,
    maxWidth: '75%',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  toggleLabel: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    color: '#D4A853',
  },
  expandedContainer: {
    overflow: 'hidden',
  },
  expandedContent: {
    marginTop: 6,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 8,
    padding: 8,
  },
  translationBody: {
    gap: 4,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  langLabel: {
    fontSize: 10,
    fontFamily: fontFamily.regular,
    color: '#94A3B8',
  },
  translationText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: '#E2E8F0',
    lineHeight: 19,
    paddingHorizontal: 4,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  loadingText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: '#94A3B8',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  errorText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: '#EF4444',
    flex: 1,
  },
  retryButton: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  retryText: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    color: '#EF4444',
  },
});
