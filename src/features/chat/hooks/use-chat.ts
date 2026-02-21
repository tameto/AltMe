import { useState, useCallback, useEffect } from 'react';
import { FlatList, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useRouter } from 'expo-router';

import { FREE_DAILY_LIMIT, CHAT } from '@/src/config/constants';
import { useIsPro } from '@/src/shared/hooks/use-subscription';
import { useNetwork } from '@/src/shared/hooks/use-network';
import { useUser } from '@/src/shared/hooks/use-user';
import { useChatMessages } from './use-chat-messages';
import { useChatTransport } from './use-chat-transport';
import { useChatScroll } from './use-chat-scroll';
import { useChatUnread } from './use-chat-unread';
import { useJournalIntegration } from './use-journal-integration';
import type { WsConnectionStatus, ConnectionMode } from '@/src/shared/types/openclaw';
import type { ChatAttachment } from '@/src/shared/types/chat';

export type { DisplayMessage } from './use-chat-messages';

export type UseChatReturn = {
  messages: ReturnType<typeof useChatMessages>['messages'];
  displayData: ReturnType<typeof useChatMessages>['messages'];
  inputText: string;
  setInputText: (text: string) => void;
  isLoading: boolean;
  isLoadingHistory: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  streamingText: string;
  connectionMode: ConnectionMode;
  wsStatus: WsConnectionStatus;
  todayUserCount: number;
  isAtLimit: boolean;
  isJournalMode: boolean;
  journalMaxLength: number;
  handleSend: () => Promise<void>;
  handleSendWithAttachment: (attachment: ChatAttachment) => Promise<void>;
  loadMoreHistory: () => Promise<void>;
  flatListRef: React.RefObject<FlatList | null>;
  showScrollToBottom: boolean;
  scrollToBottom: () => void;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  unreadCount: number;
};

export function useChat(): UseChatReturn {
  const router = useRouter();
  const isPro = useIsPro();
  const { isConnected: isOnline } = useNetwork();
  const user = useUser((s) => s.user);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    messages,
    isLoadingHistory,
    isLoadingMore,
    hasMore,
    todayUserCount,
    addMessage,
    incrementTodayCount,
    loadMoreHistory,
  } = useChatMessages();

  const {
    connectionMode,
    wsStatus,
    streamingText,
    sendViaEdgeFunction,
    sendViaWebSocket,
  } = useChatTransport();

  const { flatListRef, showScrollToBottom, scrollToBottom, onScroll } = useChatScroll({
    messageCount: messages.length,
    streamingText,
  });

  const { unreadCount } = useChatUnread();

  const {
    shouldShowReflectionPrompt,
    isJournalMode,
    journalMaxLength,
    buildReflectionPromptMessage,
    handleJournalResponse,
    activateJournalMode,
  } = useJournalIntegration(isPro, user?.id);

  // Show reflection prompt when history has loaded and conditions are met
  useEffect(() => {
    if (!isLoadingHistory && shouldShowReflectionPrompt && messages.length > 0) {
      const promptMsg = buildReflectionPromptMessage();
      addMessage(promptMsg);
      activateJournalMode();
    }
    // Run only when history finishes loading and prompt flag changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingHistory, shouldShowReflectionPrompt]);

  const isAtLimit = !isPro && todayUserCount >= FREE_DAILY_LIMIT;

  const maxLength = isJournalMode ? journalMaxLength : CHAT.maxMessageLength;

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isLoading || !isOnline) return;

    if (isAtLimit) {
      router.push('/(paywall)');
      return;
    }

    if (text.length > maxLength) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      content: text,
      createdAt: new Date().toISOString(),
      metadata: isJournalMode ? { isJournalEntry: true } : undefined,
    };

    addMessage(userMessage);
    setInputText('');
    setIsLoading(true);

    if (isJournalMode && user?.id) {
      await handleJournalResponse(text, user.id, messages, addMessage);
      setIsLoading(false);
      return;
    }

    if (connectionMode === 'websocket') {
      const sent = sendViaWebSocket(text);
      if (!sent) {
        await sendViaEdgeFunction(text, {
          onAddMessage: addMessage,
          onIncrementTodayCount: incrementTodayCount,
        });
        setIsLoading(false);
      }
      // isLoading cleared by onTextDone callback for WebSocket
    } else {
      await sendViaEdgeFunction(text, {
        onAddMessage: addMessage,
        onIncrementTodayCount: incrementTodayCount,
      });
      setIsLoading(false);
    }
  }, [
    inputText,
    isLoading,
    isAtLimit,
    isOnline,
    maxLength,
    isJournalMode,
    router,
    connectionMode,
    user?.id,
    messages,
    addMessage,
    incrementTodayCount,
    sendViaWebSocket,
    sendViaEdgeFunction,
    handleJournalResponse,
  ]);

  const handleSendWithAttachment = useCallback(async (attachment: ChatAttachment) => {
    if (isLoading || !isOnline) return;

    if (isAtLimit) {
      router.push('/(paywall)');
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      content: '',
      createdAt: new Date().toISOString(),
      metadata: { attachments: [attachment] },
    };

    addMessage(userMessage);
    setIsLoading(true);

    // Send a message about the image to AI
    const imageMessage = `[画像が送信されました: ${attachment.fileName}]`;
    if (connectionMode === 'websocket') {
      const sent = sendViaWebSocket(imageMessage);
      if (!sent) {
        await sendViaEdgeFunction(imageMessage, {
          onAddMessage: addMessage,
          onIncrementTodayCount: incrementTodayCount,
        });
        setIsLoading(false);
      }
    } else {
      await sendViaEdgeFunction(imageMessage, {
        onAddMessage: addMessage,
        onIncrementTodayCount: incrementTodayCount,
      });
      setIsLoading(false);
    }
  }, [
    isLoading,
    isAtLimit,
    isOnline,
    router,
    connectionMode,
    addMessage,
    incrementTodayCount,
    sendViaWebSocket,
    sendViaEdgeFunction,
  ]);

  const displayData = streamingText
    ? [...messages, {
        id: 'streaming',
        role: 'assistant' as const,
        content: streamingText,
        createdAt: new Date().toISOString(),
      }]
    : messages;

  return {
    messages,
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
    journalMaxLength: maxLength,
    handleSend,
    handleSendWithAttachment,
    loadMoreHistory,
    flatListRef,
    showScrollToBottom,
    scrollToBottom,
    onScroll,
    unreadCount,
  };
}
