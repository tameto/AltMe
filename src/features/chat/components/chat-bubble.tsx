import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { spacing, fontFamily } from '@/src/config/theme';

type ChatBubbleProps = {
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  twinName: string;
  isStreaming?: boolean;
  onTranslatePress?: () => void;
};

export function ChatBubble({
  role,
  content,
  createdAt,
  twinName,
  isStreaming,
  onTranslatePress,
}: ChatBubbleProps) {
  const { t } = useTranslation();
  const isUser = role === 'user';
  const time = new Date(createdAt).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isUser) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.userRow}>
          <View style={styles.userContent}>
            <Text style={styles.messageText}>{content}</Text>
            <Text style={styles.timestamp}>{time}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* AI header: avatar + name + time */}
      <View style={styles.aiHeader}>
        <View style={styles.aiAvatar}>
          <MaterialCommunityIcons name="robot-outline" size={12} color="#7DD3FC" />
        </View>
        <Text style={styles.aiName}>{twinName}</Text>
        <Text style={styles.aiTime}>{time}</Text>
      </View>

      {/* AI bubble */}
      <View style={styles.aiRow}>
        <View style={styles.aiContent}>
          <Text style={styles.messageText}>
            {content}
            {isStreaming === true ? <Text style={styles.cursor}>{'|'}</Text> : null}
          </Text>
        </View>
      </View>

      {/* Translate link */}
      {isStreaming !== true && onTranslatePress ? (
        <Pressable style={styles.translateRow} onPress={onTranslatePress}>
          <Text style={styles.translateText}>{t('chat.translateLink')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  // ---- AI ----
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    paddingLeft: 4,
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#7DD3FC20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiName: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
    color: '#7DD3FC',
  },
  aiTime: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: '#FFFFFF40',
  },
  aiRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  aiContent: {
    maxWidth: '75%',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 16,
  },
  translateRow: {
    paddingLeft: 40,
    marginTop: 4,
  },
  translateText: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    color: '#D4A853',
  },
  // ---- User ----
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  userContent: {
    maxWidth: '75%',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: '#7DD3FC4D',
    borderWidth: 1,
    borderColor: '#7DD3FC30',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 16,
    gap: 4,
  },
  // ---- Shared ----
  messageText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: '#F0F0F0',
    lineHeight: 21,
  },
  timestamp: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: '#FFFFFF40',
    alignSelf: 'flex-end',
  },
  cursor: {
    color: '#7DD3FC',
    fontFamily: fontFamily.bold,
  },
});
