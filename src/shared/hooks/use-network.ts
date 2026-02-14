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

    // Initial check
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

    // Event-driven listener instead of polling
    const subscription = Network.addNetworkStateListener((state) => {
      if (mounted) {
        setIsConnected(state.isConnected ?? true);
      }
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return { isConnected, isLoading };
};
