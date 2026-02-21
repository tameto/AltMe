import { useEffect, useRef, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { supabase } from '@/src/services/supabase/client';
import { useUser } from '@/src/shared/hooks/use-user';
import { getUnreadCount, markMessagesAsRead } from '../services/chat-message-repo';
import { useChatStore } from '../stores/chat-store';

export type UseChatUnreadReturn = {
  unreadCount: number;
  markAsRead: (messageIds: string[]) => Promise<void>;
};

const RECONCILE_INTERVAL_MS = 60_000;

export function useChatUnread(): UseChatUnreadReturn {
  const user = useUser((s) => s.user);
  const unreadCount = useChatStore((s) => s.unreadCount);
  const setUnreadCount = useChatStore((s) => s.setUnreadCount);
  const incrementUnreadCount = useChatStore((s) => s.incrementUnreadCount);
  const decrementUnreadCount = useChatStore((s) => s.decrementUnreadCount);

  const reconcileTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reconcile = useCallback(async () => {
    if (!user?.id) return;
    const count = await getUnreadCount(user.id);
    setUnreadCount(count);
  }, [user?.id, setUnreadCount]);

  const markAsRead = useCallback(
    async (messageIds: string[]) => {
      if (messageIds.length === 0) return;
      await markMessagesAsRead(messageIds);
      decrementUnreadCount(messageIds.length);
    },
    [decrementUnreadCount],
  );

  // 初回マウント時に未読数を取得
  useEffect(() => {
    reconcile();
  }, [reconcile]);

  // Supabase Realtime: assistant メッセージの INSERT を購読
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`chat_unread_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newRow = payload.new as { role: string; is_read: boolean };
          if (newRow.role === 'assistant' && !newRow.is_read) {
            incrementUnreadCount();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, incrementUnreadCount]);

  // AppState foreground 復帰時に定期的に突合
  useEffect(() => {
    const startTimer = () => {
      stopTimer(); // Prevent double-start
      reconcileTimerRef.current = setInterval(reconcile, RECONCILE_INTERVAL_MS);
    };
    const stopTimer = () => {
      if (reconcileTimerRef.current !== null) {
        clearInterval(reconcileTimerRef.current);
        reconcileTimerRef.current = null;
      }
    };

    startTimer();

    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        reconcile();
        startTimer();
      } else {
        stopTimer();
      }
    });

    return () => {
      stopTimer();
      subscription.remove();
    };
  }, [reconcile]);

  return { unreadCount, markAsRead };
}
