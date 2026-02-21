import { useState, useEffect, useCallback } from 'react';
import {
  getCommunity,
  getCommunityMembers,
  getCommunityMessages,
  type Community,
  type CommunityMember,
  type CommunityMessage,
} from '@/src/services/community/client';

const MESSAGES_LIMIT = 50;

export type UseCommunityDetailReturn = {
  community: Community | null;
  members: CommunityMember[];
  messages: CommunityMessage[];
  loading: boolean;
  error: string | null;
  loadMoreMessages: () => Promise<void>;
  hasMoreMessages: boolean;
  refreshCommunity: () => Promise<void>;
};

export function useCommunityDetail(communityId: string): UseCommunityDetailReturn {
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [communityData, membersData, messagesData] = await Promise.all([
        getCommunity(communityId),
        getCommunityMembers(communityId),
        getCommunityMessages(communityId, { limit: MESSAGES_LIMIT }),
      ]);
      setCommunity(communityData);
      setMembers(membersData);
      setMessages(messagesData);
      setHasMoreMessages(messagesData.length >= MESSAGES_LIMIT);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load community');
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const loadMoreMessages = useCallback(async () => {
    if (!hasMoreMessages || messages.length === 0) return;
    try {
      const oldest = messages[0];
      const older = await getCommunityMessages(communityId, {
        limit: MESSAGES_LIMIT,
        before: oldest.createdAt,
      });
      setMessages((prev) => [...older, ...prev]);
      setHasMoreMessages(older.length >= MESSAGES_LIMIT);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load more messages');
    }
  }, [communityId, hasMoreMessages, messages]);

  const refreshCommunity = useCallback(async () => {
    await fetchAll();
  }, [fetchAll]);

  return {
    community,
    members,
    messages,
    loading,
    error,
    loadMoreMessages,
    hasMoreMessages,
    refreshCommunity,
  };
}
