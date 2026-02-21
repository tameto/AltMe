import { useState, useCallback, useEffect, useRef } from 'react';
import { listCommunities, type Community } from '@/src/services/community/client';

export type UseCommunitiesReturn = {
  communities: Community[];
  isLoading: boolean;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
};

export function useCommunities(language?: string): UseCommunitiesReturn {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const reqIdRef = useRef(0);

  const fetchCommunities = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    const data = await listCommunities(language);
    if (reqId === reqIdRef.current) {
      setCommunities(data);
    }
  }, [language]);

  useEffect(() => {
    setIsLoading(true);
    fetchCommunities().finally(() => setIsLoading(false));
  }, [fetchCommunities]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchCommunities();
    setIsRefreshing(false);
  }, [fetchCommunities]);

  return {
    communities,
    isLoading,
    isRefreshing,
    refresh,
  };
}
