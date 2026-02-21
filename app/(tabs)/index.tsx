import React, { useCallback, useState } from 'react';
import {
  View,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Text,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import type { ImagePickerAsset } from 'expo-image-picker';

import { colors, fontFamily, sendGradient } from '@/src/config/theme';
import { CosmicBackground } from '@/src/shared/components/cosmic-background';
import { FREE_DAILY_LIMIT, APP_NAME, CHAT } from '@/src/config/constants';
import { useIsPro } from '@/src/shared/hooks/use-subscription';
import { useUser } from '@/src/shared/hooks/use-user';
import { useNetwork } from '@/src/shared/hooks/use-network';
import { useAuthStore } from '@/src/features/auth/stores/auth-store';
import { usePageTitle } from '@/src/shared/hooks/use-page-title';
import { GuestPromptOverlay } from '@/src/shared/components/guest-prompt-overlay';
import { useChat, type DisplayMessage } from '@/src/features/chat/hooks/use-chat';
import { ChatHeader } from '@/src/features/chat/components/chat-header';
import { TopicChipsRow } from '@/src/features/chat/components/topic-chips-row';
import { ChatBubble } from '@/src/features/chat/components/chat-bubble';
import { DateSeparator } from '@/src/features/chat/components/date-separator';
import { RemainingCounter } from '@/src/features/chat/components/remaining-counter';
import { ScrollToBottomFab } from '@/src/features/chat/components/scroll-to-bottom-fab';
import { useTopics } from '@/src/features/chat/hooks/use-topics';
import { useTranslation as useChatTranslation } from '@/src/features/chat/hooks/use-translation';
import { ChatInputWeb } from '@/src/features/chat/components/chat-input-web';
import { MediaPicker } from '@/src/features/chat/components/media-picker';
import { uploadChatMedia } from '@/src/features/chat/services/media-upload';

const isWeb = Platform.OS === 'web';

export default function ChatScreen() {
  const { t } = useTranslation();
  usePageTitle(t('tabs.chat'));
  const isPro = useIsPro();
  const user = useUser((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { isConnected: isOnline } = useNetwork();

  const {
    displayData,
    inputText,
    setInputText,
    isLoading,
    isLoadingHistory,
    isLoadingMore,
    hasMore,
    streamingText,
    connectionMode,
    wsStatus,
    todayUserCount,
    isAtLimit,
    isJournalMode,
    journalMaxLength,
    handleSend,
    handleSendWithAttachment,
    loadMoreHistory,
    flatListRef,
    showScrollToBottom,
    scrollToBottom,
    onScroll,
    unreadCount,
  } = useChat();

  const [mediaPickerVisible, setMediaPickerVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { topics, activeTopic, setActiveTopic } = useTopics();
  const { translate, translations } = useChatTranslation();

  const handleImageSelected = useCallback(async (asset: ImagePickerAsset) => {
    if (!user?.id) return;

    setIsUploading(true);
    try {
      const messageId = `img-${Date.now()}`;
      const fileName = asset.fileName ?? `image_${messageId}.jpg`;
      const mimeType = asset.mimeType ?? 'image/jpeg';

      const url = await uploadChatMedia(
        user.id,
        messageId,
        asset.uri,
        fileName,
        mimeType,
      );

      await handleSendWithAttachment({
        type: 'image',
        url,
        fileName,
        fileSize: asset.fileSize ?? 0,
        mimeType,
        width: asset.width,
        height: asset.height,
      });
    } catch (error) {
      Alert.alert('エラー', '画像のアップロードに失敗しました。もう一度お試しください。');
      console.error('Image upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  }, [user?.id, handleSendWithAttachment]);

  const renderItem = useCallback(({ item }: { item: DisplayMessage | { type: 'separator'; date: string; id: string } }) => {
    if ('type' in item && item.type === 'separator') {
      return <DateSeparator date={item.date} />;
    }
    const msg = item as DisplayMessage;
    const translationState = translations.get(msg.id);
    return (
      <ChatBubble
        role={msg.role}
        content={msg.content}
        createdAt={msg.createdAt}
        twinName={user?.twinName ?? APP_NAME}
        isStreaming={msg.id === 'streaming'}
        metadata={msg.metadata}
        messageId={msg.id}
        onTranslateRequest={translate}
        translationState={translationState}
      />
    );
  }, [user?.twinName, translations, translate]);

  if (!isAuthenticated) {
    return (
      <CosmicBackground>
        <SafeAreaView style={styles.container} edges={['top']}>
          <GuestPromptOverlay />
        </SafeAreaView>
      </CosmicBackground>
    );
  }

  if (isLoadingHistory) {
    return (
      <CosmicBackground>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </SafeAreaView>
      </CosmicBackground>
    );
  }

  const Wrapper = isWeb ? View : SafeAreaView;
  const wrapperProps = isWeb ? { style: styles.container } : { style: styles.container, edges: ['top'] as const };

  const chatContent = (
    <>
      {/* Header */}
      <ChatHeader
        twinName={user?.twinName ?? APP_NAME}
        isOnline={isOnline}
        isPro={isPro}
        todayUserCount={todayUserCount}
        freeLimit={FREE_DAILY_LIMIT}
        connectionMode={connectionMode}
        wsStatus={wsStatus}
      />

      {/* Topic chips */}
      <TopicChipsRow
        topics={topics}
        activeTopic={activeTopic}
        onSelect={setActiveTopic}
      />

      {/* Offline/reconnect banners */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Feather name="wifi-off" size={12} color={colors.error} />
          <Text style={styles.offlineText}>{t('chat.offline')}</Text>
        </View>
      )}

      {isOnline && isPro && wsStatus === 'reconnecting' && (
        <View style={styles.reconnectBanner}>
          <ActivityIndicator size="small" color={colors.warning} />
          <Text style={styles.reconnectText}>{t('chat.connectionStatus.reconnecting')}</Text>
        </View>
      )}

      {/* Remaining counter (free users only) */}
      {!isPro && (
        <RemainingCounter
          remaining={Math.max(0, FREE_DAILY_LIMIT - todayUserCount)}
          total={FREE_DAILY_LIMIT}
        />
      )}

      {/* Message list + FAB */}
      <View style={styles.messageListContainer}>
        <FlatList
          ref={flatListRef}
          data={displayData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          testID="chat-message-list"
          onStartReached={hasMore ? loadMoreHistory : undefined}
          onStartReachedThreshold={0.1}
          onScroll={onScroll}
          scrollEventThrottle={16}
          ListHeaderComponent={
            isLoadingMore ? (
              <View style={styles.loadMoreIndicator}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : hasMore ? null : displayData.length > 1 ? (
              <View style={styles.noMoreMessages}>
                <Text style={styles.noMoreText}>{t('chat.noMoreMessages')}</Text>
              </View>
            ) : null
          }
        />

        <ScrollToBottomFab
          visible={showScrollToBottom}
          unreadCount={unreadCount}
          onPress={scrollToBottom}
        />
      </View>

      {(isLoading || isUploading) && !streamingText && (
        <View style={styles.typingIndicator}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.typingText}>
            {isUploading ? '画像をアップロード中...' : t('chat.thinking')}
          </Text>
        </View>
      )}

      {/* Input bar — Web vs Native */}
      {isWeb ? (
        <ChatInputWeb
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSend}
          onImageSelected={handleImageSelected}
          disabled={isAtLimit}
          isLoading={isLoading || isUploading}
          placeholder={isAtLimit ? t('chat.inputPlaceholderAtLimit') : undefined}
        />
      ) : (
        <>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
          >
            <View style={styles.inputBar}>
              <Pressable
                style={styles.plusButton}
                onPress={() => setMediaPickerVisible(true)}
                disabled={isAtLimit || isUploading}
              >
                <Feather name="plus" size={18} color="#FFFFFF70" />
              </Pressable>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder={
                  isAtLimit
                    ? t('chat.inputPlaceholderAtLimit')
                    : isJournalMode
                    ? t('chat.inputPlaceholderJournal', { defaultValue: '今日の出来事を書いてみよう...' })
                    : t('chat.inputPlaceholder')
                }
                placeholderTextColor="#FFFFFF50"
                multiline
                maxLength={journalMaxLength}
                editable={!isAtLimit}
              />
              {inputText.trim() && !isLoading && !isUploading && isOnline ? (
                <Pressable style={styles.sendButton} onPress={handleSend}>
                  <LinearGradient
                    colors={sendGradient.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.sendGradient}
                  >
                    <Feather name="send" size={18} color="#0F172A" />
                  </LinearGradient>
                </Pressable>
              ) : null}
            </View>
          </KeyboardAvoidingView>

          <MediaPicker
            visible={mediaPickerVisible}
            onClose={() => setMediaPickerVisible(false)}
            onImageSelected={handleImageSelected}
          />
        </>
      )}
    </>
  );

  return (
    <CosmicBackground>
      <Wrapper {...wrapperProps}>
        {isWeb ? (
          <View style={styles.webCenteredContainer} testID="chat-web-layout">
            {chatContent}
          </View>
        ) : (
          chatContent
        )}
      </Wrapper>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  webCenteredContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.error + '15',
    paddingVertical: 4,
  },
  offlineText: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: colors.error,
  },
  reconnectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.warning + '15',
    paddingVertical: 4,
  },
  reconnectText: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: colors.warning,
  },
  messageListContainer: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexGrow: 1,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 8,
  },
  typingText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
  },
  loadMoreIndicator: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  noMoreMessages: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  noMoreText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
  },
  // ---- Native Input bar ----
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    backgroundColor: '#0F172ADD',
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF10',
  },
  plusButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF10',
    borderWidth: 1,
    borderColor: '#FFFFFF20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF08',
    borderWidth: 1,
    borderColor: '#FFFFFF12',
    paddingHorizontal: 14,
    paddingVertical: 0,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: colors.text,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  sendGradient: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
