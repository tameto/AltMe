import { useState, useCallback, useEffect } from 'react';
import { listCommunities, type Community } from '@/src/services/community/client';

export type UseCommunitiesReturn = {
  communities: Community[];
  isLoading: boolean;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
};

export function useCommunities(): UseCommunitiesReturn {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchCommunities = useCallback(async () => {
    const data = await listCommunities();
    setCommunities(data);
  }, []);

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
