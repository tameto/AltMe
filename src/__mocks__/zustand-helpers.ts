import type { StoreApi } from 'zustand';

/**
 * Reset a Zustand store to its initial state.
 * Works with stores created via `create<T>()`.
 *
 * Usage:
 *   import { useMyStore } from '@/src/features/my/store';
 *   afterEach(() => resetStore(useMyStore));
 */
export const resetStore = <T>(store: StoreApi<T>): void => {
  const initialState = store.getInitialState();
  store.setState(initialState, true);
};

/**
 * Reset multiple Zustand stores at once.
 *
 * Usage:
 *   afterEach(() => resetStores([useAuthStore, useUser, useSubscription]));
 */
export const resetStores = (stores: StoreApi<unknown>[]): void => {
  for (const store of stores) {
    resetStore(store);
  }
};
