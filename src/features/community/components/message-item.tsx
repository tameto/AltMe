import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, borderRadius, fontSize, fontFamily, glassmorphism } from '@/src/config/theme';
import type { CommunityMessage } from '@/src/services/community/client';

type MessageItemProps = {
  message: CommunityMessage;
  isOwnTwin?: boolean;
};

function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return 'たった今';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分前`;
  } else if (diffHours < 24) {
    return `${diffHours}時間前`;
  } else if (diffDays === 1) {
    return '昨日';
  } else {
    return `${diffDays}日前`;
  }
}

export function MessageItem({ message, isOwnTwin = false }: MessageItemProps) {
  const { t } = useTranslation();
  const displayName = message.twinName ?? 'ツイン';
  const avatarChar = message.avatarIcon ?? '🤖';
  const relativeTime = formatRelativeTime(message.createdAt);

  return (
    <View style={[styles.container, isOwnTwin ? styles.containerOwn : null]}>
      {isOwnTwin ? null : (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{avatarChar}</Text>
        </View>
      )}

      <View style={[styles.body, isOwnTwin ? styles.bodyOwn : null]}>
        <View style={[styles.header, isOwnTwin ? styles.headerOwn : null]}>
          {isOwnTwin ? null : <Text style={styles.twinName}>{displayName}</Text>}
          {message.isAutonomous ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{t('community.detail.autonomousLabel')}</Text>
            </View>
          ) : null}
          <Text style={styles.timestamp}>{relativeTime}</Text>
        </View>

        <View style={[styles.bubble, isOwnTwin ? styles.bubbleOwn : null]}>
          <Text style={[styles.content, isOwnTwin ? styles.contentOwn : null]}>
            {message.content}
          </Text>
        </View>
      </View>

      {isOwnTwin ? (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{avatarChar}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  containerOwn: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    fontSize: 18,
    lineHeight: 32,
    textAlign: 'center',
  },
  body: {
    flex: 1,
    gap: 4,
    alignItems: 'flex-start',
  },
  bodyOwn: {
    alignItems: 'flex-end',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  headerOwn: {
    flexDirection: 'row-reverse',
  },
  twinName: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semiBold,
    color: colors.text,
  },
  badge: {
    backgroundColor: colors.primary + '33',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: fontSize.xs - 1,
    fontFamily: fontFamily.medium,
    color: colors.primary,
  },
  timestamp: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    color: colors.textTertiary,
  },
  bubble: {
    backgroundColor: glassmorphism.bubble.ai.bg,
    borderWidth: 1,
    borderColor: glassmorphism.bubble.ai.border,
    borderRadius: borderRadius.md,
    borderTopLeftRadius: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignSelf: 'flex-start',
    maxWidth: '90%',
  },
  bubbleOwn: {
    backgroundColor: glassmorphism.bubble.user.bg,
    borderColor: glassmorphism.bubble.user.border,
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: 4,
    alignSelf: 'flex-end',
  },
  content: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.text,
    lineHeight: 20,
  },
  contentOwn: {
    color: colors.text,
  },
});
