import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { spacing, fontFamily } from '@/src/config/theme';
import { MarkdownRenderer } from './markdown-renderer';
import { MessageContextMenu } from './message-context-menu';
import { MediaAttachment } from './media-attachment';
import { TranslationView } from './translation-view';
import { OGPPreviewCard } from './ogp-preview-card';
import type { ContextMenuAction } from './message-context-menu';
import type { ChatMessageMetadata, TranslationData } from '@/src/shared/types/chat';

type TranslationState = {
  data: TranslationData | null;
  loading: boolean;
  error: string | null;
};

type ChatBubbleProps = {
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  twinName: string;
  isStreaming?: boolean;
  metadata?: ChatMessageMetadata;
  messageId?: string;
  onTranslateRequest?: (messageId: string, content: string) => Promise<void>;
  translationState?: TranslationState;
};

type MenuState = {
  visible: boolean;
  position: { x: number; y: number };
};

export function ChatBubble({
  role,
  content,
  createdAt,
  twinName,
  isStreaming,
  metadata,
  messageId,
  onTranslateRequest,
  translationState,
}: ChatBubbleProps) {
  const { t } = useTranslation();
  const isUser = role === 'user';
  const isJournalRelated = metadata?.isJournalPrompt || metadata?.isJournalEntry || metadata?.isJournalReflection;
  const time = new Date(createdAt).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const [menu, setMenu] = useState<MenuState>({ visible: false, position: { x: 0, y: 0 } });
  const [translationExpanded, setTranslationExpanded] = useState(false);

  // Web: allow text selection via userSelect style
  const selectableStyle = Platform.OS === 'web' ? { userSelect: 'text' as const } : {};

  // キャッシュ済み翻訳（metadata から）を優先
  const cachedTranslation = metadata?.translation ?? null;
  const resolvedTranslation: TranslationData | null = cachedTranslation ?? translationState?.data ?? null;
  const isTranslating = translationState?.loading ?? false;
  const translationError = translationState?.error ?? null;
  const hasTranslationActivity = resolvedTranslation !== null || isTranslating || translationError !== null;

  const handleTranslate = async () => {
    if (!messageId || !onTranslateRequest) return;
    setTranslationExpanded(true);
    await onTranslateRequest(messageId, content);
  };

  const handleLongPress = (event: { nativeEvent: { pageX: number; pageY: number } }) => {
    if (isStreaming === true) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setMenu({
      visible: true,
      position: { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY },
    });
  };

  const handleMenuClose = () => {
    setMenu((prev) => ({ ...prev, visible: false }));
  };

  const handleMenuAction = async (action: ContextMenuAction) => {
    if (action === 'copy') {
      const plainText = content.replace(/[*_`#\[\]]/g, '');
      await Clipboard.setStringAsync(plainText);
    } else if (action === 'translate') {
      await handleTranslate();
    }
    // 'reply' は将来実装
  };

  const attachments = metadata?.attachments ?? [];

  const renderContent = () => {
    // Streaming中はプレーンテキストで表示（マークダウンパース不要）
    if (isStreaming === true) {
      return (
        <Text style={[styles.messageText, selectableStyle]} testID="chat-bubble-content">
          {content}
          <Text style={styles.cursor}>{'|'}</Text>
        </Text>
      );
    }

    return (
      <View style={selectableStyle} testID="chat-bubble-content">
        {content.trim().length > 0 ? (
          <MarkdownRenderer content={content} isUserMessage={isUser} />
        ) : null}
        {attachments.map((attachment, index) => (
          <MediaAttachment key={index} attachment={attachment} />
        ))}
        <OGPPreviewCard content={content} cachedOgp={metadata?.ogp} />
      </View>
    );
  };

  if (isUser) {
    return (
      <>
        <Pressable
          style={styles.wrapper}
          testID="chat-bubble-user"
          onLongPress={handleLongPress}
          delayLongPress={400}
        >
          <View style={styles.userRow}>
            <View style={[styles.userContent, isJournalRelated ? styles.journalContent : null]}>
              {isJournalRelated ? (
                <View style={styles.journalBadge}>
                  <Text style={styles.journalBadgeText}>{'📝'}</Text>
                </View>
              ) : null}
              {renderContent()}
              <Text style={styles.timestamp}>{time}</Text>
            </View>
          </View>
        </Pressable>

        <MessageContextMenu
          visible={menu.visible}
          position={menu.position}
          onClose={handleMenuClose}
          onAction={handleMenuAction}
          messageContent={content}
        />
      </>
    );
  }

  return (
    <>
      <Pressable
        style={styles.wrapper}
        testID="chat-bubble-assistant"
        onLongPress={handleLongPress}
        delayLongPress={400}
      >
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
          <View style={[styles.aiContent, isJournalRelated ? styles.journalContent : null]}>
            {isJournalRelated ? (
              <View style={styles.journalBadge}>
                <Text style={styles.journalBadgeText}>{'📝'}</Text>
              </View>
            ) : null}
            {renderContent()}
          </View>
        </View>

        {/* Translate link — streaming中かつ翻訳済みでなければ表示 */}
        {isStreaming !== true && onTranslateRequest && messageId && !hasTranslationActivity ? (
          <Pressable style={styles.translateRow} onPress={handleTranslate}>
            <Text style={styles.translateText}>{t('chat.translateLink')}</Text>
          </Pressable>
        ) : null}

        {/* TranslationView */}
        {isStreaming !== true && hasTranslationActivity ? (
          <TranslationView
            translation={resolvedTranslation}
            isLoading={isTranslating}
            error={translationError}
            onRetry={handleTranslate}
            onToggle={() => setTranslationExpanded((prev) => !prev)}
            isExpanded={translationExpanded}
          />
        ) : null}
      </Pressable>

      <MessageContextMenu
        visible={menu.visible}
        position={menu.position}
        onClose={handleMenuClose}
        onAction={handleMenuAction}
        messageContent={content}
      />
    </>
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
  // ---- Journal ----
  journalContent: {
    backgroundColor: 'rgba(212, 168, 83, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(212, 168, 83, 0.3)',
  },
  journalBadge: {
    position: 'absolute',
    top: -8,
    left: -8,
    zIndex: 1,
  },
  journalBadgeText: {
    fontSize: 14,
  },
});
