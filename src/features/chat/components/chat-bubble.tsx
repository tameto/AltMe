import React, { useMemo, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Linking } from 'react-native';
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

// URL detection regex
const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;

// XSS sanitization: strip HTML tags and dangerous patterns
const sanitizeContent = (text: string): string =>
  text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');

// Parse content into text and link segments
type ContentSegment = { type: 'text'; value: string } | { type: 'link'; value: string };

const parseContent = (text: string): ContentSegment[] => {
  const sanitized = sanitizeContent(text);
  const segments: ContentSegment[] = [];
  let lastIndex = 0;

  for (const match of sanitized.matchAll(URL_REGEX)) {
    if (match.index !== undefined && match.index > lastIndex) {
      segments.push({ type: 'text', value: sanitized.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'link', value: match[0] });
    lastIndex = (match.index ?? 0) + match[0].length;
  }

  if (lastIndex < sanitized.length) {
    segments.push({ type: 'text', value: sanitized.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: 'text', value: sanitized }];
};

const openLink = (url: string) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    Linking.openURL(url);
  }
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

  const segments = useMemo(() => parseContent(content), [content]);

  const handleLinkPress = useCallback((url: string) => {
    openLink(url);
  }, []);

  // Web: allow text selection via userSelect style
  const selectableStyle = Platform.OS === 'web' ? { userSelect: 'text' as const } : {};

  const renderContent = () => (
    <Text style={[styles.messageText, selectableStyle]} testID="chat-bubble-content">
      {segments.map((seg, i) =>
        seg.type === 'link' ? (
          <Text
            key={i}
            style={styles.linkText}
            onPress={() => handleLinkPress(seg.value)}
            accessibilityRole="link"
          >
            {seg.value}
          </Text>
        ) : (
          <Text key={i}>{seg.value}</Text>
        ),
      )}
      {isStreaming === true ? <Text style={styles.cursor}>{'|'}</Text> : null}
    </Text>
  );

  if (isUser) {
    return (
      <View style={styles.wrapper} testID="chat-bubble-user">
        <View style={styles.userRow}>
          <View style={styles.userContent}>
            {renderContent()}
            <Text style={styles.timestamp}>{time}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper} testID="chat-bubble-assistant">
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
          {renderContent()}
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
  linkText: {
    color: '#7DD3FC',
    textDecorationLine: 'underline' as const,
  },
  cursor: {
    color: '#7DD3FC',
    fontFamily: fontFamily.bold,
  },
});
