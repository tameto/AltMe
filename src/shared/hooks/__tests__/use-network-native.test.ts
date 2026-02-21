import { renderHook, act, waitFor } from '@testing-library/react-native';

const mockGetNetworkStateAsync = jest.fn();
const mockAddNetworkStateListener = jest.fn();
const mockRemoveSubscription = jest.fn();

jest.mock('expo-network', () => ({
  getNetworkStateAsync: (...args: unknown[]) => mockGetNetworkStateAsync(...args),
  addNetworkStateListener: (...args: unknown[]) => mockAddNetworkStateListener(...args),
  NetworkStateType: {
    NONE: 'NONE',
    WIFI: 'WIFI',
    CELLULAR: 'CELLULAR',
    ETHERNET: 'ETHERNET',
    BLUETOOTH: 'BLUETOOTH',
    VPN: 'VPN',
    OTHER: 'OTHER',
    UNKNOWN: 'UNKNOWN',
  },
}));

import { useNetwork } from '../use-network.native';

describe('useNetwork (Native)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNetworkStateAsync.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: 'WIFI',
    });
    mockAddNetworkStateListener.mockReturnValue({
      remove: mockRemoveSubscription,
    });
  });

  it('starts with isLoading=true and fetches initial state', async () => {
    const { result } = renderHook(() => useNetwork());

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isConnected).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isConnected).toBe(true);
    expect(mockGetNetworkStateAsync).toHaveBeenCalledTimes(1);
  });

  it('reflects disconnected state from initial check', async () => {
    mockGetNetworkStateAsync.mockResolvedValue({
      isConnected: false,
      isInternetReachable: false,
      type: 'NONE',
    });

    const { result } = renderHook(() => useNetwork());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.networkState).toEqual({
      isConnected: false,
      isInternetReachable: false,
      type: 'none',
    });
  });

  it('updates state when network listener fires', async () => {
    let listenerCallback: (state: { isConnected: boolean; isInternetReachable: boolean; type: string }) => void;
    mockAddNetworkStateListener.mockImplementation((cb) => {
      listenerCallback = cb;
      return { remove: mockRemoveSubscription };
    });

    const { result } = renderHook(() => useNetwork());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isConnected).toBe(true);

    // Simulate going offline
    act(() => {
      listenerCallback({
        isConnected: false,
        isInternetReachable: false,
        type: 'NONE',
      });
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.networkState.type).toBe('none');
  });

  it('maps network types correctly', async () => {
    mockGetNetworkStateAsync.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: 'CELLULAR',
    });

    const { result } = renderHook(() => useNetwork());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.networkState.type).toBe('cellular');
  });

  it('handles getNetworkStateAsync failure gracefully', async () => {
    mockGetNetworkStateAsync.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useNetwork());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Falls back to connected=true
    expect(result.current.isConnected).toBe(true);
  });

  it('cleans up subscription on unmount', async () => {
    const { result, unmount } = renderHook(() => useNetwork());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    unmount();

    expect(mockRemoveSubscription).toHaveBeenCalledTimes(1);
  });

  it('returns networkState with isInternetReachable', async () => {
    mockGetNetworkStateAsync.mockResolvedValue({
      isConnected: true,
      isInternetReachable: false,
      type: 'WIFI',
    });

    const { result } = renderHook(() => useNetwork());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.networkState).toEqual({
      isConnected: true,
      isInternetReachable: false,
      type: 'wifi',
    });
  });

  it('handles ethernet network type', async () => {
    let listenerCallback: (state: { isConnected: boolean; isInternetReachable: boolean; type: string }) => void;
    mockAddNetworkStateListener.mockImplementation((cb) => {
      listenerCallback = cb;
      return { remove: mockRemoveSubscription };
    });

    const { result } = renderHook(() => useNetwork());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      listenerCallback({
        isConnected: true,
        isInternetReachable: true,
        type: 'ETHERNET',
      });
    });

    expect(result.current.networkState.type).toBe('ethernet');
  });

  it('handles unknown network type', async () => {
    mockGetNetworkStateAsync.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: 'BLUETOOTH',
    });

    const { result } = renderHook(() => useNetwork());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.networkState.type).toBe('unknown');
  });
});
