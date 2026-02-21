import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/src/services/supabase/client';
import { useUser } from '@/src/shared/hooks/use-user';
import { DEFAULT_TOPICS } from '@/src/config/constants';
import type { ChatTopicKey } from '@/src/shared/types/chat';

const ACTIVE_TOPIC_KEY = 'chat_active_topic';

type TopicItem = {
  key: ChatTopicKey;
  name: string;
};

export type UseTopicsReturn = {
  topics: TopicItem[];
  activeTopic: ChatTopicKey;
  setActiveTopic: (key: ChatTopicKey) => void;
  isLoading: boolean;
};

export function useTopics(): UseTopicsReturn {
  const user = useUser((s) => s.user);
  const [topics, setTopics] = useState<TopicItem[]>(
    DEFAULT_TOPICS.map((t) => ({ key: t.key, name: t.name })),
  );
  const [activeTopic, setActiveTopicState] = useState<ChatTopicKey>('daily');
  const [isLoading, setIsLoading] = useState(true);

  // Load active topic from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(ACTIVE_TOPIC_KEY)
      .then((stored) => {
        if (stored && ['daily', 'work', 'reflection', 'consultation'].includes(stored)) {
          setActiveTopicState(stored as ChatTopicKey);
        }
      })
      .catch(() => {
        // Silently fall back to default topic
      });
  }, []);

  // Load topics from Supabase
  useEffect(() => {
    const loadTopics = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      try {
        const { data } = await supabase
          .from('chat_topics')
          .select('id, name, sort_order')
          .eq('user_id', user.id)
          .order('sort_order', { ascending: true });

        if (data && data.length > 0) {
          const validKeys = new Set<ChatTopicKey>(['daily', 'work', 'reflection', 'consultation']);
          const mapped = data.map((t) => {
            const raw = t.id.split('::')[1] ?? '';
            const key: ChatTopicKey = validKeys.has(raw as ChatTopicKey)
              ? (raw as ChatTopicKey)
              : 'daily';
            return { key, name: t.name };
          });
          setTopics(mapped);
        }
      } catch (error) {
        console.error('Failed to load topics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTopics();
  }, [user?.id]);

  const setActiveTopic = useCallback((key: ChatTopicKey) => {
    setActiveTopicState(key);
    AsyncStorage.setItem(ACTIVE_TOPIC_KEY, key);
  }, []);

  return { topics, activeTopic, setActiveTopic, isLoading };
}
