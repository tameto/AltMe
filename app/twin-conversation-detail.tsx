import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Feather from '@expo/vector-icons/Feather';

import { colors, spacing, fontSize, fontFamily, glassmorphism, borderRadius } from '@/src/config/theme';
import { CosmicBackground } from '@/src/shared/components/cosmic-background';

export default function TwinConversationDetailModal() {
  const router = useRouter();
  const { t } = useTranslation();

  // Mock conversation data - in production this would come from route params or API
  const conversation = [
    { twinName: 'あなたのツイン', message: 'こんにちは。今日はどんな一日でしたか？' },
    { twinName: '友達のツイン', message: 'とても充実した一日でした。新しいプロジェクトを始めたんです。' },
    { twinName: 'あなたのツイン', message: 'それは素晴らしいですね！どんなプロジェクトですか？' },
    { twinName: '友達のツイン', message: 'AIを使った新しいアプリケーションの開発です。あなたも興味ありますか？' },
  ];

  return (
    <CosmicBackground overlayOpacity={0.9}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('twin.conversationDetail.title')}</Text>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Feather name="x" size={24} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
        >
          <Text style={styles.subtitle}>{t('twin.conversationDetail.subtitle')}</Text>

          {conversation.map((msg, index) => {
            const isYourTwin = msg.twinName === 'あなたのツイン';
            return (
              <View
                key={index}
                style={[
                  styles.bubble,
                  isYourTwin ? styles.bubbleAI : styles.bubbleOther,
                ]}
              >
                <Text style={styles.twinName}>{msg.twinName}</Text>
                <Text style={styles.messageText}>{msg.message}</Text>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </CosmicBackground>
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
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bold,
    color: colors.text,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  subtitle: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  bubble: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  bubbleAI: {
    backgroundColor: glassmorphism.bubble.ai.bg,
    borderColor: glassmorphism.bubble.ai.border,
  },
  bubbleOther: {
    backgroundColor: glassmorphism.bubble.user.bg,
    borderColor: glassmorphism.bubble.user.border,
  },
  twinName: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semiBold,
    color: colors.text,
  },
  messageText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: colors.text,
    lineHeight: 22,
  },
});
