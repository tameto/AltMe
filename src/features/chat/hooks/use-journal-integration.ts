import { useState, useEffect, useCallback } from 'react';

import { supabase } from '@/src/services/supabase/client';
import { JOURNAL_MAX_LENGTH } from '@/src/config/constants';
import type { DisplayMessage } from './use-chat-messages';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

const REFLECTION_PROMPT_CONTENT = '今日はどうだった？何か印象に残ったことがあれば教えて。';

const checkLastChatTime = async (userId: string): Promise<boolean> => {
  const { data } = await supabase
    .from('chat_messages')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (!data || data.length === 0) return true;

  const lastChat = new Date(data[0].created_at);
  const sixHoursAgo = new Date(Date.now() - SIX_HOURS_MS);
  return lastChat < sixHoursAgo;
};

const hasReflectionToday = async (userId: string): Promise<boolean> => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('journal_entries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', todayStart.toISOString());

  return (count ?? 0) > 0;
};

export type UseJournalIntegrationReturn = {
  shouldShowReflectionPrompt: boolean;
  isJournalMode: boolean;
  journalMaxLength: number;
  buildReflectionPromptMessage: () => DisplayMessage;
  handleJournalResponse: (
    content: string,
    userId: string,
    recentMessages: DisplayMessage[],
    onAddMessage: (msg: DisplayMessage) => void,
  ) => Promise<void>;
  activateJournalMode: () => void;
  deactivateJournalMode: () => void;
};

export function useJournalIntegration(isPro: boolean, userId?: string): UseJournalIntegrationReturn {
  const [shouldShowReflectionPrompt, setShouldShowReflectionPrompt] = useState(false);
  const [isJournalMode, setIsJournalMode] = useState(false);

  useEffect(() => {
    if (!isPro || !userId) {
      setShouldShowReflectionPrompt(false);
      return;
    }

    let cancelled = false;

    const check = async () => {
      try {
        const [sixHoursPassed, alreadyReflected] = await Promise.all([
          checkLastChatTime(userId),
          hasReflectionToday(userId),
        ]);

        if (!cancelled) {
          setShouldShowReflectionPrompt(sixHoursPassed && !alreadyReflected);
        }
      } catch (error) {
        console.error('Journal integration check failed:', error);
      }
    };

    check();
    return () => { cancelled = true; };
  }, [isPro, userId]);

  const buildReflectionPromptMessage = useCallback((): DisplayMessage => ({
    id: `journal-prompt-${Date.now()}`,
    role: 'assistant',
    content: REFLECTION_PROMPT_CONTENT,
    createdAt: new Date().toISOString(),
    metadata: { isJournalPrompt: true },
  }), []);

  const activateJournalMode = useCallback(() => {
    setIsJournalMode(true);
  }, []);

  const deactivateJournalMode = useCallback(() => {
    setIsJournalMode(false);
  }, []);

  const handleJournalResponse = useCallback(async (
    content: string,
    uid: string,
    recentMessages: DisplayMessage[],
    onAddMessage: (msg: DisplayMessage) => void,
  ) => {
    try {
      // Save to journal_entries
      const { data: journalEntry, error: journalError } = await supabase
        .from('journal_entries')
        .insert({ user_id: uid, content })
        .select('id')
        .single();

      if (journalError) {
        console.error('Failed to save journal entry:', journalError);
      }

      const journalEntryId = journalEntry?.id as string | undefined;

      // Call journal-reflect Edge Function
      const { data: reflectData, error: reflectError } = await supabase.functions.invoke(
        'journal-reflect',
        { body: { journalEntryId } },
      );

      if (reflectError || !reflectData?.reflection) {
        console.error('Journal reflect failed:', reflectError);
        onAddMessage({
          id: `reflection-error-${Date.now()}`,
          role: 'assistant',
          content: '振り返りを生成できませんでした。',
          createdAt: new Date().toISOString(),
        });
        setIsJournalMode(false);
        return;
      }

      // Add AI reflection as chat message
      onAddMessage({
        id: `reflection-${Date.now()}`,
        role: 'assistant',
        content: reflectData.reflection as string,
        createdAt: new Date().toISOString(),
        metadata: {
          isJournalReflection: true,
          journalEntryId,
        },
      });

      setIsJournalMode(false);
      setShouldShowReflectionPrompt(false);
    } catch (error) {
      console.error('handleJournalResponse failed:', error);
      onAddMessage({
        id: `reflection-error-${Date.now()}`,
        role: 'assistant',
        content: '振り返りを生成できませんでした。',
        createdAt: new Date().toISOString(),
      });
      setIsJournalMode(false);
    }
  }, []);

  return {
    shouldShowReflectionPrompt,
    isJournalMode,
    journalMaxLength: JOURNAL_MAX_LENGTH,
    buildReflectionPromptMessage,
    handleJournalResponse,
    activateJournalMode,
    deactivateJournalMode,
  };
}
