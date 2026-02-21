import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Feather from '@expo/vector-icons/Feather';

import { colors, spacing, fontSize, fontFamily, borderRadius } from '@/src/config/theme';
import { CosmicBackground } from '@/src/shared/components/cosmic-background';

export default function TwinConversationDetailModal() {
  const router = useRouter();
  const { t } = useTranslation();

  // Mock conversation data - in production this would come from route params or API
  const conversation = [
    { twinName: 'Yuki', message: 'こんにちは。今日はどんな一日でしたか？', isYuki: true },
    { twinName: 'Hana', message: 'とても充実した一日でした。新しいプロジェクトを始めたんです。', isYuki: false },
    { twinName: 'Yuki', message: 'それは素晴らしいですね！どんなプロジェクトですか？', isYuki: true },
    { twinName: 'Hana', message: 'AIを使った新しいアプリケーションの開発です。あなたも興味ありますか？', isYuki: false },
  ];

  return (
    <CosmicBackground overlayOpacity={0.9}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header: back + avatar1 + title col + avatar2 */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Feather name="arrow-left" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.headerAvatarLeft}>
            <Feather name="cpu" size={18} color="#7DD3FC" />
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Yuki × Hana</Text>
            <Text style={styles.headerSubtitle}>{t('twin.conversationDetail.subtitle')}</Text>
          </View>
          <View style={styles.headerAvatarRight}>
            <Feather name="cpu" size={18} color="#D4A853" />
          </View>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.divider} />

        <ScrollView
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
        >
          {conversation.map((msg, index) => (
            <View
              key={index}
              style={[styles.messageRow, msg.isYuki ? styles.messageRowLeft : styles.messageRowRight]}
            >
              {msg.isYuki && (
                <View style={styles.avatarYuki}>
                  <Feather name="cpu" size={14} color="#7DD3FC" />
                </View>
              )}
              <View style={[styles.bubble, msg.isYuki ? styles.bubbleYuki : styles.bubbleHana]}>
                <Text style={msg.isYuki ? styles.twinNameYuki : styles.twinNameHana}>{msg.twinName}</Text>
                <Text style={styles.messageText}>{msg.message}</Text>
              </View>
              {!msg.isYuki && (
                <View style={styles.avatarHana}>
                  <Feather name="cpu" size={14} color="#D4A853" />
                </View>
              )}
            </View>
          ))}
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
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  headerAvatarLeft: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(125,211,252,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarRight: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(212,168,83,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.38)',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  content: {
    padding: 16,
    paddingBottom: spacing.xxl,
    gap: 16,
  },
  messageRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  avatarYuki: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(125,211,252,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarHana: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(212,168,83,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  bubble: {
    maxWidth: '75%',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  bubbleYuki: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  bubbleHana: {
    backgroundColor: 'rgba(212,168,83,0.08)',
    borderColor: 'rgba(212,168,83,0.19)',
  },
  twinNameYuki: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    color: '#7DD3FC',
  },
  twinNameHana: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    color: '#D4A853',
  },
  messageText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
});
