import { useState, useEffect, useCallback } from 'react';
import {
  checkMembership,
  joinCommunity,
  leaveCommunity,
} from '@/src/services/community/client';

export type UseCommunityMembershipReturn = {
  isMember: boolean;
  loading: boolean;
  join: () => Promise<void>;
  leave: () => Promise<void>;
};

export function useCommunityMembership(communityId: string): UseCommunityMembershipReturn {
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    checkMembership(communityId)
      .then((result) => {
        if (!cancelled) {
          setIsMember(result);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [communityId]);

  const join = useCallback(async () => {
    setLoading(true);
    try {
      const success = await joinCommunity(communityId);
      if (success) {
        setIsMember(true);
      }
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  const leave = useCallback(async () => {
    setLoading(true);
    try {
      const success = await leaveCommunity(communityId);
      if (success) {
        setIsMember(false);
      }
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  return { isMember, loading, join, leave };
}
