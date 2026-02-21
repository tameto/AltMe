import React, { useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

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
import { useTopics } from '@/src/features/chat/hooks/use-topics';
import { ChatInputWeb } from '@/src/features/chat/components/chat-input-web';

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
    streamingText,
    connectionMode,
    wsStatus,
    todayUserCount,
    isAtLimit,
    handleSend,
    flatListRef,
  } = useChat();

  const { topics, activeTopic, setActiveTopic } = useTopics();

  const renderItem = useCallback(({ item }: { item: DisplayMessage | { type: 'separator'; date: string; id: string } }) => {
    if ('type' in item && item.type === 'separator') {
      return <DateSeparator date={item.date} />;
    }
    const msg = item as DisplayMessage;
    return (
      <ChatBubble
        role={msg.role}
        content={msg.content}
        createdAt={msg.createdAt}
        twinName={user?.twinName ?? APP_NAME}
        isStreaming={msg.id === 'streaming'}
      />
    );
  }, [user?.twinName]);

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

      {/* Message list */}
      <FlatList
        ref={flatListRef}
        data={displayData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        testID="chat-message-list"
      />

      {isLoading && !streamingText && (
        <View style={styles.typingIndicator}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.typingText}>{t('chat.thinking')}</Text>
        </View>
      )}

      {/* Input bar — Web vs Native */}
      {isWeb ? (
        <ChatInputWeb
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSend}
          disabled={isAtLimit}
          isLoading={isLoading}
          placeholder={isAtLimit ? t('chat.inputPlaceholderAtLimit') : undefined}
        />
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <View style={styles.inputBar}>
            <Pressable style={styles.plusButton}>
              <Feather name="plus" size={18} color="#FFFFFF70" />
            </Pressable>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder={isAtLimit ? t('chat.inputPlaceholderAtLimit') : t('chat.inputPlaceholder')}
              placeholderTextColor="#FFFFFF50"
              multiline
              maxLength={CHAT.maxMessageLength}
              editable={!isAtLimit}
            />
            {inputText.trim() && !isLoading && isOnline ? (
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
