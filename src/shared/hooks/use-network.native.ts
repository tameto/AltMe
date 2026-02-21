import { useState, useEffect } from 'react';
import * as Network from 'expo-network';
import type { NetworkState } from '@/src/shared/types/platform';

type UseNetworkReturn = {
  isConnected: boolean;
  isLoading: boolean;
  networkState: NetworkState;
};

const mapNetworkType = (type: Network.NetworkStateType | undefined): NetworkState['type'] => {
  switch (type) {
    case Network.NetworkStateType.WIFI:
      return 'wifi';
    case Network.NetworkStateType.CELLULAR:
      return 'cellular';
    case Network.NetworkStateType.ETHERNET:
      return 'ethernet';
    case Network.NetworkStateType.NONE:
      return 'none';
    default:
      return 'unknown';
  }
};

export const useNetwork = (): UseNetworkReturn => {
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: null,
    type: 'unknown',
  });

  useEffect(() => {
    let mounted = true;

    const checkNetwork = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        if (mounted) {
          const connected = state.isConnected ?? true;
          setIsConnected(connected);
          setNetworkState({
            isConnected: connected,
            isInternetReachable: state.isInternetReachable ?? null,
            type: mapNetworkType(state.type),
          });
          setIsLoading(false);
        }
      } catch {
        if (mounted) {
          setIsConnected(true);
          setIsLoading(false);
        }
      }
    };

    checkNetwork();

    const subscription = Network.addNetworkStateListener((state) => {
      if (mounted) {
        const connected = state.isConnected ?? true;
        setIsConnected(connected);
        setNetworkState({
          isConnected: connected,
          isInternetReachable: state.isInternetReachable ?? null,
          type: mapNetworkType(state.type),
        });
      }
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return { isConnected, isLoading, networkState };
};
