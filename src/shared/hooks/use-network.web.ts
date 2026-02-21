import { useState, useEffect, useCallback } from 'react';
import type { NetworkState } from '@/src/shared/types/platform';

type UseNetworkReturn = {
  isConnected: boolean;
  isLoading: boolean;
  networkState: NetworkState;
};

export const useNetwork = (): UseNetworkReturn => {
  const [isConnected, setIsConnected] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleOnline = useCallback(() => setIsConnected(true), []);
  const handleOffline = useCallback(() => setIsConnected(false), []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Sync initial state
    setIsConnected(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  const networkState: NetworkState = {
    isConnected,
    isInternetReachable: isConnected,
    type: isConnected ? 'wifi' : 'none',
  };

  return { isConnected, isLoading, networkState };
};
