import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { APP_NAME } from '@/src/config/constants';
import { useIsPro } from '@/src/shared/hooks/use-subscription';
import { useUser } from '@/src/shared/hooks/use-user';
import { fetchHistoryPaginated, countTodayMessages } from '../services/chat-message-repo';
import type { ChatMessageMetadata } from '@/src/shared/types/chat';

export type DisplayMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  metadata?: ChatMessageMetadata;
};

export type UseChatMessagesReturn = {
  messages: DisplayMessage[];
  isLoadingHistory: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  todayUserCount: number;
  addMessage: (msg: DisplayMessage) => void;
  incrementTodayCount: () => void;
  loadMoreHistory: () => Promise<void>;
};

export function useChatMessages(): UseChatMessagesReturn {
  const { t } = useTranslation();
  const isPro = useIsPro();
  const user = useUser((s) => s.user);

  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [todayUserCount, setTodayUserCount] = useState(0);

  const oldestCreatedAtRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!user?.id) {
        if (!cancelled) setIsLoadingHistory(false);
        return;
      }

      try {
        const { messages: history, hasMore: moreAvailable } = await fetchHistoryPaginated(user.id);

        if (cancelled) return;

        if (history.length > 0) {
          setMessages(history);
          setHasMore(moreAvailable);
          oldestCreatedAtRef.current = history[0].createdAt;
        } else {
          const twinName = user.twinName || APP_NAME;
          const welcomeContent = user.displayName
            ? t('chat.welcomeMessage', { name: user.displayName, twinName })
            : t('chat.welcomeMessageDefault', { twinName });
          setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: welcomeContent,
            createdAt: new Date().toISOString(),
          }]);
          setHasMore(false);
        }

        if (!isPro && !cancelled) {
          const count = await countTodayMessages(user.id, user.timezone || 'Asia/Tokyo');
          if (!cancelled) setTodayUserCount(count);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      } finally {
        if (!cancelled) setIsLoadingHistory(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user?.id, user?.displayName, user?.twinName, user?.timezone, isPro, t]);

  const loadMoreHistory = useCallback(async () => {
    if (!user?.id || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const { messages: older, hasMore: moreAvailable } = await fetchHistoryPaginated(
        user.id,
        undefined,
        oldestCreatedAtRef.current,
      );

      if (older.length > 0) {
        setMessages((prev) => [...older, ...prev]);
        setHasMore(moreAvailable);
        oldestCreatedAtRef.current = older[0].createdAt;
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load more chat history:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [user?.id, isLoadingMore, hasMore]);

  const addMessage = useCallback((msg: DisplayMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const incrementTodayCount = useCallback(() => {
    setTodayUserCount((c) => c + 1);
  }, []);

  return {
    messages,
    isLoadingHistory,
    isLoadingMore,
    hasMore,
    todayUserCount,
    addMessage,
    incrementTodayCount,
    loadMoreHistory,
  };
}
