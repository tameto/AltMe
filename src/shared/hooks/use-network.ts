import { useState, useEffect } from 'react';
import * as Network from 'expo-network';

type NetworkState = {
  isConnected: boolean;
  isLoading: boolean;
};

export const useNetwork = (): NetworkState => {
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkNetwork = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        if (mounted) {
          setIsConnected(state.isConnected ?? true);
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

    // Poll network state every 5 seconds
    const interval = setInterval(checkNetwork, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { isConnected, isLoading };
};
