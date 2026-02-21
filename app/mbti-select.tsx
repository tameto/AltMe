import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { colors, spacing, fontSize } from '@/src/config/theme';

export default function MbtiSelectModal() {
  const router = useRouter();
  const { t } = useTranslation();
  const isWeb = Platform.OS === 'web';

  // Web: Escape キーでモーダルを閉じる
  useEffect(() => {
    if (!isWeb) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        router.back();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isWeb, router]);

  const Wrapper = isWeb ? View : SafeAreaView;

  return (
    <Wrapper style={styles.container} {...(!isWeb && { edges: ['top'] })}>
      <View style={[styles.inner, isWeb && styles.innerWeb]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} testID="mbti-close-button">
            <Text style={styles.closeText}>{t('common.close')}</Text>
          </Pressable>
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{t('settings.mbti.title')}</Text>
          <Text style={styles.subtitle}>{t('settings.mbti.subtitle')}</Text>
        </View>
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
  },
  innerWeb: {
    maxWidth: 480,
    alignSelf: 'center' as const,
    width: '100%' as unknown as number,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  closeText: {
    fontSize: fontSize.md,
    color: colors.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
