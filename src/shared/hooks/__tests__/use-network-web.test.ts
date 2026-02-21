/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react-native';

// Must mock before import — Web version doesn't use expo-network
jest.mock('expo-network', () => ({}));

// Import the web-specific implementation directly
// In the web jest project, Metro resolves use-network.web.ts automatically,
// but here we import it explicitly for clarity.
import { useNetwork } from '../use-network.web';

describe('useNetwork (Web)', () => {
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');

  beforeEach(() => {
    // Reset navigator.onLine to true
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    });
  });

  afterAll(() => {
    if (originalNavigator) {
      Object.defineProperty(globalThis, 'navigator', originalNavigator);
    }
  });

  it('returns isConnected=true when navigator.onLine is true', () => {
    const { result } = renderHook(() => useNetwork());

    expect(result.current.isConnected).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('returns isConnected=false when navigator.onLine is false', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: false,
    });

    const { result } = renderHook(() => useNetwork());

    expect(result.current.isConnected).toBe(false);
  });

  it('updates to offline when offline event fires', () => {
    const { result } = renderHook(() => useNetwork());

    expect(result.current.isConnected).toBe(true);

    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isConnected).toBe(false);
  });

  it('updates to online when online event fires', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: false,
    });

    const { result } = renderHook(() => useNetwork());

    expect(result.current.isConnected).toBe(false);

    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isConnected).toBe(true);
  });

  it('returns networkState with correct type when online', () => {
    const { result } = renderHook(() => useNetwork());

    expect(result.current.networkState).toEqual({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    });
  });

  it('returns networkState with type=none when offline', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: false,
    });

    const { result } = renderHook(() => useNetwork());

    expect(result.current.networkState).toEqual({
      isConnected: false,
      isInternetReachable: false,
      type: 'none',
    });
  });

  it('cleans up event listeners on unmount', () => {
    const addSpy = jest.spyOn(window, 'addEventListener');
    const removeSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useNetwork());

    expect(addSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith('offline', expect.any(Function));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('offline', expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
